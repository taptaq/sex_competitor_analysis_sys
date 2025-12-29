import React, { useState } from "react";
import ConfigPanel from "./ProductForge/components/ConfigPanel";
import AnalysisResultView from "./ProductForge/components/AnalysisResult";
import OptimizationModal from "./ProductForge/components/OptimizationModal";
import RequirementsPanel from "./ProductForge/components/RequirementsPanel";
import { ProductConfig, AnalysisResult, UserRequirements } from "./ProductForge/types";
import {
  generateProductAnalysis,
  generateProductImage,
  generateOptimizedConfig,
  generateRecommendedConfig,
} from "../services/gemini";
import { ArrowLeft } from "lucide-react";

const ProductForge: React.FC = () => {
  const [config, setConfig] = useState<ProductConfig>({
    gender: "female",
    category: "",
    background: "",
    features: "",
    material: [],
    drive: [],
    mainControl: [],
    heating: [],
    sensors: [],
    power: [],
    accessories: [],
    color: [],
    texture: [],
    process: [],
    protocol: [],
  });

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewState, setViewState] = useState<
    "requirements" | "config" | "results"
  >("requirements");
  const [error, setError] = useState<string | null>(null);

  const [referenceAnalysis, setReferenceAnalysis] = useState<
    AnalysisResult | undefined
  >(undefined);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setImageUrl(null);

    try {
      const analysisResult = await generateProductAnalysis(
        config,
        referenceAnalysis
      );
      setAnalysis(analysisResult);
      setViewState("results");
      setIsGenerating(false);

      setIsGeneratingImage(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const imageResult = await generateProductImage(config);
      setImageUrl(imageResult);
    } catch (err) {
      console.error(err);
      setError("生成分析报告失败，请重试。");
      setIsGenerating(false);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!analysis) return;
    setIsGeneratingImage(true);
    setImageUrl(null);
    try {
      const imageResult = await generateProductImage(config);
      setImageUrl(imageResult);
    } catch (err) {
      console.error(err);
      setError("重新生成图片失败。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizedConfigCandidate, setOptimizedConfigCandidate] =
    useState<ProductConfig | null>(null);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);

  const handleOptimize = async () => {
    if (!analysis) return;
    setIsOptimizing(true);
    try {
      const optimizedConfig = await generateOptimizedConfig(config, analysis);
      setOptimizedConfigCandidate(optimizedConfig);
      setShowOptimizationModal(true);
    } catch (error) {
      console.error(error);
      setError("生成优化方案失败。");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (optimizedConfigCandidate && analysis) {
      setConfig(optimizedConfigCandidate);
      setReferenceAnalysis(analysis);
      setShowOptimizationModal(false);
      setOptimizedConfigCandidate(null);

      setIsReAnalyzing(true);
      setTimeout(() => {
        handleGenerate().finally(() => setIsReAnalyzing(false));
      }, 100);
    }
  };

  const handleSaveAndApplyOptimization = (name: string) => {
    if (optimizedConfigCandidate) {
      const savedConfigs = JSON.parse(
        localStorage.getItem("productforge_configs") || "[]"
      );
      const newSavedConfig = {
        id: Date.now().toString(),
        name,
        date: Date.now(),
        config: optimizedConfigCandidate,
      };
      localStorage.setItem(
        "productforge_configs",
        JSON.stringify([...savedConfigs, newSavedConfig])
      );

      handleApplyOptimization();
    }
  };

  const handleGenerateRecommendation = async (
    requirements: UserRequirements,
    gender: "male" | "female"
  ) => {
    setError(null);
    setIsGenerating(true);

    try {
      const recommendedConfig = await generateRecommendedConfig(
        requirements,
        gender
      );
      setConfig(recommendedConfig);
      setViewState("config");
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法生成推荐配置");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setViewState("config");
  };

  return (
    <div className="relative">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 overflow-auto max-h-32">
                <p className="text-sm break-words whitespace-pre-wrap">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm underline hover:text-red-900 flex-shrink-0"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Only show when in config/requirements mode */}
        {(viewState === "requirements" || viewState === "config") && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewState("requirements")}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  viewState === "requirements"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>✨</span>
                  <span>AI 智能推荐</span>
                </div>
              </button>
              <button
                onClick={() => setViewState("config")}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  viewState === "config"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>手动配置</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {viewState === "requirements" ? (
          <RequirementsPanel
            onGenerateConfig={handleGenerateRecommendation}
            onSkipToManual={() => setViewState("config")}
            isGenerating={isGenerating}
          />
        ) : viewState === "config" ? (
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        ) : (
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>修改配置</span>
            </button>

            {analysis && (
              <AnalysisResultView
                analysis={analysis}
                imageUrl={imageUrl}
                configSummary={`${config.color.join(
                  ", "
                )} ${config.material.join(", ")} | 驱动:${config.drive.join(
                  ", "
                )} | 主控:${config.mainControl.join(
                  ", "
                )} | 加热:${config.heating.join(
                  ", "
                )} | 传感器:${config.sensors.join(
                  ", "
                )} | 电源:${config.power.join(", ")}`}
                onOptimize={handleOptimize}
                isOptimizing={isOptimizing}
                isGeneratingImage={isGeneratingImage}
                onRegenerateImage={handleRegenerateImage}
              />
            )}
          </div>
        )}
      </main>

      {analysis && (
        <OptimizationModal
          isOpen={showOptimizationModal}
          onClose={() => setShowOptimizationModal(false)}
          originalConfig={config}
          optimizedConfig={optimizedConfigCandidate || config}
          onApply={handleApplyOptimization}
          onSaveAndApply={handleSaveAndApplyOptimization}
        />
      )}

      {/* Re-analysis Loading Overlay */}
      {isReAnalyzing && (
        <div className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-t-4 border-purple-300 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-pulse">
            验证优化方案 Improvements...
          </h2>
          <p className="text-purple-600 font-medium">
            AI 正在根据之前的分析基准重新评估成本与风险
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductForge;

