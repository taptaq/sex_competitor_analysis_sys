import React from "react";
import { AnalysisResult } from "../types";
import {
  CheckCircle2,
  AlertTriangle,
  Battery,
  Palette,
  Banknote,
  Cpu,
  Download,
  Info,
  RefreshCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AnalysisResultProps {
  analysis: AnalysisResult;
  imageUrl: string | null;
  configSummary: string;
  onOptimize: () => void;
  isOptimizing: boolean;
  isGeneratingImage: boolean;
  onRegenerateImage: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultProps> = ({
  analysis,
  imageUrl,
  configSummary,
  onOptimize,
  isOptimizing,
  isGeneratingImage,
  onRegenerateImage,
}) => {
  // Data for chart
  const chartData = [
    { name: "Feasibility", value: analysis.feasibilityScore, full: 100 },
  ];

  const getCostLabel = (cost: string) => {
    switch (cost) {
      case "Low":
        return "低成本";
      case "Medium":
        return "中等成本";
      case "High":
        return "高成本";
      case "Premium":
        return "昂贵/奢华";
      default:
        return cost;
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case "Low":
        return "text-green-600";
      case "Medium":
        return "text-yellow-600";
      case "High":
        return "text-orange-600";
      case "Premium":
        return "text-red-600";
      default:
        return "text-gray-900";
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "product-concept.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReport = () => {
    const imageSection = imageUrl
      ? `\n## 产品概念图\n![产品概念图](${imageUrl})\n`
      : "";

    const content = `
# 产品技术分析报告
${imageSection}
## 产品配置详情
- **目标性别**: ${
      configSummary.includes("Male") || configSummary.includes("男")
        ? "男用"
        : "女用"
    }
- **配置摘要**: ${configSummary}

## 生产可行性评分
**${analysis.feasibilityScore} / 100**
> **评分说明**: ${analysis.feasibilityRationale || "暂无评分说明"}

## 技术深度分析
### 成本估算
${getCostLabel(analysis.costEstimate)} (${analysis.costEstimate})

### 功耗分析
${analysis.powerAnalysis}

### 设计美学与制造建议
${analysis.designAesthetics}

### 潜在工程挑战
${analysis.technicalChallenges.map((c) => `- ${c}`).join("\n")}

### 生产建议流程
${analysis.manufacturingAdvice.map((step, i) => `${i + 1}. ${step}`).join("\n")}
    `;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "产品分析报告.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in-up">
      {/* Left Column: Visuals & Score (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Image Card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="relative aspect-square w-full bg-gray-50 group">
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Product Concept"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6 space-x-3">
                  <button
                    onClick={onRegenerateImage}
                    className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>重绘</span>
                  </button>
                  <button
                    onClick={downloadImage}
                    className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>保存图片</span>
                  </button>
                </div>
              </>
            ) : isGeneratingImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mb-4" />
                <p className="text-purple-600 text-sm animate-pulse font-medium">
                  正在绘制概念图...
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center border-2 border-dashed border-gray-300 m-4 rounded-xl box-border">
                <Palette className="w-12 h-12 mb-4 opacity-50" />
                <p className="mb-4 text-gray-700">暂无可视化预览</p>
                <button
                  onClick={onRegenerateImage}
                  className="text-purple-600 hover:text-purple-700 flex items-center space-x-2 text-sm transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>生成图片</span>
                </button>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
              概念渲染图
            </p>
            <p
              className="text-sm text-gray-700 line-clamp-1"
              title={configSummary}
            >
              {configSummary}
            </p>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 relative shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
                生产可行性评分
              </h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 hover:text-purple-600 cursor-help transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-white border border-gray-200 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                  <h4 className="text-gray-900 text-xs font-bold mb-2">
                    评分标准说明
                  </h4>
                  <ul className="space-y-1.5 text-[10px] text-gray-700">
                    <li className="flex justify-between">
                      <span className="text-green-400 font-medium">90-100</span>
                      <span>技术成熟，低风险，即刻投产</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-indigo-400 font-medium">75-89</span>
                      <span>主流方案，少量适配工作</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-yellow-400 font-medium">60-74</span>
                      <span>需定制开发，有一定工程挑战</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-red-400 font-medium">&lt; 60</span>
                      <span>高风险，需突破性研发或极高成本</span>
                    </li>
                  </ul>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45 -mt-1"></div>
                </div>
              </div>
            </div>
            <button
              onClick={downloadReport}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出报告</span>
            </button>
          </div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-5xl font-bold text-gray-900">
              {analysis.feasibilityScore}
            </span>
            <span className="text-gray-500 mb-2">/ 100</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                analysis.feasibilityScore > 75
                  ? "bg-green-500"
                  : analysis.feasibilityScore > 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${analysis.feasibilityScore}%` }}
            ></div>
          </div>
          {/* Rationale Display */}
          {analysis.feasibilityRationale && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                评分依据
              </h4>
              <div className="space-y-2">
                {analysis.feasibilityRationale
                  .split(/\n+/)
                  .map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Check if line already starts with a number
                    const hasNumber = /^\d+[\.\)、]/.test(trimmed);

                    return (
                      <div
                        key={index}
                        className="flex gap-2 text-sm text-gray-700"
                      >
                        {!hasNumber && (
                          <span className="text-green-600 font-semibold flex-shrink-0">
                            {index + 1}.
                          </span>
                        )}
                        <p className="leading-relaxed">
                          {hasNumber ? trimmed : trimmed}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed Analysis (3 cols) */}
      <div className="lg:col-span-3 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 text-green-600">
                <Banknote className="w-5 h-5" />
                <h4 className="font-medium text-gray-900">成本估算</h4>
              </div>
            </div>
            <p
              className={`text-2xl font-bold ${getCostColor(
                analysis.costEstimate
              )}`}
            >
              {getCostLabel(analysis.costEstimate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">相对单位生产成本</p>

            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-700 text-xs py-2 px-3 rounded-lg border border-green-200 transition-colors flex items-center justify-center space-x-2"
            >
              {isOptimizing ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Cpu className="w-3 h-3" />
              )}
              <span>{isOptimizing ? "正在生成..." : "生成优化方案"}</span>
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
            <div className="flex items-center space-x-3 mb-3 text-blue-600">
              <Battery className="w-5 h-5" />
              <h4 className="font-medium text-gray-900">功耗分析</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {analysis.powerAnalysis}
            </p>
          </div>
        </div>

        {/* Aesthetics & Manufacturing */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-purple-600">
            <Palette className="w-5 h-5" />
            <h4 className="font-medium text-gray-900">美学与制造建议</h4>
          </div>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase block mb-2">
                设计美感
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">
                {analysis.designAesthetics}
              </p>
            </div>
            <div className="h-px bg-gray-200" />
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase block mb-3">
                生产建议流程
              </span>
              <ol className="space-y-3">
                {analysis.manufacturingAdvice.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-3 group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-mono group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-gray-700 pt-0.5 group-hover:text-gray-900 transition-colors">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Challenges List */}
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-center space-x-3 mb-4 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-medium text-gray-900">潜在工程风险</h4>
          </div>
          <ul className="space-y-3">
            {analysis.technicalChallenges.map((challenge, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-3 text-sm text-gray-700"
              >
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                <span>{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
