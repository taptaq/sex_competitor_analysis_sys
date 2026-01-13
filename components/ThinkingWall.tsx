import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Plus,
  X,
  Pencil,
  Check,
  Loader2,
  StickyNote,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const COLORS = [
  {
    id: "yellow",
    bg: "bg-yellow-100",
    border: "border-yellow-200",
    text: "text-yellow-900",
  },
  {
    id: "pink",
    bg: "bg-pink-100",
    border: "border-pink-200",
    text: "text-pink-900",
  },
  {
    id: "blue",
    bg: "bg-blue-100",
    border: "border-blue-200",
    text: "text-blue-900",
  },
  {
    id: "green",
    bg: "bg-green-100",
    border: "border-green-200",
    text: "text-green-900",
  },
  {
    id: "purple",
    bg: "bg-purple-100",
    border: "border-purple-200",
    text: "text-purple-900",
  },
];

const ThinkingWall: React.FC = () => {
  const {
    thinkingNotes,
    fetchThinkingNotes,
    addThinkingNote,
    updateThinkingNote,
    deleteThinkingNote,
    analyzeThinkingNote,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(
    null
  );

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [isAdding, setIsAdding] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchThinkingNotes().finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newNoteContent.trim()) return;
    setIsAdding(true);
    await addThinkingNote({ content: newNoteContent, color: selectedColor });
    setNewNoteContent("");
    setIsAdding(false);
  };

  const handleStartEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (editContent.trim() !== "") {
      await updateThinkingNote(id, { content: editContent });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要撕掉这张便签吗？")) {
      await deleteThinkingNote(id);
    }
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    await analyzeThinkingNote(id);
    setAnalyzingId(null);
    setExpandedAnalysisId(id); // Auto expand info after analyzing
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 md:p-8 rounded-2xl text-white shadow-lg mb-8">
        <div className="flex items-center gap-3">
          <StickyNote size={32} className="text-white/90" />
          <div>
            <h1 className="text-2xl font-bold">思考墙 (Thinking Wall)</h1>
            <p className="text-amber-100 text-sm mt-1">
              随时记录灵感与思考碎片 - Brainstorming Space
            </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 transition-all hover:shadow-md">
        <div className="mb-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="在此记下你的想法..."
            className={`w-full p-4 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none text-lg transition-colors ${
              COLORS.find((c) => c.id === selectedColor)?.bg || "bg-white"
            } ${
              COLORS.find((c) => c.id === selectedColor)?.border ||
              "border-gray-200"
            }`}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color.bg
                } ${
                  selectedColor === color.id
                    ? "border-gray-600 scale-110"
                    : "border-transparent hover:scale-105"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newNoteContent.trim() || isAdding}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow"
          >
            {isAdding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            贴在墙上
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading && thinkingNotes.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {thinkingNotes.map((note) => {
            const style = COLORS.find((c) => c.id === note.color) || COLORS[0];
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className={`group relative p-6 rounded-sm shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:rotate-0 rotate-1 ${style.bg} overflow-hidden`}
                style={{ minHeight: "200px" }}
              >
                {/* Tape effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 shadow-sm rotate-2 backdrop-blur-sm z-10"></div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => handleAnalyze(note.id)}
                        className="p-1.5 bg-white/60 hover:bg-violet-100 rounded-full text-violet-600 transition-colors"
                        title="AI 深度挖掘"
                        disabled={!!analyzingId}
                      >
                        {analyzingId === note.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 bg-white/60 hover:bg-white rounded-full text-gray-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 bg-white/60 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="h-full flex flex-col">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full bg-transparent border-none outline-none resize-none text-lg font-handwriting"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-black/10">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:bg-black/10 rounded"
                      >
                        <X size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="p-1 hover:bg-black/10 rounded"
                      >
                        <Check size={18} className="text-green-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-lg leading-relaxed whitespace-pre-wrap ${style.text} font-medium`}
                  >
                    {note.content}
                  </div>
                )}

                {note.analysis && !isEditing && (
                  <div className="mt-4 pt-4 border-t border-black/10">
                    <button
                      onClick={() =>
                        setExpandedAnalysisId(
                          expandedAnalysisId === note.id ? null : note.id
                        )
                      }
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100 mb-2"
                    >
                      <Sparkles size={12} />
                      AI Insight
                      {expandedAnalysisId === note.id ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>

                    {expandedAnalysisId === note.id && (
                      <div className="bg-white/50 rounded p-3 text-sm space-y-2 backdrop-blur-sm">
                        <div>
                          <div className="text-xs text-gray-500 font-bold">
                            核心概念
                          </div>
                          <div className="font-medium text-gray-900">
                            {note.analysis.coreConcept}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-bold">
                            深层洞察
                          </div>
                          <div className="text-gray-800 leading-snug text-xs">
                            {note.analysis.deepInsight}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-rose-500 font-bold">
                            盲点/风险
                          </div>
                          <div className="text-rose-900 text-xs text-xs">
                            {(note.analysis.blindSpots || []).join("; ")}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-emerald-600 font-bold">
                            行动建议
                          </div>
                          <div className="text-emerald-900 text-xs">
                            {(note.analysis.actionableSteps || []).join("; ")}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-violet-600 font-bold">
                            创新角度
                          </div>
                          <div className="text-violet-900 text-xs italic">
                            "{note.analysis.innovationAngle}"
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <div className="absolute bottom-3 right-4 text-xs opacity-40 font-mono">
                    {new Date(
                      note.created_at || Date.now()
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThinkingWall;
