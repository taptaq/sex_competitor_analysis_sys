import React, { useState, useEffect } from "react";
import { Product } from "../../types";
import { X, Sparkles, Loader2, Save, Wand2, Users, MapPin } from "lucide-react";
import { analyzeUseScenario } from "../../services/gemini";

interface UseScenarioModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, scenario: string, personaAnalysis?: string) => Promise<void>;
  isDomestic?: boolean;
  userPersona?: string;
}

const UseScenarioModal: React.FC<UseScenarioModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  isDomestic = false,
  userPersona = "",
}) => {
  const [scenario, setScenario] = useState<string>("");
  const [personaAnalysis, setPersonaAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setScenario(product.useScenario || "");
      setPersonaAnalysis(product.personaAnalysis || "");
    }
  }, [isOpen, product?.useScenario, product?.personaAnalysis]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeUseScenario(product, isDomestic, userPersona);
      setScenario(result.scenario);
      setPersonaAnalysis(result.personaAnalysis);
    } catch (error) {
      console.error("Failed to analyze use scenario:", error);
      alert("AI 分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!scenario) return;
    setIsSaving(true);
    try {
      await onSave(product.id, scenario, personaAnalysis);
      onClose();
    } catch (error) {
      console.error("Failed to save use scenario:", error);
      alert("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-200">
                <Sparkles className="text-white" size={20} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">深度使用场景洞察</h2>
                <p className="text-sm text-gray-500 mt-0.5">{product.name} 的人群与场景分析</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <Loader2 size={48} className="text-purple-600 animate-spin" />
                <Sparkles className="absolute -top-1 -right-1 text-pink-500 animate-pulse" size={16} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">AI 正在深度分析中...</p>
                <p className="text-sm text-gray-500 mt-1">结合目标人群画像、产品规格与市场趋势</p>
              </div>
            </div>
          ) : (scenario || personaAnalysis) ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Persona Section */}
              {personaAnalysis && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm bg-purple-50 w-fit px-3 py-1 rounded-full border border-purple-100">
                    <Users size={14} />
                    人群适配度分析
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm leading-relaxed text-gray-700 italic">
                    {personaAnalysis}
                  </div>
                </div>
              )}

              {/* Scenario Section */}
              {scenario && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 w-fit px-3 py-1 rounded-full border border-indigo-100">
                    <MapPin size={14} />
                    核心使用场景描述
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 rounded-2xl border border-indigo-100 shadow-inner">
                    <div className="prose prose-purple max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {scenario}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:text-purple-700 transition-colors"
                >
                  <Wand2 size={16} />
                  不喜欢这个结果？重新生成
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Wand2 className="text-purple-400" size={32} />
              </div>
              <p className="text-gray-500 font-medium mb-6">尚未生成使用场景分析</p>
              <button
                onClick={handleAnalyze}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
              >
                <Sparkles size={18} />
                开始 AI 深度分析
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={(!scenario && !personaAnalysis) || isSaving}
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-purple-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            保存分析结果
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseScenarioModal;
