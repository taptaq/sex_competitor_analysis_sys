import React, { useState } from "react";
import { useStore } from "../store";
import ProductComparison from "./ProductComparison";
import {
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  Trophy,
  TrendingDown,
  GitCompare,
  Download,
  Image as ImageIcon,
  History,
  Clock,
  X,
  FileText,
} from "lucide-react";
import { getDeepComparison } from "../services/gemini";
import { ComparisonAnalysis, ViewType } from "../types";
import { supabase } from "../services/supabase";

const GlobalProductComparison: React.FC = () => {
  const {
    competitors,
    selectedProductIds,
    toggleProductSelection,
    clearSelection,
    setCurrentView,
  } = useStore();
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    competitors.length > 0 ? competitors[0].id : "",
  );
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ComparisonAnalysis | null>(null);
  const [showDeductions, setShowDeductions] = useState<Record<string, boolean>>(
    {},
  );
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyProducts, setHistoryProducts] = useState<any[]>([]);

  // Find the currently selected brand object
  const selectedBrand = competitors.find((c) => c.id === selectedBrandId);

  // Find all selected products across all competitors for the comparison table
  const selectedProductsForPK =
    historyProducts.length > 0
      ? historyProducts
      : competitors.flatMap((comp) =>
          (comp.products || []).filter((prod) =>
            selectedProductIds.includes(prod.id),
          ),
        );

  const handleDeepAnalysis = async () => {
    if (selectedProductsForPK.length < 2) {
      alert("请至少选择两个产品进行深度对比");
      return;
    }
    setLoading(true);
    setHistoryProducts([]);
    try {
      const hasDomestic = competitors.some(
        (c) =>
          c.isDomestic &&
          c.products?.some((p) => selectedProductIds.includes(p.id)),
      );
      const result = await getDeepComparison(
        selectedProductsForPK,
        hasDomestic,
      );
      setAnalysisResult(result);
      await saveAnalysisToHistory(result, selectedProductsForPK);
    } catch (error) {
      console.error("Deep analysis failed", error);
      alert("分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleDeduction = (productId: string) => {
    setShowDeductions((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      loadHistory();
    }
  };

  const saveAnalysisToHistory = async (
    analysis: ComparisonAnalysis,
    products: any[],
  ) => {
    try {
      // Stripping heavy fields before saving to DB is also good practice, usually DB stores JSONB.
      // But let's just save for now.
      const { error } = await supabase.from("comparison_history").insert({
        analysis: analysis,
        products: products,
        product_ids: products.map((p) => p.id),
        product_names: products.map((p) => p.name),
      });

      if (error) console.error("Failed to save analysis history:", error);
    } catch (error) {
      console.error("Failed to save analysis history:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("comparison_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistoryRecords(data || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  // ...

  const deleteHistoryRecord = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这条历史记录吗？")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comparison_history")
        .delete()
        .eq("id", recordId);

      if (!error) {
        loadHistory();
        if (
          analysisResult &&
          historyRecords.find((r) => r.id === recordId)?.analysis ===
            analysisResult
        ) {
          setAnalysisResult(null);
          setHistoryProducts([]);
        }
      } else {
        alert("删除失败，请稍后重试");
      }
    } catch (error) {
      console.error("Failed to delete history record:", error);
      alert("删除失败，请稍后重试");
    }
  };

  const clearAllHistory = async () => {
    if (!confirm("确定要清空所有历史记录吗？此操作不可恢复！")) {
      return;
    }

    try {
      // Delete all (using neq id '0' is a trick if using RLS/safe mode, but typically direct delete without where is cleaner if allowed)
      // Supabase JS often requires at least one filter for delete to prevent accidental wipe, or it's fine.
      // Standard way: .neq('id', '00000000-0000-0000-0000-000000000000')
      const { error } = await supabase
        .from("comparison_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (!error) {
        setHistoryRecords([]);
        setAnalysisResult(null);
        setHistoryProducts([]);
        alert("已清空所有历史记录");
      } else {
        alert("清空失败，请稍后重试");
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("清空失败，请稍后重试");
    }
  };

  const loadHistoryRecord = (record: any) => {
    setAnalysisResult(record.analysis);
    setShowHistory(false);

    // 如果历史记录中有完整的产品信息，直接使用
    if (record.products && record.products.length > 0) {
      setHistoryProducts(record.products);
    } else {
      // 否则尝试从当前系统中匹配产品
      const matchedProducts: any[] = [];

      if (record.product_ids && record.product_ids.length > 0) {
        // 先尝试通过 productIds 匹配
        record.product_ids.forEach((productId: string) => {
          competitors.forEach((comp) => {
            comp.products?.forEach((p) => {
              if (
                p.id === productId &&
                !matchedProducts.find((mp) => mp.id === p.id)
              ) {
                matchedProducts.push(p);
              }
            });
          });
        });
      }

      // 如果通过 ID 匹配不到，尝试通过名称匹配
      if (
        matchedProducts.length === 0 &&
        record.product_names &&
        record.product_names.length > 0
      ) {
        record.product_names.forEach((productName: string) => {
          competitors.forEach((comp) => {
            comp.products?.forEach((p) => {
              if (
                p.name === productName &&
                !matchedProducts.find((mp) => mp.id === p.id)
              ) {
                matchedProducts.push(p);
              }
            });
          });
        });
      }

      setHistoryProducts(matchedProducts);

      // 同时设置选中的产品ID，以便在对比表格中显示
      if (matchedProducts.length > 0) {
        clearSelection();
        matchedProducts.forEach((p) => {
          if (!selectedProductIds.includes(p.id)) {
            toggleProductSelection(p.id);
          }
        });
      }
    }

    // Scroll to analysis result
    setTimeout(() => {
      const element = document.querySelector("[data-analysis-result]");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const exportAnalysisReport = () => {
    if (!analysisResult) return;

    let report = `# AI 产品深度对比 PK 报告\n\n`;
    report += `**胜出产品**: ${
      selectedProductsForPK.find((p) => p.name === analysisResult.winnerName)
        ?.name
    }\n`;
    report += `**推荐理由**: ${analysisResult.bestValueReason}\n\n`;

    report += `## 综合得分情况\n\n`;
    analysisResult.comparisonScores.forEach((scoreInfo) => {
      const product = selectedProductsForPK.find(
        (p) => p.name === scoreInfo.name,
      );
      report += `### ${product?.name} (总分: ${scoreInfo.totalScore})\n`;
      scoreInfo.dimensions.forEach((dim) => {
        report += `- **${dim.label}**: ${dim.score}/100\n`;
        report += `  - *原因*: ${dim.reason}\n`;
        if (dim.deduction) report += `  - *扣分项*: ${dim.deduction}\n`;
      });
      report += `\n`;
    });

    report += `## 分析师总结\n\n`;
    report += `${analysisResult.summary}\n\n`;
    report += `--- \n*报告生成日期: ${new Date().toLocaleString()}*`;

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pk_analysis_report_${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              产品深度对比 (PK)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              先选择品牌，再挑选具体产品进入对比列表
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShowHistory}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition font-medium border border-gray-200"
            >
              <History size={16} /> 历史记录
            </button>
            {selectedProductIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
              >
                <Trash2 size={16} /> 清空对比列表 ({selectedProductIds.length})
              </button>
            )}
            <button
              onClick={handleDeepAnalysis}
              disabled={loading || selectedProductIds.length < 2}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg shadow-purple-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              AI 深度全维度 PK
            </button>
          </div>
        </div>

        {/* Brand Selector */}
        <div className="flex flex-wrap gap-2">
          {competitors.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedBrandId(comp.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedBrandId === comp.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>

        {/* Product Selector for Current Brand */}
        {selectedBrand ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBrand.products?.map((product) => {
              const fsProduct = competitors
                .flatMap((c) => c.products || [])
                .find((p) => selectedProductIds.includes(p.id));
              const limitCategory = fsProduct?.category;
              const isSelected = selectedProductIds.includes(product.id);

              const isCategoryMismatch =
                limitCategory &&
                product.category &&
                limitCategory !== product.category &&
                !isSelected;

              const isDisabled = !!isCategoryMismatch;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!isDisabled) toggleProductSelection(product.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100 grayscale"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : !isDisabled &&
                        "border-gray-100 bg-white hover:border-purple-200"
                  }`}
                  title={
                    isDisabled
                      ? `不可选: 需与首个选择的产品品类 (${
                          limitCategory || "未知"
                        }) 保持一致`
                      : ""
                  }
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        className="w-full h-full object-cover"
                        alt={product.name}
                      />
                    ) : (
                      <ImageIcon size={20} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">¥ {product.price}</p>
                      {product.gender && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                            product.gender === "Male"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : product.gender === "Female"
                                ? "bg-pink-100 text-pink-700 border-pink-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {product.gender === "Male"
                            ? "男用"
                            : product.gender === "Female"
                              ? "女用"
                              : "通用"}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border bg-purple-50 text-purple-700 border-purple-100">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle2
                      size={20}
                      className="text-green-500 shrink-0"
                    />
                  ) : (
                    !isDisabled && (
                      <Circle
                        size={20}
                        className="text-gray-200 shrink-0 hover:text-purple-300"
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">请先添加竞品品牌</p>
          </div>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History size={20} /> 分析历史记录
              {historyRecords.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({historyRecords.length} 条)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              {historyRecords.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-medium border border-red-200"
                >
                  <Trash2 size={14} /> 清空全部
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {historyRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyRecords.map((record) => (
                <div
                  key={record.id}
                  className="group relative p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div
                    onClick={() => loadHistoryRecord(record)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-800 text-sm mb-1">
                          {record.product_names?.join(" vs ")}
                        </h5>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(record.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">
                        胜出: {record.analysis.winnerName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {record.analysis.summary}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteHistoryRecord(record.id, e)}
                    className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除此记录"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Deep Analysis Results */}
      {analysisResult && (
        <div
          data-analysis-result
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6"
        >
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Sparkles size={120} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                  <div className="p-2 bg-yellow-400 text-yellow-900 rounded-lg shrink-0">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic">
                      PK 结论:{" "}
                      {selectedProductsForPK.find(
                        (p) => p.name === analysisResult.winnerName,
                      )?.name || "胜出者"}
                    </h4>
                    <p className="text-purple-200 text-sm mt-1 line-clamp-4">
                      {analysisResult.bestValueReason}
                    </p>
                  </div>
                </div>

                <button
                  onClick={exportAnalysisReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm font-bold active:scale-95 shrink-0"
                >
                  <Download size={16} />
                  导出分析报告 (.md)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysisResult.comparisonScores.map((scoreInfo) => {
                  const product = selectedProductsForPK.find(
                    (p) => p.name === scoreInfo.name,
                  );
                  return (
                    <div
                      key={scoreInfo.productId}
                      className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-bold text-purple-300 truncate">
                              {product?.name}
                            </span>
                            {product?.gender && (
                              <span
                                className={`text-[10px] px-1 py-0.5 rounded font-bold border shrink-0 ${
                                  product.gender === "Male"
                                    ? "bg-blue-500/30 text-blue-200 border-blue-400/30"
                                    : product.gender === "Female"
                                      ? "bg-pink-500/30 text-pink-200 border-pink-400/30"
                                      : "bg-gray-500/30 text-gray-200 border-gray-400/30"
                                }`}
                              >
                                {product.gender === "Male"
                                  ? "男用"
                                  : product.gender === "Female"
                                    ? "女用"
                                    : "通用"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-lg font-black text-white ml-2">
                          {scoreInfo.totalScore}{" "}
                          <span className="text-[10px] font-normal opacity-60">
                            pts
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-400 h-full"
                          style={{ width: `${scoreInfo.totalScore}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm leading-relaxed text-indigo-100 bg-black/20 p-4 rounded-xl border border-white/5 mb-4">
                <span className="font-bold">分析师点评: </span>
                {analysisResult.summary}
              </p>

              <button
                onClick={() => setCurrentView(ViewType.COMPETITOR_REPORT)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FileText size={18} />
                前往生成深度竞品报告
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisResult.comparisonScores.map((scoreInfo) => {
              const product = selectedProductsForPK.find(
                (p) => p.name === scoreInfo.name,
              );
              const isWinner = scoreInfo.name === analysisResult.winnerName;

              return (
                <div
                  key={scoreInfo.productId}
                  className={`bg-white p-6 rounded-2xl border shadow-sm space-y-4 ${
                    isWinner
                      ? "border-yellow-400 ring-2 ring-yellow-50"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-gray-800 flex items-center gap-2">
                      {product?.name}
                      {isWinner && (
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          🏆 推荐之选
                        </span>
                      )}
                    </h5>
                    <span className="text-2xl font-black text-purple-600">
                      {scoreInfo.totalScore}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {scoreInfo.dimensions.map((dim, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 font-medium">
                            {dim.label}
                          </span>
                          <span
                            className={`${
                              dim.score > 80
                                ? "text-green-600"
                                : "text-orange-500"
                            } font-bold`}
                          >
                            {dim.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              dim.score > 80
                                ? "bg-green-500"
                                : dim.score > 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${dim.score}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          {dim.reason}
                        </p>

                        {dim.deduction && (
                          <div className="mt-2 pl-2 border-l-2 border-red-100">
                            <p className="text-[10px] text-red-500 flex items-center gap-1">
                              <TrendingDown size={10} /> {dim.deduction}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          对比详情清单{" "}
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
            {selectedProductsForPK.length}
          </span>
        </h4>

        {selectedProductsForPK.length > 0 ? (
          <ProductComparison products={selectedProductsForPK} />
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <GitCompare size={32} className="text-gray-400" />
            </div>
            <h4 className="text-gray-800 font-bold mb-2"> PK 列表为空</h4>
            <p className="text-gray-500 max-w-xs text-sm">
              在上方的列表中勾选你感兴趣的产品，即可在这里看到详尽的多维度对比报告。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalProductComparison;
