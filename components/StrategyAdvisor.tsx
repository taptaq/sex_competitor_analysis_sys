import React, { useState } from "react";
import { getStrategyAdvice } from "../services/gemini";
import {
  Send,
  Sparkles,
  Loader2,
  Target,
  ShieldCheck,
  DollarSign,
  AlertCircle,
} from "lucide-react";

const StrategyAdvisor: React.FC = () => {
  const [concept, setConcept] = useState("");
  const [isDomestic, setIsDomestic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);
    try {
      const advice = await getStrategyAdvice(concept, isDomestic);
      setResult(advice);
    } catch (err) {
      console.error(err);
      setResult({
        differentiation:
          "由于连接压力测试引擎失败，无法生成报告。请检查网络或 API 状态。",
        compliance: "服务暂时不可用。",
        pricing: "无法计算。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
          <AlertCircle size={14} />
          已进入硬核压力测试模式
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          创业策略压力测试员
        </h1>
        <p className="text-gray-500">
          抛弃幸存者偏差，用真实行业中位数数据审视你的想法。
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-gray-700">
              描述你的新产品概念或商业计划...
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDomestic}
                onChange={(e) => setIsDomestic(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600 font-medium">
                国内市场/品牌
              </span>
            </label>
          </div>
          <div className="relative">
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="例如：开发一款面向异地情侣的、具备触感同步功能的隐形穿戴产品，主打高端礼品市场..."
              className="w-full h-32 p-4 pr-12 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-gray-700 resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !concept.trim()}
              className="absolute bottom-4 right-4 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="p-3 bg-red-100 text-red-700 w-fit rounded-xl">
              <Target size={24} />
            </div>
            <h3 className="font-bold text-lg">可行性压力测试</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.differentiation}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="p-3 bg-orange-100 text-orange-700 w-fit rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-lg">流量与获客壁垒</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.compliance}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="p-3 bg-purple-100 text-purple-700 w-fit rounded-xl">
              <DollarSign size={24} />
            </div>
            <h3 className="font-bold text-lg">定价与生存模型</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.pricing}
            </p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-4">
          <Sparkles size={48} className="opacity-20" />
          <p className="text-sm italic">
            输入你的想法，接受最真实的市场残酷审讯。
          </p>
        </div>
      )}
    </div>
  );
};

export default StrategyAdvisor;
