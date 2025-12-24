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
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { getDeepComparison } from "../services/gemini";
import { ComparisonAnalysis } from "../types";

const GlobalProductComparison: React.FC = () => {
  const {
    competitors,
    selectedProductIds,
    toggleProductSelection,
    clearSelection,
  } = useStore();
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    competitors.length > 0 ? competitors[0].id : ""
  );
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ComparisonAnalysis | null>(null);
  const [showDeductions, setShowDeductions] = useState<Record<string, boolean>>(
    {}
  );

  // Find the currently selected brand object
  const selectedBrand = competitors.find((c) => c.id === selectedBrandId);

  // Find all selected products across all competitors for the comparison table
  const selectedProductsForPK = competitors.flatMap((comp) =>
    (comp.products || []).filter((prod) => selectedProductIds.includes(prod.id))
  );

  const handleDeepAnalysis = async () => {
    if (selectedProductsForPK.length < 2) {
      alert("请至少选择两个产品进行深度对比");
      return;
    }
    setLoading(true);
    try {
      // Check if any product is domestic to decide AI routing
      const hasDomestic = competitors.some(
        (c) =>
          c.isDomestic &&
          c.products?.some((p) => selectedProductIds.includes(p.id))
      );
      const result = await getDeepComparison(
        selectedProductsForPK,
        hasDomestic
      );
      setAnalysisResult(result);
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

  const exportAnalysisReport = () => {
    if (!analysisResult) return;

    let report = `# AI 产品深度对比 PK 报告\n\n`;
    report += `**胜出产品**: ${
      selectedProductsForPK.find((p) => p.id === analysisResult.winnerId)?.name
    }\n`;
    report += `**推荐理由**: ${analysisResult.bestValueReason}\n\n`;

    report += `## 综合得分情况\n\n`;
    analysisResult.comparisonScores.forEach((scoreInfo) => {
      const product = selectedProductsForPK.find(
        (p) => p.id === scoreInfo.productId
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
              const isSelected = selectedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProductSelection(product.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-purple-200"
                  }`}
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
                    <p className="text-xs text-gray-500">¥ {product.price}</p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2
                      size={20}
                      className="text-green-500 shrink-0"
                    />
                  ) : (
                    <Circle
                      size={20}
                      className="text-gray-200 shrink-0 hover:text-purple-300"
                    />
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

      {/* AI Deep Analysis Results */}
      {analysisResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Sparkles size={120} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 text-yellow-900 rounded-lg">
                  <Trophy size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black italic">
                    PK 结论:{" "}
                    {selectedProductsForPK.find(
                      (p) => p.id === analysisResult.winnerId
                    )?.name || "胜出者"}
                  </h4>
                  <p className="text-purple-200 text-sm mt-1">
                    {analysisResult.bestValueReason}
                  </p>
                </div>
              </div>

              <div className="absolute top-8 right-8">
                <button
                  onClick={exportAnalysisReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm font-bold active:scale-95"
                >
                  <Download size={16} />
                  导出分析报告 (.md)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysisResult.comparisonScores.map((scoreInfo) => {
                  const product = selectedProductsForPK.find(
                    (p) => p.id === scoreInfo.productId
                  );
                  return (
                    <div
                      key={scoreInfo.productId}
                      className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-purple-300 truncate w-32">
                          {product?.name}
                        </span>
                        <span className="text-lg font-black text-white">
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

              <p className="text-sm leading-relaxed text-indigo-100 bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="font-bold">分析师点评: </span>
                {analysisResult.summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisResult.comparisonScores.map((scoreInfo) => {
              const product = selectedProductsForPK.find(
                (p) => p.id === scoreInfo.productId
              );
              const isWinner = scoreInfo.productId === analysisResult.winnerId;

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
