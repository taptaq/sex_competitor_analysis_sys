import React, { useEffect, useState } from "react";
import { BookOpen, ArrowRight, Trash2, Plus, Loader2 } from "lucide-react";
import { useStore } from "../store";

const MedicalVocabLab: React.FC = () => {
  const { medicalTerms, fetchMedicalTerms, addMedicalTerm, removeMedicalTerm } =
    useStore();
  const [newTerm, setNewTerm] = useState({
    term: "",
    replacement: "",
    category: "General",
  });
  const [filterCategory, setFilterCategory] = useState("All");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = [
    "All",
    "General",
    "Sensation",
    "Material",
    "Safety",
    "English",
  ];
  const categoryLabels: Record<string, string> = {
    All: "全部",
    General: "通用",
    Sensation: "体感描述",
    Material: "材质",
    Safety: "安全",
    English: "英文",
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchMedicalTerms();
      setIsLoading(false);
    };
    loadData();
  }, [fetchMedicalTerms]);

  const handleAdd = async () => {
    if (newTerm.term && newTerm.replacement) {
      setIsAdding(true);
      try {
        await addMedicalTerm(
          newTerm.term,
          newTerm.replacement,
          newTerm.category
        );
        setNewTerm({ ...newTerm, term: "", replacement: "" });
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await removeMedicalTerm(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTerms =
    filterCategory === "All"
      ? medicalTerms
      : medicalTerms.filter((t: any) => t.category === filterCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3">
          <BookOpen size={32} />
          <div>
            <h1 className="text-2xl font-bold">医疗语境词库</h1>
            <p className="text-blue-100 text-sm mt-1">
              Medical Vocabulary - 针对于AI Prompt的全局敏感词替换与专业术语管理
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Term */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} /> Add New Term
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营销词 / 敏感词 (Original)
                </label>
                <input
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 震动"
                  value={newTerm.term}
                  onChange={(e) =>
                    setNewTerm({ ...newTerm, term: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-center">
                <ArrowRight className="text-gray-400 rotate-90 lg:rotate-0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  专业替代词 (Replacement)
                </label>
                <input
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 触觉共振"
                  value={newTerm.replacement}
                  onChange={(e) =>
                    setNewTerm({ ...newTerm, replacement: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类 (Category)
                </label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTerm.category}
                  onChange={(e) =>
                    setNewTerm({ ...newTerm, category: e.target.value })
                  }
                >
                  <option value="General">通用 (General)</option>
                  <option value="Sensation">体感描述 (Sensation)</option>
                  <option value="Material">材质 (Material)</option>
                  <option value="Safety">安全 (Safety)</option>
                  <option value="English">英文 (English)</option>
                </select>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newTerm.term || !newTerm.replacement || isAdding}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    添加中...
                  </>
                ) : (
                  "添加词条"
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * 这些词条将应用到所有AI分析功能中 (产品测谎、竞品报告等)。
            </p>
          </div>
        </div>

        {/* Right: Term List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-semibold text-gray-700 whitespace-nowrap">
                词库列表 ({filteredTerms.length})
              </h3>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      filterCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-white border text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {categoryLabels[cat] || cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <span className="text-sm">加载词库中...</span>
                </div>
              ) : filteredTerms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  暂无相关词条。
                </div>
              ) : (
                filteredTerms.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 w-20 text-center truncate">
                        {categoryLabels[t.category] || t.category || "General"}
                      </span>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-gray-800">
                          {t.term}
                        </span>
                        <ArrowRight size={14} className="text-gray-300" />
                        <span className="font-bold text-blue-600">
                          {t.replacement}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(t.id)}
                      disabled={deletingId === t.id}
                      className={`p-2 transition-all ${
                        deletingId === t.id
                          ? "opacity-100 cursor-wait"
                          : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      }`}
                      title="删除"
                    >
                      {deletingId === t.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-red-500"
                        />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalVocabLab;
