import React, { useState } from "react";
import { Competitor } from "../../types";
import { Globe, Venus, Mars, VenusAndMars, Pencil, Save, X, Plus, Sparkles } from "lucide-react";

interface CompetitorSidebarProps {
  competitor: Competitor;
  onUpdateCompetitor: (competitor: Competitor) => void;
}

const CompetitorSidebar: React.FC<CompetitorSidebarProps> = ({
  competitor,
  onUpdateCompetitor,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [tempDomain, setTempDomain] = useState("");
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [tempFocus, setTempFocus] = useState<string>("");
  const [isEditingPhilosophy, setIsEditingPhilosophy] = useState(false);
  const [tempPhilosophy, setTempPhilosophy] = useState<string[]>([]);
  const [isEditingFoundedDate, setIsEditingFoundedDate] = useState(false);
  const [tempFoundedDate, setTempFoundedDate] = useState("");

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateCompetitor({ ...competitor, name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveDomain = () => {
    onUpdateCompetitor({ ...competitor, domain: tempDomain });
    setIsEditingDomain(false);
  };

  const handleSaveFocus = () => {
    onUpdateCompetitor({ ...competitor, focus: tempFocus as "Male" | "Female" | "Unisex" | undefined });
    setIsEditingFocus(false);
  };

  const handleSavePhilosophy = () => {
    const filteredPhilosophy = tempPhilosophy.filter((p) => p.trim() !== "");
    onUpdateCompetitor({ ...competitor, philosophy: filteredPhilosophy });
    setIsEditingPhilosophy(false);
  };

  const handleSaveFoundedDate = () => {
    onUpdateCompetitor({ ...competitor, foundedDate: tempFoundedDate.trim() || undefined });
    setIsEditingFoundedDate(false);
  };

  const handlePhilosophyChange = (index: number, value: string) => {
    const newPhilosophy = [...tempPhilosophy];
    newPhilosophy[index] = value;
    setTempPhilosophy(newPhilosophy);
  };

  const handlePhilosophyAdd = () => {
    setTempPhilosophy([...tempPhilosophy, ""]);
  };

  const handlePhilosophyDelete = (index: number) => {
    const newPhilosophy = tempPhilosophy.filter((_, i) => i !== index);
    setTempPhilosophy(newPhilosophy);
  };

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group">
        {isEditingName ? (
          <div className="flex items-center gap-2 justify-center mb-6">
            <input
              className="border rounded px-3 py-2 text-xl font-bold text-center w-full"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSaveName();
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                  setTempName(competitor.name);
                }
              }}
            />
            <button
              onClick={handleSaveName}
              className="text-green-600 hover:text-green-700"
              title="保存"
            >
              <Save size={18} />
            </button>
            <button
              onClick={() => {
                setIsEditingName(false);
                setTempName(competitor.name);
              }}
              className="text-red-500 hover:text-red-600"
              title="取消"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-6 group/name relative">
            <h1 className="text-xl font-bold text-center">{competitor.name}</h1>
            <Pencil
              onClick={() => {
                setTempName(competitor.name);
                setIsEditingName(true);
              }}
              size={14}
              className="text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity cursor-pointer"
              title="编辑品牌名"
            />
          </div>
        )}

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
              {competitor?.domain ? (
                <a
                  href={
                    competitor?.domain?.trim()
                      ? competitor.domain.trim().startsWith("http") ||
                        competitor.domain.trim().startsWith("https")
                        ? competitor.domain.trim()
                        : `https://${competitor.domain.trim()}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  {competitor.domain}
                </a>
              ) : (
                <span className="text-sm text-gray-500 transition-colors">未设置官网</span>
              )}
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
              {competitor.isDomestic ? "国内品牌" : "国际知名品牌"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm group/focus relative">
            {isEditingFocus ? (
              <div className="flex items-center gap-2 w-full">
                <select
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  value={tempFocus || "Unisex"}
                  onChange={(e) => setTempFocus(e.target.value === "Unisex" ? "" : e.target.value)}
                  autoFocus
                >
                  <option value="Female">专攻女用</option>
                  <option value="Male">专攻男用</option>
                  <option value="Unisex">男女兼用</option>
                </select>
                <button
                  onClick={handleSaveFocus}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingFocus(false);
                    setTempFocus(competitor.focus || "");
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`${
                    competitor.focus === "Female"
                      ? "text-pink-500"
                      : competitor.focus === "Male"
                      ? "text-blue-500"
                      : "text-purple-500"
                  }`}
                >
                  {competitor.focus === "Female" ? (
                    <Venus size={18} />
                  ) : competitor.focus === "Male" ? (
                    <Mars size={18} />
                  ) : (
                    <VenusAndMars size={18} />
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    competitor.focus === "Female"
                      ? "bg-pink-50 text-pink-600 border-pink-100"
                      : competitor.focus === "Male"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-purple-50 text-purple-600 border-purple-100"
                  }`}
                >
                  {competitor.focus === "Female"
                    ? "专攻女用"
                    : competitor.focus === "Male"
                    ? "专攻男用"
                    : "男女兼用"}
                </span>
                <Pencil
                  onClick={() => {
                    setTempFocus(competitor.focus || "");
                    setIsEditingFocus(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/focus:opacity-100 transition-opacity cursor-pointer"
                />
              </>
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 group/philosophy relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                品牌理念
              </h4>
              {!isEditingPhilosophy && (
                <Pencil
                  onClick={() => {
                    setTempPhilosophy(
                      competitor.philosophy && competitor.philosophy.length > 0
                        ? [...competitor.philosophy]
                        : [""]
                    );
                    setIsEditingPhilosophy(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/philosophy:opacity-100 transition-opacity cursor-pointer"
                />
              )}
            </div>
            {isEditingPhilosophy ? (
              <div className="space-y-2">
                {tempPhilosophy.map((p, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      className="flex-1 text-sm p-2 border rounded"
                      value={p}
                      onChange={(e) => handlePhilosophyChange(index, e.target.value)}
                      placeholder={`理念 ${index + 1}`}
                    />
                    <button
                      onClick={() => handlePhilosophyDelete(index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handlePhilosophyAdd}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded border border-purple-200"
                  >
                    <Plus size={12} /> 添加理念
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      setIsEditingPhilosophy(false);
                      setTempPhilosophy([]);
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSavePhilosophy}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              competitor.philosophy && competitor.philosophy.length > 0 ? (
                <ul className="space-y-1.5">
                  {competitor.philosophy.map((p, index) => (
                    <li key={index} className="text-sm text-gray-600 leading-relaxed">
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">暂无品牌理念</p>
              )
            )}
          </div>

          {/* 创立日期 */}
          <div className="pt-4 border-t border-gray-100 group/foundedDate relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                创立日期
              </h4>
              {!isEditingFoundedDate && (
                <Pencil
                  onClick={() => {
                    setTempFoundedDate(competitor.foundedDate || "");
                    setIsEditingFoundedDate(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/foundedDate:opacity-100 transition-opacity cursor-pointer"
                />
              )}
            </div>
            {isEditingFoundedDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 text-sm p-2 border rounded"
                  value={tempFoundedDate}
                  onChange={(e) => setTempFoundedDate(e.target.value)}
                  placeholder="如：2020-01 或 2020"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSaveFoundedDate();
                    } else if (e.key === "Escape") {
                      setIsEditingFoundedDate(false);
                      setTempFoundedDate(competitor.foundedDate || "");
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveFoundedDate}
                  className="text-green-600 hover:text-green-700"
                  title="保存"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingFoundedDate(false);
                    setTempFoundedDate(competitor.foundedDate || "");
                  }}
                  className="text-red-500 hover:text-red-600"
                  title="取消"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {competitor.foundedDate
                  ? competitor.foundedDate.includes("-")
                    ? `${competitor.foundedDate.split("-")[0]}年${competitor.foundedDate.split("-")[1]}月`
                    : `${competitor.foundedDate}年`
                  : "未设置"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
          <Sparkles size={16} />
          AI 智能分析
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          点击产品卡片上的"分析评论"按钮，可自动提炼该产品的用户优缺点反馈。
        </p>
      </div>
    </div>
  );
};

export default CompetitorSidebar;

