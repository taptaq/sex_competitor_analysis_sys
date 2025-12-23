import React, { useState } from "react";
import { useStore } from "../store";
import { TagCloud } from "react-tagcloud";
import { Product, AdCreative, Review } from "../types";
import {
  Globe,
  ShoppingCart,
  ShieldAlert,
  ChevronLeft,
  Star,
  Plus,
  Sparkles,
  Upload,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { analyzeReviews } from "../services/gemini";
import * as XLSX from "xlsx";

const MOCK_ADS: AdCreative[] = [
  {
    id: "a1",
    image: "https://picsum.photos/seed/adcn1/400/250",
    text: "让愉悦自然发生。采用婴儿级液态硅胶，极致亲肤。",
    highlights: ["极致亲肤", "婴儿级"],
  },
  {
    id: "a2",
    image: "https://picsum.photos/seed/adcn2/400/250",
    text: "50分贝静音专利，深夜里的私密舞蹈。",
    highlights: ["专利静音", "私密性"],
  },
];

const CompetitorDetail: React.FC = () => {
  const {
    selectedCompetitorId,
    competitors,
    setSelectedCompetitor,

    setProductAnalysis,
    addProduct,
    updateProduct,
    removeProduct,
    addAd,
    updateAd,
    removeAd,
    setProductReviews,
    updateCompetitor,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"products" | "ads" | "reviews">(
    "products"
  );
  // Edit State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [tempDomain, setTempDomain] = useState("");
  // Analysis Edit State
  const [editingAnalysisProductId, setEditingAnalysisProductId] = useState<
    string | null
  >(null);
  const [tempAnalysis, setTempAnalysis] = useState<any>(null);

  // Form State for new/editing items
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [tempAd, setTempAd] = useState<Partial<AdCreative>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [analyzingProductId, setAnalyzingProductId] = useState<string | null>(
    null
  );
  // Removed newReviewText state as we are moving to file import

  const competitor = competitors.find((c) => c.id === selectedCompetitorId);

  if (!competitor) {
    return <div>Competitor not found</div>;
  }

  const handleSaveDomain = () => {
    updateCompetitor({ ...competitor, domain: tempDomain });
    setIsEditingDomain(false);
  };

  const handleAnalyze = async (product: Product) => {
    if (!product.reviews || product.reviews.length === 0) {
      alert("请先添加评论");
      return;
    }
    setAnalyzingProductId(product.id);
    try {
      const reviewTexts = product.reviews.map((r) => r.text);
      console.info(reviewTexts, "---reviewTexts");
      const analysis = await analyzeReviews(product.name, reviewTexts);
      console.info(analysis, "---analysis");
      setProductAnalysis(competitor.id, product.id, analysis);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("分析失败，请检查 API Key");
    } finally {
      setAnalyzingProductId(null);
    }
  };

  const saveProduct = () => {
    if (!tempProduct.name || !tempProduct.price) return;

    const productToSave: Product = {
      id: tempProduct.id || `prod-${Date.now()}`,
      name: tempProduct.name,
      price: Number(tempProduct.price),
      tags:
        typeof tempProduct.tags === "string"
          ? (tempProduct.tags as string).split(",").map((t: string) => t.trim())
          : tempProduct.tags || [],
      image: tempProduct.image || "https://via.placeholder.com/200",
      competitorId: competitor.id,
      reviews: tempProduct.reviews || [],
      analysis: tempProduct.analysis,
    };

    if (editingProductId) {
      updateProduct(competitor.id, productToSave);
    } else {
      addProduct(competitor.id, productToSave);
    }

    setEditingProductId(null);
    setIsAddingProduct(false);
    setTempProduct({});
  };

  const saveAd = () => {
    if (!tempAd.text) return;

    const adToSave: AdCreative = {
      id: tempAd.id || `ad-${Date.now()}`,
      text: tempAd.text,
      image: tempAd.image || "https://via.placeholder.com/400x250",
      highlights:
        typeof tempAd.highlights === "string"
          ? (tempAd.highlights as string)
              .split(" ")
              .map((h: string) => h.trim())
          : tempAd.highlights || [],
    };

    if (selectedCompetitorId) {
      if (editingAdId) {
        updateAd(selectedCompetitorId, adToSave);
      } else {
        addAd(selectedCompetitorId, adToSave);
      }
      setEditingAdId(null);
      setIsAddingAd(false);
      setTempAd({});
    }
  };

  const saveAnalysis = () => {
    if (selectedCompetitorId && editingAnalysisProductId && tempAnalysis) {
      setProductAnalysis(
        selectedCompetitorId,
        editingAnalysisProductId,
        tempAnalysis
      );
      setEditingAnalysisProductId(null);
      setTempAnalysis(null);
    }
  };

  // Helper handling array updates for analysis
  const handleArrayChange = (
    field: "pros" | "cons",
    index: number,
    value: string
  ) => {
    if (!tempAnalysis) return;
    const newArray = [...tempAnalysis[field]];
    newArray[index] = value;
    setTempAnalysis({ ...tempAnalysis, [field]: newArray });
  };

  const handleArrayDelete = (field: "pros" | "cons", index: number) => {
    if (!tempAnalysis) return;
    const newArray = [...tempAnalysis[field]];
    newArray.splice(index, 1);
    setTempAnalysis({ ...tempAnalysis, [field]: newArray });
  };

  const handleArrayAdd = (field: "pros" | "cons") => {
    if (!tempAnalysis) return;
    setTempAnalysis({ ...tempAnalysis, [field]: [...tempAnalysis[field], ""] });
  };

  // Helper for Keywords
  const handleKeywordChange = (
    field: "prosKeywords" | "consKeywords",
    index: number,
    key: "value" | "count",
    val: string | number
  ) => {
    if (!tempAnalysis) return;
    const newKeywords = [...(tempAnalysis[field] || [])];
    newKeywords[index] = { ...newKeywords[index], [key]: val };
    setTempAnalysis({ ...tempAnalysis, [field]: newKeywords });
  };

  const handleKeywordDelete = (
    field: "prosKeywords" | "consKeywords",
    index: number
  ) => {
    if (!tempAnalysis) return;
    const newKeywords = [...(tempAnalysis[field] || [])];
    newKeywords.splice(index, 1);
    setTempAnalysis({ ...tempAnalysis, [field]: newKeywords });
  };

  const handleKeywordAdd = (field: "prosKeywords" | "consKeywords") => {
    if (!tempAnalysis) return;
    setTempAnalysis({
      ...tempAnalysis,
      [field]: [...(tempAnalysis[field] || []), { value: "", count: 10 }],
    });
  };
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet)?.map((item) => ({
        ...(item as any),
        时间:
          item?.["时间"]?.split("-")?.length < 3
            ? `${new Date().getFullYear()}-${item?.["时间"]}`
            : item?.["时间"],
      }));

      console.info(jsonData, "---parsed excel data");

      if (jsonData.length > 0) {
        setProductReviews(competitor.id, productId, jsonData as any[]);
        alert(`成功导入 ${jsonData.length} 条评论`);
      } else {
        alert("未找到有效评论数据");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("文件解析失败");
    } finally {
      // Clear input value to allow re-uploading the same file
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => setSelectedCompetitor(null)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">返回仪表盘</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group">
            <h1 className="text-xl font-bold text-center">{competitor.name}</h1>

            {/* Domain Editing */}
            <div className="flex justify-center items-center mb-6 mt-1">
              {isEditingDomain ? (
                <div className="flex items-center gap-2">
                  <input
                    className="border rounded px-2 py-1 text-sm text-center w-full"
                    autoFocus
                    value={tempDomain}
                    onChange={(e) => setTempDomain(e.target.value)}
                  />
                  <button
                    onClick={handleSaveDomain}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditingDomain(false)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer">
                  <a
                    href={competitor.domain}
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    {competitor.domain}
                  </a>
                  <Pencil
                    onClick={() => {
                      setTempDomain(competitor.domain);
                      setIsEditingDomain(true);
                    }}
                    size={12}
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Globe className="text-gray-400" size={18} />
                <span className="text-gray-600">
                  {competitor.name.includes("国外")
                    ? "国际知名品牌"
                    : "国内品牌"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShoppingCart className="text-gray-400" size={18} />
                <span className="text-gray-600">{competitor.platform}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
              <Sparkles size={16} />
              AI 智能分析
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              点击产品卡片上的“分析评论”按钮，可自动提炼该产品的用户优缺点反馈。
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {["products", "ads"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "products"
                    ? `核心产品 (${competitor.products?.length || 0})`
                    : `广告创意 (${competitor.ads?.length || 0})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "products" && (
                <div className="space-y-8">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setIsAddingProduct(true);
                        setTempProduct({});
                      }}
                      className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-2 rounded-lg transition"
                    >
                      <Plus size={16} /> 新增产品
                    </button>
                  </div>

                  {/* Add New Product Form */}
                  {isAddingProduct && (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50">
                      <h4 className="font-bold text-gray-700 mb-4">
                        添加新产品
                      </h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                          className="p-2 border rounded"
                          placeholder="产品名称"
                          value={tempProduct.name || ""}
                          onChange={(e) =>
                            setTempProduct({
                              ...tempProduct,
                              name: e.target.value,
                            })
                          }
                        />
                        <input
                          className="p-2 border rounded"
                          placeholder="价格"
                          type="number"
                          value={tempProduct.price || ""}
                          onChange={(e) =>
                            setTempProduct({
                              ...tempProduct,
                              price: Number(e.target.value),
                            })
                          }
                        />
                        <input
                          className="p-2 border rounded col-span-2"
                          placeholder="标签 (用逗号分隔)"
                          value={
                            Array.isArray(tempProduct.tags)
                              ? tempProduct.tags.join(",")
                              : tempProduct.tags || ""
                          }
                          onChange={(e) =>
                            setTempProduct({
                              ...tempProduct,
                              tags: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setIsAddingProduct(false)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveProduct}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  )}

                  {competitor.products?.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow group/card"
                    >
                      {editingProductId === product.id ? (
                        <div className="p-6 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                              className="p-2 border rounded"
                              value={tempProduct.name}
                              onChange={(e) =>
                                setTempProduct({
                                  ...tempProduct,
                                  name: e.target.value,
                                })
                              }
                            />
                            <input
                              className="p-2 border rounded"
                              type="number"
                              value={tempProduct.price}
                              onChange={(e) =>
                                setTempProduct({
                                  ...tempProduct,
                                  price: Number(e.target.value),
                                })
                              }
                            />
                            <input
                              className="p-2 border rounded col-span-2"
                              placeholder="标签 (用逗号分隔)"
                              value={
                                Array.isArray(tempProduct.tags)
                                  ? tempProduct.tags.join(",")
                                  : tempProduct.tags
                              }
                              onChange={(e) =>
                                setTempProduct({
                                  ...tempProduct,
                                  tags: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="flex items-center gap-1 px-3 py-1 text-gray-500"
                            >
                              <X size={14} /> 取消
                            </button>
                            <button
                              onClick={saveProduct}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded"
                            >
                              <Save size={14} /> 保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row relative">
                          {/* Product Actions */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm shadow-sm z-10">
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setTempProduct({ ...product });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("确定删除该产品?"))
                                  removeProduct(competitor.id, product.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-lg text-gray-800">
                                  {product.name}（ ¥{product.price}）
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {product.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Analysis Section */}
                            {editingAnalysisProductId === product.id ? (
                              <div className="mt-4 bg-purple-50 p-4 rounded-lg flex-1 border border-purple-200">
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Pros Editing */}
                                  <div>
                                    <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <Plus size={12} /> 用户好评点
                                      </span>
                                      <button
                                        onClick={() => handleArrayAdd("pros")}
                                        className="text-green-600 hover:bg-green-100 p-1 rounded"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </h5>
                                    <ul className="space-y-2 mb-4">
                                      {tempAnalysis?.pros?.map(
                                        (pro: string, i: number) => (
                                          <li key={i} className="flex gap-1">
                                            <input
                                              className="flex-1 text-xs p-1 border rounded"
                                              value={pro}
                                              onChange={(e) =>
                                                handleArrayChange(
                                                  "pros",
                                                  i,
                                                  e.target.value
                                                )
                                              }
                                            />
                                            <button
                                              onClick={() =>
                                                handleArrayDelete("pros", i)
                                              }
                                              className="text-red-400 hover:text-red-600"
                                            >
                                              <X size={12} />
                                            </button>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                    <div className="border-t border-purple-200 pt-2">
                                      <h6 className="text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                                        词云关键词 (好评)
                                        <button
                                          onClick={() =>
                                            handleKeywordAdd("prosKeywords")
                                          }
                                          className="text-purple-600"
                                        >
                                          <Plus size={10} />
                                        </button>
                                      </h6>
                                      <div className="space-y-1">
                                        {tempAnalysis?.prosKeywords?.map(
                                          (kw: any, i: number) => (
                                            <div
                                              key={i}
                                              className="flex gap-1 items-center"
                                            >
                                              <input
                                                className="w-20 text-[10px] p-1 border rounded"
                                                placeholder="词"
                                                value={kw.value}
                                                onChange={(e) =>
                                                  handleKeywordChange(
                                                    "prosKeywords",
                                                    i,
                                                    "value",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                              <input
                                                className="w-12 text-[10px] p-1 border rounded"
                                                type="number"
                                                placeholder="权重"
                                                value={kw.count}
                                                onChange={(e) =>
                                                  handleKeywordChange(
                                                    "prosKeywords",
                                                    i,
                                                    "count",
                                                    Number(e.target.value)
                                                  )
                                                }
                                              />
                                              <button
                                                onClick={() =>
                                                  handleKeywordDelete(
                                                    "prosKeywords",
                                                    i
                                                  )
                                                }
                                                className="text-red-400"
                                              >
                                                <X size={10} />
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Cons Editing */}
                                  <div>
                                    <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <ShieldAlert size={12} /> 需优化点
                                      </span>
                                      <button
                                        onClick={() => handleArrayAdd("cons")}
                                        className="text-red-600 hover:bg-red-100 p-1 rounded"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </h5>
                                    <ul className="space-y-2 mb-4">
                                      {tempAnalysis?.cons?.map(
                                        (con: string, i: number) => (
                                          <li key={i} className="flex gap-1">
                                            <input
                                              className="flex-1 text-xs p-1 border rounded"
                                              value={con}
                                              onChange={(e) =>
                                                handleArrayChange(
                                                  "cons",
                                                  i,
                                                  e.target.value
                                                )
                                              }
                                            />
                                            <button
                                              onClick={() =>
                                                handleArrayDelete("cons", i)
                                              }
                                              className="text-red-400 hover:text-red-600"
                                            >
                                              <X size={12} />
                                            </button>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                    <div className="border-t border-purple-200 pt-2">
                                      <h6 className="text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                                        词云关键词 (差评)
                                        <button
                                          onClick={() =>
                                            handleKeywordAdd("consKeywords")
                                          }
                                          className="text-purple-600"
                                        >
                                          <Plus size={10} />
                                        </button>
                                      </h6>
                                      <div className="space-y-1">
                                        {tempAnalysis?.consKeywords?.map(
                                          (kw: any, i: number) => (
                                            <div
                                              key={i}
                                              className="flex gap-1 items-center"
                                            >
                                              <input
                                                className="w-20 text-[10px] p-1 border rounded"
                                                placeholder="词"
                                                value={kw.value}
                                                onChange={(e) =>
                                                  handleKeywordChange(
                                                    "consKeywords",
                                                    i,
                                                    "value",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                              <input
                                                className="w-12 text-[10px] p-1 border rounded"
                                                type="number"
                                                placeholder="权重"
                                                value={kw.count}
                                                onChange={(e) =>
                                                  handleKeywordChange(
                                                    "consKeywords",
                                                    i,
                                                    "count",
                                                    Number(e.target.value)
                                                  )
                                                }
                                              />
                                              <button
                                                onClick={() =>
                                                  handleKeywordDelete(
                                                    "consKeywords",
                                                    i
                                                  )
                                                }
                                                className="text-red-400"
                                              >
                                                <X size={10} />
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-purple-200">
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    总结
                                  </label>
                                  <textarea
                                    className="w-full text-xs p-2 border rounded"
                                    rows={3}
                                    value={tempAnalysis?.summary || ""}
                                    onChange={(e) =>
                                      setTempAnalysis({
                                        ...tempAnalysis,
                                        summary: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      setEditingAnalysisProductId(null)
                                    }
                                    className="px-3 py-1 text-xs text-gray-500"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={saveAnalysis}
                                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded"
                                  >
                                    保存
                                  </button>
                                </div>
                              </div>
                            ) : product.analysis ? (
                              <div className="mt-4 bg-gray-50 p-4 rounded-lg flex-1 relative group/analysis">
                                <button
                                  onClick={() => {
                                    setEditingAnalysisProductId(product.id);
                                    setTempAnalysis(product.analysis);
                                  }}
                                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-purple-600 opacity-0 group-hover/analysis:opacity-100 transition-opacity"
                                >
                                  <Pencil size={14} />
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                                      <Plus size={12} /> 用户好评点
                                    </h5>
                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 mb-4">
                                      {product.analysis.pros.map((pro, i) => (
                                        <li key={i}>{pro}</li>
                                      ))}
                                    </ul>
                                    {product.analysis.prosKeywords && (
                                      <TagCloud
                                        minSize={12}
                                        maxSize={20}
                                        tags={product.analysis.prosKeywords}
                                        className="simple-cloud mb-2"
                                        onClick={(tag: any) =>
                                          console.log("clicking on tag:", tag)
                                        }
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                                      <ShieldAlert size={12} /> 需优化点
                                    </h5>
                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 mb-4">
                                      {product.analysis.cons.map((con, i) => (
                                        <li key={i}>{con}</li>
                                      ))}
                                    </ul>
                                    {product.analysis.consKeywords && (
                                      <TagCloud
                                        minSize={12}
                                        maxSize={20}
                                        tags={product.analysis.consKeywords}
                                        className="simple-cloud mb-2"
                                        colorOptions={{
                                          luminosity: "dark",
                                          hue: "red",
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 italic">
                                    "{product.analysis.summary}"
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400">
                                  暂无 AI 分析报告
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 flex gap-3 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-gray-500 mb-1 block">
                                  导入评论数据 (Excel/CSV):
                                </label>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors">
                                    <Upload size={14} />
                                    <span>选择文件导入</span>
                                    <input
                                      type="file"
                                      accept=".xlsx, .xls, .csv"
                                      className="hidden"
                                      onChange={(e) =>
                                        handleFileUpload(e, product.id)
                                      }
                                    />
                                  </label>
                                  <span className="text-[10px] text-gray-400">
                                    已录入 {product.reviews?.length || 0} 条评论
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  支持 .xlsx, .xls, .csv 格式
                                </p>
                              </div>
                              <button
                                onClick={() => handleAnalyze(product)}
                                disabled={analyzingProductId === product.id}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-10"
                              >
                                {analyzingProductId === product.id ? (
                                  "分析中..."
                                ) : (
                                  <>
                                    <Star size={16} className="fill-white" />
                                    生成分析
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "ads" && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setIsAddingAd(true);
                        setTempAd({});
                      }}
                      className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-2 rounded-lg transition"
                    >
                      <Plus size={16} /> 新增创意
                    </button>
                  </div>

                  {isAddingAd && (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50">
                      <h4 className="font-bold text-gray-700 mb-4">
                        添加新创意
                      </h4>
                      <div className="flex flex-col gap-4 mb-4">
                        <textarea
                          className="p-2 border rounded"
                          placeholder="广告文案"
                          rows={2}
                          value={tempAd.text || ""}
                          onChange={(e) =>
                            setTempAd({ ...tempAd, text: e.target.value })
                          }
                        />
                        <input
                          className="p-2 border rounded"
                          placeholder="亮点 (用空格分隔)"
                          value={
                            Array.isArray(tempAd.highlights)
                              ? tempAd.highlights.join(" ")
                              : tempAd.highlights || ""
                          }
                          onChange={(e) =>
                            setTempAd({ ...tempAd, highlights: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setIsAddingAd(false)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveAd}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {competitor.ads?.map((ad) => (
                      <div
                        key={ad.id}
                        className="border border-gray-100 rounded-xl overflow-hidden group/card relative"
                      >
                        {editingAdId === ad.id ? (
                          <div className="p-4 bg-gray-50">
                            <div className="flex flex-col gap-2 mb-2">
                              <textarea
                                className="p-2 border rounded text-xs"
                                rows={2}
                                value={tempAd.text}
                                onChange={(e) =>
                                  setTempAd({ ...tempAd, text: e.target.value })
                                }
                              />
                              <input
                                className="p-2 border rounded text-xs"
                                value={
                                  Array.isArray(tempAd.highlights)
                                    ? tempAd.highlights.join(" ")
                                    : tempAd.highlights
                                }
                                onChange={(e) =>
                                  setTempAd({
                                    ...tempAd,
                                    highlights: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="flex gap-2 justify-end text-xs">
                              <button
                                onClick={() => setEditingAdId(null)}
                                className="flex items-center gap-1 px-2 py-1 text-gray-500"
                              >
                                取消
                              </button>
                              <button
                                onClick={saveAd}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm shadow-sm z-10">
                              <button
                                onClick={() => {
                                  setEditingAdId(ad.id);
                                  setTempAd({ ...ad });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("确定删除该创意?"))
                                    removeAd(competitor.id, ad.id);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-600 mb-3 font-medium">
                                “{ad.text}”
                              </p>
                              <div className="flex gap-2">
                                {ad.highlights.map((h) => (
                                  <span
                                    key={h}
                                    className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold border border-purple-100"
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitorDetail;
