import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { CompetitorReport, Competitor } from "../types";
import { generateCompetitorReport } from "../services/gemini";
import {
  FileText,
  Sparkles,
  Loader2,
  X,
  Heart,
  CheckCircle2,
  Circle,
  ArrowRightLeft,
  Trash2,
  History,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../authStore";

import { applyMedicalVocabulary } from "../utils/textProcessing";

// 产品类型列表
const PRODUCT_CATEGORIES = [
  "跳蛋",
  "震动棒",
  "伸缩棒",
  "缩阴球",
  "AV棒",
  "吮吸器",
  "飞机杯",
  "阴茎环",
  "倒模",
  "按摩器",
  "训练器",
  "肛门震动器",
  "肛塞器",
  "其他",
];

const CompetitorReportAnalysis: React.FC = () => {
  const {
    competitors,
    favoriteProducts,
    fetchFavorites,
    medicalTerms,
    competitorReports,
    fetchCompetitorReports,
    saveCompetitorReport,
    deleteCompetitorReport,
    selectedProductIds,
    toggleProductSelection,
    setSelectedProductIds,
  } = useStore();

  // Own Product State
  const [ownProduct, setOwnProduct] = useState<{
    name: string;
    price: number;
    category?: string;
    tags?: string;
    description?: string;
  }>({
    name: "",
    price: 0,
    category: "",
    tags: "",
    description: "",
  });

  // Competitor Selection State
  const [competitorReport, setCompetitorReport] =
    useState<CompetitorReport | null>(null);
  const [isGeneratingCompetitorReport, setIsGeneratingCompetitorReport] =
    useState(false);

  // Load favorites on component mount
  useEffect(() => {
    fetchFavorites();
    fetchCompetitorReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get favorite products with full details
  const getFavoriteProducts = () => {
    return favoriteProducts.map((fav) => {
      // Try to find current product and competitor (for latest updates)
      const comp = competitors.find((c) => c.id === fav.competitorId);
      const currentProduct = comp?.products?.find(
        (p) => p.id === fav.productId,
      );

      // Use current product if exists (for latest data), otherwise use saved complete product
      const product = currentProduct || fav.product;
      const competitor: Competitor = comp || {
        id: fav.competitorId,
        name: fav.competitorName,
        domain: "",
        sentiment: {
          material: 50,
          noise: 50,
          privacy: 50,
          easeOfUse: 50,
          value: 50,
        },
        isDomestic: fav.isDomestic ?? true,
      };

      return { product, competitor, savedInfo: fav };
    });
  };

  // Get all products from competitors
  const getAllProducts = () => {
    return competitors.flatMap((comp) =>
      (comp.products || []).map((product) => ({
        product,
        competitor: comp,
      })),
    );
  };

  const handleGenerateCompetitorReport = async () => {
    if (
      !ownProduct.name ||
      !ownProduct.price ||
      selectedProductIds.length === 0
    ) {
      alert("请填写自身产品信息并选择至少一个竞品");
      return;
    }

    if (useAuthStore.getState().isGuest) {
      alert("访客模式仅供查看，无权进行生成操作。");
      return;
    }

    setIsGeneratingCompetitorReport(true);
    setCompetitorReport(null);

    try {
      let selectedCompetitorProducts = getAllProducts()
        .filter(({ product }) => selectedProductIds.includes(product.id))
        .map(({ product, competitor }) => ({
          product: {
            ...product,
            analysis: product.analysis
              ? {
                  ...product.analysis,
                  summary: applyMedicalVocabulary(
                    product.analysis.summary || "",
                    medicalTerms,
                  ),
                  pros: product.analysis.pros.map((p) =>
                    applyMedicalVocabulary(p, medicalTerms),
                  ),
                  cons: product.analysis.cons.map((c) =>
                    applyMedicalVocabulary(c, medicalTerms),
                  ),
                }
              : undefined,
            tags: Array.isArray(product.tags)
              ? product.tags.map((t) => applyMedicalVocabulary(t, medicalTerms))
              : typeof product.tags === "string"
                ? applyMedicalVocabulary(product.tags, medicalTerms)
                : product.tags,
          },
          competitor,
        }));

      const processedOwnDescription = applyMedicalVocabulary(
        ownProduct.description || "",
        medicalTerms,
      );
      const processedOwnTags = applyMedicalVocabulary(
        ownProduct.tags || "",
        medicalTerms,
      );

      let finalOwnProduct = {
        name: ownProduct.name,
        price: ownProduct.price,
        category: ownProduct.category || "",
        tags: processedOwnTags
          ? processedOwnTags.split("，").map((t) => t.trim())
          : [],
        description: processedOwnDescription,
      };
      const report = await generateCompetitorReport(
        finalOwnProduct,
        selectedCompetitorProducts,
        selectedCompetitorProducts[0]?.competitor.isDomestic ?? true,
      );
      setCompetitorReport(report);
      await saveCompetitorReport(
        "custom",
        {
          ownProduct: finalOwnProduct,
          selectedCompetitorProducts,
          isDomestic:
            selectedCompetitorProducts[0]?.competitor.isDomestic ?? true,
        },
        report,
      );
    } catch (error) {
      console.error("Competitor report generation failed", error);
      alert("生成竞品报告失败，请检查 API Key");
    } finally {
      setIsGeneratingCompetitorReport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} />
          <h1 className="text-2xl font-bold">竞品报告分析</h1>
        </div>
        <p className="text-purple-100 text-sm">
          输入自身产品信息，选择竞品，生成专业的竞品分析报告
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Own Product Input Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600" />
              自身产品信息
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  产品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入产品名称"
                  value={ownProduct.name || ""}
                  onChange={(e) =>
                    setOwnProduct({ ...ownProduct, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    价格 (¥) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={ownProduct.price || ""}
                    onChange={(e) =>
                      setOwnProduct({
                        ...ownProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    产品类型
                  </label>
                  <select
                    value={ownProduct.category || ""}
                    onChange={(e) =>
                      setOwnProduct({
                        ...ownProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">选择类型</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  核心卖点/标签
                </label>
                <input
                  type="text"
                  placeholder="用逗号分隔，如：静音、防水、APP控制"
                  value={ownProduct.tags || ""}
                  onChange={(e) =>
                    setOwnProduct({ ...ownProduct, tags: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  产品描述（可选）
                </label>
                <textarea
                  placeholder="详细描述产品特点、功能等..."
                  value={ownProduct.description || ""}
                  onChange={(e) =>
                    setOwnProduct({
                      ...ownProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Competitor Selection */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart size={20} className="text-red-500 fill-current" />
              选择竞品
              <span className="text-sm font-normal text-gray-500">
                ({selectedProductIds.length} 已选)
              </span>
            </h2>

            {getAllProducts().length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Heart size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">暂无可对比产品</p>
                <p className="text-xs text-gray-400">
                  前往产品库添加更多产品以进行对比
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getAllProducts().map(({ product, competitor: comp }) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-sm font-bold text-gray-800 truncate">
                              {product.name}
                            </h3>
                            {product.category && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200 shrink-0">
                                {product.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {comp.name} · ¥{product.price}
                          </p>
                        </div>
                        {isSelected ? (
                          <CheckCircle2
                            size={20}
                            className="text-purple-600 shrink-0"
                          />
                        ) : (
                          <Circle
                            size={20}
                            className="text-gray-300 shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateCompetitorReport}
            disabled={
              !ownProduct.name ||
              !ownProduct.price ||
              selectedProductIds.length === 0 ||
              isGeneratingCompetitorReport
            }
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isGeneratingCompetitorReport ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                生成竞品报告
              </>
            )}
          </button>

          {/* History List */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History size={20} className="text-indigo-600" />
              历史报告
            </h2>
            {competitorReports.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                暂无历史报告
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {competitorReports.map((saved) => (
                  <div
                    key={saved.id}
                    className="p-3 border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                    onClick={() => {
                      if (saved.mode !== "custom") {
                        alert(
                          "产品库对比模式已下线，仅保留历史记录，无法再次查看详情。",
                        );
                        return;
                      }
                      setCompetitorReport(saved.report);
                      setOwnProduct(saved.params.ownProduct || ownProduct);
                      const ids =
                        saved.params.selectedCompetitorProducts?.map(
                          (p: any) => p.product.id,
                        ) || [];
                      if (ids.length > 0) setSelectedProductIds(ids);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {saved.mode === "custom"
                          ? "自身 VS 竞品"
                          : "产品库对比"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("确认删除这条历史记录吗？")) {
                            deleteCompetitorReport(saved.id);
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-sm font-medium text-gray-800 line-clamp-2">
                      {saved.mode === "custom"
                        ? `${saved.params.ownProduct?.name || "未知自身产品"} VS ${saved.params.selectedCompetitorProducts?.map((p: any) => p.product.name).join(", ") || "未知竞品"}`
                        : `${saved.params.productA?.name || "未知产品A"} VS ${saved.params.productB?.name || "未知产品B"}`}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(saved.created_at).toLocaleDateString()}{" "}
                        {new Date(saved.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-indigo-400 group-hover:text-indigo-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Report Result */}
        <div className="lg:col-span-2">
          {competitorReport ? (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={24} className="text-purple-600" />
                  竞品分析报告
                </h2>
                <button
                  onClick={() => setCompetitorReport(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                {/* Own Product Info */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
                  <h3 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <Sparkles size={16} />
                    自身产品信息
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">
                        产品名称：
                      </span>
                      <span className="text-gray-800 font-bold ml-2">
                        {ownProduct.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">价格：</span>
                      <span className="text-gray-800 font-bold ml-2">
                        ¥{ownProduct.price}
                      </span>
                    </div>
                    {ownProduct.category && (
                      <div>
                        <span className="text-gray-600 font-medium">
                          类型：
                        </span>
                        <span className="text-gray-800 font-bold ml-2">
                          {ownProduct.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison Analysis */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-700 mb-3">
                    对比分析
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {competitorReport.comparison}
                  </p>
                </div>

                {/* Own Advantages */}
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                  <h3 className="text-sm font-bold text-green-700 mb-3">
                    自身优势
                  </h3>
                  <ul className="space-y-2">
                    {competitorReport.ownAdvantages?.map((adv, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-green-600 font-bold mt-0.5">
                          ✓
                        </span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Own Weaknesses */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                  <h3 className="text-sm font-bold text-red-700 mb-3">
                    自身劣势
                  </h3>
                  <ul className="space-y-2">
                    {competitorReport.ownWeaknesses?.map((weak, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-red-600 font-bold mt-0.5">⚠</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Competitor Advantages */}
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                  <h3 className="text-sm font-bold text-purple-700 mb-3">
                    竞品优势分析
                  </h3>
                  <div className="space-y-4">
                    {competitorReport.competitorAdvantages?.map((item, i) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-lg border border-purple-100"
                      >
                        <h4 className="text-sm font-bold text-purple-700 mb-2">
                          {item.productName}
                        </h4>
                        <ul className="space-y-1.5">
                          {item.advantages.map((adv, j) => (
                            <li
                              key={j}
                              className="text-sm text-gray-700 flex items-start gap-2"
                            >
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                  <h3 className="text-sm font-bold text-orange-700 mb-3">
                    改进建议
                  </h3>
                  <ul className="space-y-2">
                    {competitorReport.improvementSuggestions?.map((sug, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-orange-600 font-bold mt-0.5">
                          →
                        </span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Market Strategy */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    市场策略建议
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {competitorReport.marketStrategy ||
                      competitorReport.summary}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 text-center">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-600 mb-2">
                等待生成报告
              </h3>
              <p className="text-sm text-gray-400">
                填写左侧表单并选择竞品后，点击"生成竞品报告"按钮
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorReportAnalysis;
