import React, { useState } from "react";
import { useStore } from "../store";
import * as XLSX from "xlsx";
import {
  FlaskConical,
  Activity,
  ShieldCheck,
  Scale,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Waves,
  Zap,
  Ear,
  HandMetal,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";
import { analyzeStandardization } from "../services/gemini";
import { applyMedicalVocabulary } from "../utils/textProcessing";

const StandardizationLab: React.FC = () => {
  const {
    competitors,
    saveStandardizationTest,
    standardizationTests,
    fetchStandardizationTests,
    deleteStandardizationTest,
    medicalTerms,
    fetchMedicalTerms,
    // addMedicalTerm, // No longer needed here
    // removeMedicalTerm, // No longer needed here
  } = useStore();
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // const [showMedicalVocab, setShowMedicalVocab] = useState(false); // Removed
  // const [newTerm, setNewTerm] = useState({ term: "", replacement: "" }); // Removed

  const [input, setInput] = useState({
    productName: "",
    description: "",
    parameters: "",
    reviews: "",
    isDomestic: true,
  });

  // Product Selection State
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const competitor = competitors.find((c) => c.id === selectedCompetitorId);
    const product = competitor?.products?.find((p) => p.id === productId);

    if (product && competitor) {
      setInput((prev) => ({
        ...prev,
        productName: product.name,
        // Prefer description, fallback to analysis summary
        description: product.analysis?.summary || "",
        // Format specs as JSON if available
        parameters: product.specs ? JSON.stringify(product.specs, null, 2) : "",
        isDomestic: competitor.isDomestic ?? true,
        reviews: "",
      }));
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!input.productName) {
      alert("请填写产品名称");
      return;
    }

    setIsLoading(true);
    try {
      // Parse parameters if it looks like JSON, otherwise treat as simple string map or just pass raw
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(input.parameters);
      } catch (e) {
        parsedParams = { raw: input.parameters };
      }

      // Split reviews by newline
      let reviewList = input.reviews.split("\n").filter((r) => r.trim());

      // *** Medical Vocabulary Replacement Logic ***
      const contextualDescription = applyMedicalVocabulary(
        input.description,
        medicalTerms
      );
      const contextualReviews = reviewList.map((r) =>
        applyMedicalVocabulary(r, medicalTerms)
      );

      console.log("Applied Medical Context:", {
        original: reviewList.length,
        terms: medicalTerms.length,
      });

      const data = await analyzeStandardization(
        input.productName,
        contextualDescription,
        parsedParams,
        contextualReviews.length > 0 ? contextualReviews : ["暂无用户评价"],
        input.isDomestic
      );

      setResult(data);

      // Auto-save record
      // Auto-save record
      await saveStandardizationTest({
        productName: input.productName,
        productId: selectedProductId || undefined,
        competitorId: selectedCompetitorId || undefined,
        description: input.description,
        parameters: parsedParams,
        reviewsSample: input.reviews,
        resultData: data,
      });
    } catch (error) {
      console.error(error);
      alert("分析失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const translateBiocompatibility = (level: string) => {
    const map: Record<string, string> = {
      "Medical Grade": "医用级",
      "Food Grade": "食品级",
      "Industrial Grade": "工业/玩具级",
      "Industrial/Toy Grade": "工业/玩具级",
      "Toy Grade": "工业/玩具级",
    };
    return map[level] || level;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FlaskConical size={32} />
            <div>
              <h1 className="text-2xl font-bold">产品测谎仪</h1>
              <p className="text-teal-100 text-sm mt-1">
                Industry Standardization Lab - 感官量化 · 医规合规 · 参数去噪
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setShowHistory(true);
                setIsHistoryLoading(true);
                try {
                  await fetchStandardizationTests();
                } finally {
                  setIsHistoryLoading(false);
                }
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              {isHistoryLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Activity size={16} />
              )}
              历史记录
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-teal-600" />
                分析历史档案
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isHistoryLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : standardizationTests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FlaskConical size={48} className="mx-auto mb-4 opacity-20" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {standardizationTests.map((test: any) => (
                    <div
                      key={test.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group bg-gray-50 hover:bg-white"
                      onClick={() => {
                        setResult(test.result_data);
                        setInput((prev) => ({
                          ...prev,
                          productName: test.product_name,
                          description: test.description || "",
                          parameters: test.parameters
                            ? typeof test.parameters === "string"
                              ? test.parameters
                              : JSON.stringify(test.parameters, null, 2)
                            : "",
                          reviews: test.reviews_sample || "",
                        }));
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                            {test.product_name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(test.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("确定要删除这条历史记录吗？")) {
                              setDeletingId(test.id);
                              await deleteStandardizationTest(test.id);
                              setDeletingId(null);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          disabled={deletingId === test.id}
                        >
                          {deletingId === test.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2 text-xs flex-wrap">
                        {test.result_data.sensoryIndices && (
                          <span
                            className={`px-2 py-1 rounded bg-white border ${
                              test.result_data.sensoryIndices
                                .penetrationIndex >= 8
                                ? "border-red-200 text-red-600"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            震感：
                            {test.result_data.sensoryIndices.penetrationIndex}
                          </span>
                        )}
                        {test.result_data.specVerification && (
                          <span className="px-2 py-1 rounded bg-white border border-blue-200 text-blue-600">
                            真实度：
                            {test.result_data.specVerification.realityScore}
                          </span>
                        )}
                        {test.result_data.complianceCheck
                          ?.biocompatibilityLevel && (
                          <span
                            className={`px-2 py-1 rounded bg-white border ${
                              translateBiocompatibility(
                                test.result_data.complianceCheck
                                  ?.biocompatibilityLevel
                              ) === "医用级"
                                ? "border-green-200 text-green-700"
                                : "border-yellow-200 text-yellow-700"
                            }`}
                          >
                            {translateBiocompatibility(
                              test.result_data.complianceCheck
                                ?.biocompatibilityLevel
                            )}
                          </span>
                        )}
                      </div>
                      {test.reviews_sample && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-2">
                          {test.reviews_sample.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Activity size={20} className="text-teal-600" />
              样本录入
            </h2>

            {/* Product Library Selection */}
            <div className="bg-teal-50 p-4 rounded-lg mb-6 border border-teal-100">
              <h3 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                <FlaskConical size={16} /> 从产品库导入数据
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <select
                    value={selectedCompetitorId}
                    onChange={(e) => {
                      setSelectedCompetitorId(e.target.value);
                      setSelectedProductId(""); // Reset product when competitor changes
                    }}
                    className="w-full p-2 border border-teal-200 rounded text-sm focus:outline-none focus:border-teal-400"
                  >
                    <option value="">选择品牌/竞品...</option>
                    {competitors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={!selectedCompetitorId}
                    className="w-full p-2 border border-teal-200 rounded text-sm focus:outline-none focus:border-teal-400 disabled:opacity-50"
                  >
                    <option value="">选择产品...</option>
                    {competitors
                      .find((c) => c.id === selectedCompetitorId)
                      ?.products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-teal-600 mt-2">
                * 选择后将自动填充下方名称、参数及描述信息（用户评价需单独导入）
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={input.productName}
                  onChange={(e) =>
                    setInput({ ...input, productName: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="例如：小怪兽 2代"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  市场区域
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={input.isDomestic}
                      onChange={() => setInput({ ...input, isDomestic: true })}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">国内市场 (CN)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!input.isDomestic}
                      onChange={() => setInput({ ...input, isDomestic: false })}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">
                      国际市场 (Global)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  物理参数 (TEXT/JSON)
                </label>
                <textarea
                  value={input.parameters}
                  onChange={(e) =>
                    setInput({ ...input, parameters: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 text-sm font-mono"
                  placeholder={
                    '例如：\n{\n  "material": "硅胶",\n  "size": "100x30mm"\n}'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品描述 / 营销文案
                </label>
                <textarea
                  value={input.description}
                  onChange={(e) =>
                    setInput({ ...input, description: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24"
                  placeholder="粘贴产品的官方介绍或营销文案..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    用户评价样本 (每行一条)
                  </label>
                  <label className="cursor-pointer text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors">
                    <Upload size={14} />
                    <span>导入文件</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".txt,.csv,.json,.xlsx,.xls"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;

                        const newReviews: string[] = [];

                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];

                          await new Promise<void>((resolve) => {
                            const reader = new FileReader();

                            if (file.name.match(/\.(xlsx|xls)$/)) {
                              reader.onload = (event) => {
                                const data = event.target?.result;
                                if (!data) {
                                  resolve();
                                  return;
                                }
                                try {
                                  const workbook = XLSX.read(data, {
                                    type: "array",
                                  });
                                  const firstSheetName = workbook.SheetNames[0];
                                  const worksheet =
                                    workbook.Sheets[firstSheetName];
                                  const jsonData = XLSX.utils.sheet_to_json(
                                    worksheet,
                                    { header: 1 }
                                  ) as any[][];

                                  if (jsonData.length > 0) {
                                    // Smart Column Detection
                                    const headerRow = jsonData[0].map((h) =>
                                      String(h).toLowerCase()
                                    );
                                    const targetKeywords = ["评论内容"];

                                    let contentColIndex = headerRow.findIndex(
                                      (h) =>
                                        targetKeywords.some((k) =>
                                          h.includes(k)
                                        )
                                    );

                                    let extracted: string[] = [];
                                    if (contentColIndex !== -1) {
                                      // Extract text from the identified column (skip header)
                                      extracted = jsonData
                                        .slice(1)
                                        .map((row) => row[contentColIndex])
                                        .filter(
                                          (cell) =>
                                            cell && typeof cell === "string"
                                        )
                                        .map((s) => s.trim())
                                        .filter((s) => s);
                                    } else {
                                      // Fallback: Try to find a column with long text (avg len > 10?) or just grab all strings
                                      // For now, falling back to previous behavior of grabbing all strings to be safe,
                                      // but we could be smarter here if needed.
                                      extracted = jsonData
                                        .flat()
                                        .filter(
                                          (item) =>
                                            item && typeof item === "string"
                                        ) // only strings
                                        .map((s) => s.trim())
                                        .filter((s) => s.length > 5); // simple filter for noise
                                    }
                                    newReviews.push(...extracted);
                                  }
                                } catch (err) {
                                  console.error(
                                    `Error parsing ${file.name}`,
                                    err
                                  );
                                  alert(`解析文件 ${file.name} 失败`);
                                }
                                resolve();
                              };
                              reader.readAsArrayBuffer(file);
                            } else {
                              // Text / JSON / CSV
                              reader.onload = (event) => {
                                const content = event.target?.result as string;
                                if (!content) {
                                  resolve();
                                  return;
                                }

                                if (file.name.endsWith(".json")) {
                                  try {
                                    const json = JSON.parse(content);
                                    if (Array.isArray(json)) {
                                      const extracted = json
                                        .map((item) =>
                                          typeof item === "string"
                                            ? item
                                            : item.content ||
                                              item.text ||
                                              item.review ||
                                              JSON.stringify(item)
                                        )
                                        .filter((s) => typeof s === "string");
                                      newReviews.push(...extracted);
                                    }
                                  } catch (err) {
                                    console.error("JSON Parse Error", err);
                                  }
                                } else {
                                  // Raw Text / CSV (Treating CSV as raw text for now, or could parse)
                                  // Simple assumption: file contains review text
                                  newReviews.push(content);
                                }
                                resolve();
                              };
                              reader.readAsText(file);
                            }
                          });
                        }

                        if (newReviews.length > 0) {
                          setInput((prev) => ({
                            ...prev,
                            // Append new reviews to existing ones with newline
                            reviews: prev.reviews
                              ? prev.reviews + "\n" + newReviews.join("\n")
                              : newReviews.join("\n"),
                          }));
                        }
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={input.reviews}
                  onChange={(e) =>
                    setInput({ ...input, reviews: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-32"
                  placeholder="震感很强，但是在体内声音有点大...\n材质很软，摸起来像皮肤一样..."
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <FlaskConical />
                )}
                开始标准化分析
              </button>
            </div>
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <FlaskConical size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">等待样本输入</p>
              <p className="text-sm">请输入左侧数据并运行分析</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 1. Sensory Quantification */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                  <Waves size={20} className="text-blue-500" />
                  感官体验量化 (Sensory Indices)
                </h3>

                <div className="grid gap-6">
                  {/* Penetration Index */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" />
                        震感穿透力 (Penetration)
                      </span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          result.sensoryIndices.penetrationIndex
                        )}`}
                      >
                        {result.sensoryIndices.penetrationIndex} / 10
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(
                          result.sensoryIndices.penetrationIndex
                        )} transition-all duration-1000`}
                        style={{
                          width: `${
                            result.sensoryIndices.penetrationIndex * 10
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        1 = 表层震动 (Surface) --- 10 = 深层共振 (Deep Tissue)
                      </p>
                    </div>
                    {/* Penetration Reasoning */}
                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      <strong>AI 评判：</strong>
                      {result.sensoryIndices.penetrationReasoning ||
                        "基于震感的深度与共振范围。低分代表震感仅停留在皮肤表层，随压力增加而衰减；高分代表震感能穿透肌肉组织，且在大功率输出下仍能保持浑厚不散。"}
                      {result.sensoryIndices.penetrationDeductions &&
                        result.sensoryIndices.penetrationDeductions !==
                          "None" && (
                          <div className="mt-1 pt-1 border-t border-gray-200 text-red-500">
                            <strong>扣分点：</strong>
                            {result.sensoryIndices.penetrationDeductions}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Acoustic Privacy */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Ear size={16} className="text-blue-500" />
                        声学隐秘度 (Acoustic Privacy)
                      </span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          result.sensoryIndices.acousticPrivacy
                        )}`}
                      >
                        {result.sensoryIndices.acousticPrivacy} / 10
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(
                          result.sensoryIndices.acousticPrivacy
                        )} transition-all duration-1000`}
                        style={{
                          width: `${
                            result.sensoryIndices.acousticPrivacy * 10
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        1 = 尖锐刺耳 (Loud) --- 10 = 沉闷静音 (Silent)
                      </p>
                    </div>
                    {/* Acoustic Privacy Reasoning */}
                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      <strong>AI 评判：</strong>
                      {result.sensoryIndices.acousticPrivacyReasoning ||
                        "综合考量噪音分贝值与声音频率。低分代表声音尖锐、机械感强且穿透性强；高分代表声音低沉闷响，在覆盖物下即便高档位也难以被旁人察觉。"}
                      {result.sensoryIndices.acousticPrivacyDeductions &&
                        result.sensoryIndices.acousticPrivacyDeductions !==
                          "None" && (
                          <div className="mt-1 pt-1 border-t border-gray-200 text-red-500">
                            <strong>扣分点：</strong>
                            {result.sensoryIndices.acousticPrivacyDeductions}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Skin Affinity */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <HandMetal size={16} className="text-pink-500" />
                        材质亲肤度 (Skin Affinity)
                      </span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          result.sensoryIndices.skinAffinity
                        )}`}
                      >
                        {result.sensoryIndices.skinAffinity} / 10
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(
                          result.sensoryIndices.skinAffinity
                        )} transition-all duration-1000`}
                        style={{
                          width: `${result.sensoryIndices.skinAffinity * 10}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        1 = 粘腻/粗糙 (Rough) --- 10 = 仿真/丝滑 (Silky)
                      </p>
                    </div>
                    {/* Skin Affinity Reasoning */}
                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      <strong>AI 评判：</strong>
                      {result.sensoryIndices.skinAffinityReasoning ||
                        "评估材质的触感真实度与表面处理工艺。低分代表材质有明显的塑料感、合模线粗糙或易吸附灰尘；高分代表触感接近真实肌肤，表面经过爽滑处理，亲肤且易于清洁。"}
                      {result.sensoryIndices.skinAffinityDeductions &&
                        result.sensoryIndices.skinAffinityDeductions !==
                          "None" && (
                          <div className="mt-1 pt-1 border-t border-gray-200 text-red-500">
                            <strong>扣分点：</strong>
                            {result.sensoryIndices.skinAffinityDeductions}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Compliance Check */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                  <ShieldCheck size={20} className="text-green-600" />
                  医规级合规映射 (Compliance Mapping)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      生物相容性等级 (Biocompatibility)
                    </span>
                    <div className="flex items-center gap-2">
                      {translateBiocompatibility(
                        result.complianceCheck.biocompatibilityLevel
                      ) === "医用级" ? (
                        <CheckCircle className="text-green-500" />
                      ) : (
                        <AlertTriangle className="text-yellow-500" />
                      )}
                      <span className="font-bold text-lg text-gray-800">
                        {translateBiocompatibility(
                          result.complianceCheck.biocompatibilityLevel
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      人体工学评分 (Ergonomics Score)
                    </span>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="text-teal-500" />
                      <span className="font-bold text-2xl text-gray-800">
                        {result.complianceCheck.ergonomicsScore}
                      </span>
                      <span className="text-sm text-gray-400">/ 10</span>
                    </div>
                  </div>
                </div>

                {result.complianceCheck.safetyFlags &&
                  result.complianceCheck.safetyFlags.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                      <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} /> 风险标记 (Safety Flags)
                      </h4>
                      <ul className="text-sm text-red-600 space-y-1 list-disc pl-4">
                        {result.complianceCheck.safetyFlags.map(
                          (flag: string, idx: number) => (
                            <li key={idx}>{flag}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>

              {/* 3. Spec Verification */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                  <Scale size={20} className="text-purple-600" />
                  参数去噪 & 真实性验证 (Verification)
                </h3>

                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-black ${getScoreColor(
                        result.specVerification.realityScore
                      )}`}
                    >
                      {result.specVerification.realityScore}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">真实性评分</div>
                  </div>
                  <div className="flex-1 text-sm text-gray-600 border-l pl-6">
                    <p>
                      该评分反映了营销文案与用户实际体验/物理参数之间的一致性。
                    </p>
                  </div>
                </div>

                {result.specVerification.marketingNoise &&
                  result.specVerification.marketingNoise.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        检测到的营销噪音 (Marketing Noise)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.specVerification.marketingNoise.map(
                          (tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200 line-through decoration-gray-400 decoration-2"
                            >
                              {tag}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardizationLab;
