import React, { useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import { useStore } from "../store";
import {
  Plus,
  Loader2,
  Sparkles,
  Trash2,
  Venus,
  Mars,
  VenusAndMars,
  Download,
  Share2,
  FileText,
  ChevronDown,
  Calendar,
  Filter,
  Package,
} from "lucide-react";
import { fetchCompetitorData } from "../services/gemini";

const Dashboard: React.FC = () => {
  const {
    competitors,
    setSelectedCompetitor,
    addCompetitor,
    removeCompetitor,
    isLoading, // Get global loading state
  } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isDomestic, setIsDomestic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [radarCompAId, setRadarCompAId] = useState<string>("");
  const [radarCompBId, setRadarCompBId] = useState<string>("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [marketTab, setMarketTab] = useState<"all" | "domestic" | "foreign">(
    "all"
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "before2010" | "2010-2015" | "2015-2020" | "after2020"
  >("all");

  // Set default radar selection when competitors load
  React.useEffect(() => {
    if (competitors.length > 0) {
      if (!radarCompAId) setRadarCompAId(competitors[0].id);
      if (!radarCompBId && competitors.length > 1)
        setRadarCompBId(competitors[1].id);
    }
  }, [competitors]);

  const handleAddCompetitor = async () => {
    console.log("Adding competitor:", newCompanyName);
    const trimmedName = newCompanyName.trim();
    if (!trimmedName) return;

    // Duplicate Check
    const isDuplicate = competitors.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      alert(`品牌 "${trimmedName}" 已存在，请勿重复添加`);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCompetitorData(trimmedName, isDomestic);
      console.log("Fetched data:", data);
      addCompetitor(data);
      setNewCompanyName("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to fetch competitor data", error);
      alert("获取竞品数据失败，请检查网络或 API Key");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdding = () => {
    console.log("Toggle adding from", isAdding, "to", !isAdding);
    setIsAdding((prev) => !prev);
  };

  const radarCompA =
    competitors.find((c) => c.id === radarCompAId) || competitors[0];
  const radarCompB =
    competitors.find((c) => c.id === radarCompBId) || competitors[1];

  const radarData = [
    {
      subject: "材质工艺",
      A: radarCompA?.sentiment.material || 0,
      B: radarCompB?.sentiment.material || 0,
      fullMark: 100,
    },
    {
      subject: "静音表现",
      A: radarCompA?.sentiment.noise || 0,
      B: radarCompB?.sentiment.noise || 0,
      fullMark: 100,
    },
    {
      subject: "隐私保护",
      A: radarCompA?.sentiment.privacy || 0,
      B: radarCompB?.sentiment.privacy || 0,
      fullMark: 100,
    },
    {
      subject: "操作便捷",
      A: radarCompA?.sentiment.easeOfUse || 0,
      B: radarCompB?.sentiment.easeOfUse || 0,
      fullMark: 100,
    },
    {
      subject: "性价比",
      A: radarCompA?.sentiment.value || 0,
      B: radarCompB?.sentiment.value || 0,
      fullMark: 100,
    },
  ];

  const exportToJSON = () => {
    const jsonString = JSON.stringify(competitors, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `market_competitors_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToMarkdown = () => {
    let markdown = `# 市场竞品分析\n\n`;
    competitors.forEach((comp) => {
      markdown += `## ${comp.name}\n`;
      markdown += `- **官网**: ${comp.domain}\n`;
      markdown += `- **品牌类型**: ${
        comp.isDomestic ? "国内品牌" : "国际知名品牌"
      }\n`;
      if (comp.focus) {
        const focusText =
          comp.focus === "Female"
            ? "专攻女用"
            : comp.focus === "Male"
            ? "专攻男用"
            : "男女兼用";
        markdown += `- **专攻性别**: ${focusText}\n`;
      }
      if (comp.philosophy && comp.philosophy.length > 0) {
        markdown += `- **品牌理念**:\n`;
        comp.philosophy.forEach((p) => {
          markdown += `  - "${p}"\n`;
        });
      } else {
        markdown += `- **品牌理念**: 暂无\n`;
      }
      markdown += `- **情感评分**:\n`;
      markdown += `  - 材质: ${comp.sentiment.material}\n`;
      markdown += `  - 噪音: ${comp.sentiment.noise}\n`;
      markdown += `  - 私密性: ${comp.sentiment.privacy}\n`;
      markdown += `  - 易用性: ${comp.sentiment.easeOfUse}\n`;
      markdown += `  - 性价比: ${comp.sentiment.value}\n`;
      if (comp.products && comp.products.length > 0) {
        markdown += `- **核心产品**:\n`;
        comp.products.forEach((prod) => {
          markdown += `  - ${prod.name} (¥${prod.price})\n`;
          if (prod.category) {
            markdown += `    - 类型: ${prod.category}\n`;
          }
          if (prod.tags && prod.tags.length > 0) {
            markdown += `    - 标签: ${prod.tags.join(", ")}\n`;
          }
          if (prod.link) {
            markdown += `    - 链接: ${prod.link}\n`;
          }
          if (prod.analysis) {
            if (prod.analysis.summary) {
              markdown += `    - **分析概括**: ${prod.analysis.summary}\n`;
            }
            if (
              prod.analysis.prosKeywords &&
              prod.analysis.prosKeywords.length > 0
            ) {
              const prosKeywordsText = prod.analysis.prosKeywords
                .map((kw) => `${kw.value}(${kw.count})`)
                .join(", ");
              markdown += `    - **好评关键词**: ${prosKeywordsText}\n`;
            }
            if (
              prod.analysis.consKeywords &&
              prod.analysis.consKeywords.length > 0
            ) {
              const consKeywordsText = prod.analysis.consKeywords
                .map((kw) => `${kw.value}(${kw.count})`)
                .join(", ");
              markdown += `    - **差评关键词**: ${consKeywordsText}\n`;
            }
          }
        });
      }
      markdown += `\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `market_mindmap_${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tight">
              MARKET OVERVIEW
            </h2>
            <p className="text-purple-200 font-medium text-sm">
              实时追踪行业动态，洞察品牌竞争格局
            </p>
          </div>

          <div className="flex gap-3 relative w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl transition-all text-sm font-bold border border-white/20 active:scale-95 shadow-lg shadow-black/5"
              >
                <Download size={18} />
                <span>报告导出</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    showExportMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        选择导出格式
                      </p>
                    </div>
                    <button
                      onClick={exportToJSON}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium group"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Share2 size={14} className="text-blue-600" />
                      </div>
                      <span>原始数据 (JSON)</span>
                    </button>
                    <button
                      onClick={exportToMarkdown}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium group"
                    >
                      <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <FileText size={14} className="text-emerald-600" />
                      </div>
                      <span>markdown格式 (.md)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">用户情感雷达</h3>
            {!!competitors?.length && (
              <div className="flex gap-2">
                <select
                  value={radarCompAId}
                  onChange={(e) => setRadarCompAId(e.target.value)}
                  className="text-xs border rounded p-1 max-w-[100px]"
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="text-gray-400">vs</div>
                <select
                  value={radarCompBId}
                  onChange={(e) => setRadarCompBId(e.target.value)}
                  className="text-xs border rounded p-1 max-w-[100px]"
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {competitors?.length ? (
            <div className="h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarData}
                >
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name={radarCompA?.name}
                    dataKey="A"
                    stroke="#7e22ce"
                    fill="#7e22ce"
                    fillOpacity={0.4}
                  />
                  {radarCompB && (
                    <Radar
                      name={radarCompB.name}
                      dataKey="B"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                  )}
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex justify-center items-center">
              暂无数据
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">竞品快速入口</h3>
            <button
              onClick={toggleAdding}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                isAdding
                  ? "bg-purple-100 text-purple-700"
                  : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              <Plus
                size={14}
                className={`transition-transform duration-300 ${
                  isAdding ? "rotate-45" : ""
                }`}
              />
              {isAdding ? "取消" : "新增"}
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex bg-gray-100/50 p-1 rounded-lg">
              {(["all", "domestic", "foreign"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMarketTab(t)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    marketTab === t
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "all" ? "全部" : t === "domestic" ? "国内" : "国外"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as typeof dateFilter)
                }
                className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="all">全部年份</option>
                <option value="before2010">2010年之前</option>
                <option value="2010-2015">2010-2015年</option>
                <option value="2015-2020">2015-2020年</option>
                <option value="after2020">2020年之后</option>
              </select>
            </div>
          </div>

          {isAdding && (
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-purple-100">
              <label className="text-xs text-gray-500 mb-1 block">
                输入竞品品牌名称:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="flex-1 text-sm p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="例如: 杜蕾斯、小怪兽、大人糖..."
                />
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDomestic}
                    onChange={(e) => setIsDomestic(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="text-xs text-gray-500 font-medium">
                    国内品牌
                  </span>
                </label>
                <button
                  onClick={handleAddCompetitor}
                  disabled={loading || !newCompanyName}
                  className="bg-purple-600 text-white px-3 rounded-md disabled:opacity-50 flex items-center justify-center min-w-[40px]"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </button>
              </div>
            </div>
          )}

          {competitors?.length ? (
            <div className="space-y-4 overflow-y-auto flex-1 max-h-[400px] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {competitors
                .filter((comp) => {
                  // 市场类型筛选
                  if (marketTab !== "all") {
                    const matchesMarket =
                      marketTab === "domestic"
                        ? comp.isDomestic
                        : !comp.isDomestic;
                    if (!matchesMarket) return false;
                  }

                  // 日期筛选
                  if (dateFilter !== "all") {
                    // 如果没有创立日期，在非"全部"筛选时隐藏
                    if (!comp.foundedDate) return false;

                    const foundedYear = parseInt(
                      comp.foundedDate.split("-")[0] || comp.foundedDate
                    );
                    if (isNaN(foundedYear)) return false; // 如果日期格式不正确，隐藏该条目

                    switch (dateFilter) {
                      case "before2010":
                        if (foundedYear >= 2010) return false;
                        break;
                      case "2010-2015":
                        if (foundedYear < 2010 || foundedYear >= 2015)
                          return false;
                        break;
                      case "2015-2020":
                        if (foundedYear < 2015 || foundedYear >= 2020)
                          return false;
                        break;
                      case "after2020":
                        if (foundedYear < 2020) return false;
                        break;
                    }
                  }

                  return true;
                })
                .sort((a, b) => {
                  const getDateValue = (date?: string) => {
                    if (!date) return 0;
                    const parts = date.split("-");
                    const year = parseInt(parts[0]) || 0;
                    const month = parseInt(parts[1]) || 0;
                    return year * 100 + month;
                  };
                  return (
                    getDateValue(b.foundedDate) - getDateValue(a.foundedDate)
                  );
                })
                .map((comp) => {
                  // 格式化创立日期
                  const formatFoundedDate = (date?: string) => {
                    if (!date) return null;
                    const year = date.split("-")[0] || date;
                    const month = date.includes("-")
                      ? date.split("-")[1]
                      : null;
                    return month
                      ? `${year}年${parseInt(month)}月`
                      : `${year}年`;
                  };

                  return (
                    <div
                      key={comp.id}
                      className="group relative flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedCompetitor(comp.id)}
                      >
                        <h4 className="font-semibold text-sm truncate">
                          {comp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400 truncate">
                            {comp.domain || "无官网地址"}
                          </p>
                          {comp.foundedDate && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar size={10} />
                                <span>
                                  {formatFoundedDate(comp.foundedDate)}
                                </span>
                              </div>
                            </>
                          )}
                          <span className="text-xs text-gray-300">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Package size={10} />
                            <span>{(comp.products || []).length} 款产品</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            comp.focus === "Female"
                              ? "bg-pink-50 text-pink-600 border-pink-100"
                              : comp.focus === "Male"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-purple-50 text-purple-600 border-purple-100"
                          }`}
                        >
                          {comp.focus === "Female" ? (
                            <Venus size={10} />
                          ) : comp.focus === "Male" ? (
                            <Mars size={10} />
                          ) : (
                            <VenusAndMars size={10} />
                          )}
                          {comp.focus === "Female"
                            ? "女用"
                            : comp.focus === "Male"
                            ? "男用"
                            : "通用"}
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          title="删除竞品"
                          disabled={!!deletingId}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`确定要删除 ${comp.name} 吗？`)) {
                              setDeletingId(comp.id);
                              try {
                                await removeCompetitor(comp.id);
                              } finally {
                                setDeletingId(null);
                              }
                            }
                          }}
                        >
                          {deletingId === comp.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-72 flex justify-center items-center">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
