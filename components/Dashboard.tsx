import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useStore } from "../store";
import {
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Plus,
  Loader2,
  Sparkles,
  Trash2,
  Download,
} from "lucide-react";
import { fetchCompetitorData } from "../services/gemini";

const MARKET_OPPORTUNITY = [
  { category: "入耳式吸吮", competition: 92, volume: 85 },
  { category: "可穿戴震动", competition: 45, volume: 70 },
  { category: "智能远程", competition: 60, volume: 75 },
  { category: "环保材质", competition: 25, volume: 40 },
  { category: "静音专利", competition: 75, volume: 82 },
];

const MetricCard = ({ title, value, icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        {React.cloneElement(icon, {
          className: `w-5 h-5 ${color.replace("bg-", "text-")}`,
        })}
      </div>
    </div>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <h3 className="text-2xl font-bold mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC = () => {
  const {
    competitors,
    setSelectedCompetitor,
    addCompetitor,
    removeCompetitor,
  } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hiddenPriceIds, setHiddenPriceIds] = useState<string[]>([]);
  const [radarCompAId, setRadarCompAId] = useState<string>("");
  const [radarCompBId, setRadarCompBId] = useState<string>("");

  // Set default radar selection when competitors load
  React.useEffect(() => {
    if (competitors.length > 0) {
      if (!radarCompAId) setRadarCompAId(competitors[0].id);
      if (!radarCompBId && competitors.length > 1)
        setRadarCompBId(competitors[1].id);
    }
  }, [competitors]);

  const handleAddCompetitor = async () => {
    if (!newCompanyName.trim()) return;
    setLoading(true);
    try {
      const data = await fetchCompetitorData(newCompanyName);
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

  const togglePriceLine = (id: string) => {
    setHiddenPriceIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const getUnifiedPriceData = () => {
    // Create a map of dates to price points
    const dateMap: Record<string, any> = {};
    const allDates = new Set<string>();

    // Collect all unique dates from all competitors
    competitors.forEach((c) =>
      c.priceHistory.forEach((p) => allDates.add(p.date))
    );

    // Sort dates (assuming format like "1月", "2023-01", etc. - AI usually keeps it consistent, but for safety)
    const sortedDates = Array.from(allDates); // Simple sort for now

    sortedDates.forEach((date) => {
      dateMap[date] = { date };
      competitors.forEach((c) => {
        const point = c.priceHistory.find((p) => p.date === date);
        if (point) dateMap[date][c.id] = point.price;
      });
    });

    return sortedDates.map((date) => dateMap[date]);
  };

  const unifiedPriceData = getUnifiedPriceData();

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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-purple-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-purple-100">
              监控竞品总数
            </span>
          </div>
          <h3 className="text-3xl font-bold">{competitors.length}</h3>
        </div>
        <button
          onClick={() => {
            const jsonString = JSON.stringify(competitors, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "competitors.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-white/10"
        >
          <Download size={16} />
          <span>导出为 JSON</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">竞品快速入口</h3>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs text-purple-600 font-bold hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> 新增
            </button>
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
                  placeholder="例如: 杜蕾斯"
                />
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
            <div className="space-y-4 overflow-y-auto flex-1 max-h-[400px]">
              {competitors.map((comp) => (
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
                    <p className="text-xs text-gray-400 truncate">
                      {comp.domain}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-600 block max-w-[80px] truncate">
                      {comp.platform.split("/")[0]}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="删除竞品"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除 ${comp.name} 吗？`)) {
                          removeCompetitor(comp.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
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
