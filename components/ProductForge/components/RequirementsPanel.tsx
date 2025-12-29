import React, { useState } from "react";
import { UserRequirements } from "../types";
import { Sparkles, ChevronRight } from "lucide-react";

interface RequirementsPanelProps {
  onGenerateConfig: (
    requirements: UserRequirements,
    gender: "male" | "female"
  ) => void;
  onSkipToManual: () => void;
  isGenerating: boolean;
}

const RequirementsPanel: React.FC<RequirementsPanelProps> = ({
  onGenerateConfig,
  onSkipToManual,
  isGenerating,
}) => {
  const [gender, setGender] = useState<"male" | "female">("female");
  const [requirements, setRequirements] = useState<UserRequirements>({
    budget: "Medium",
    category: "",
    mustHaveFeatures: [],
    batteryLife: "Medium",
    sizeConstraint: "Standard",
    specialPreferences: [],
    targetAudience: "中端",
    additionalNotes: "",
  });

  const handleSubmit = () => {
    onGenerateConfig(requirements, gender);
  };

  const toggleFeature = (feature: string) => {
    setRequirements((prev) => ({
      ...prev,
      mustHaveFeatures: prev.mustHaveFeatures.includes(feature)
        ? prev.mustHaveFeatures.filter((f) => f !== feature)
        : [...prev.mustHaveFeatures, feature],
    }));
  };

  const togglePreference = (pref: string) => {
    setRequirements((prev) => ({
      ...prev,
      specialPreferences: prev.specialPreferences.includes(pref)
        ? prev.specialPreferences.filter((p) => p !== pref)
        : [...prev.specialPreferences, pref],
    }));
  };

  const availableFeatures = ["震动", "加热", "智能控制", "防水", "温控"];
  const availablePreferences = ["静音优先", "高端外观", "易清洁"];

  return (
    <div className="bg-white py-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">智能配置推荐</h2>
              <p className="text-gray-600 text-sm">
                告诉我们您的需求，AI 将为您生成最优配置方案
              </p>
            </div>
          </div>

          {/* Gender Selection */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标性别
            </label>
            <div className="flex space-x-4">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    gender === g
                      ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {g === "male" ? "男性" : "女性"}
                </button>
              ))}
            </div>
          </section>

          {/* Category Selection */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品品类（可选）
            </label>
            <select
              value={requirements.category}
              onChange={(e) =>
                setRequirements({ ...requirements, category: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="">让AI自动选择</option>
              {gender === "female" ? (
                <>
                  <option value="震动棒">震动棒</option>
                  <option value="跳蛋">跳蛋</option>
                  <option value="吮吸器">吮吸器</option>
                  <option value="按摩棒">按摩棒</option>
                  <option value="G点刺激器">G点刺激器</option>
                </>
              ) : (
                <>
                  <option value="飞机杯">飞机杯</option>
                  <option value="前列腺按摩器">前列腺按摩器</option>
                  <option value="延时套">延时套</option>
                  <option value="震动环">震动环</option>
                </>
              )}
            </select>
          </section>

          {/* Budget */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预算范围
            </label>
            <select
              value={requirements.budget}
              onChange={(e) =>
                setRequirements({
                  ...requirements,
                  budget: e.target.value as any,
                })
              }
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="Low">低预算 (¥50-150)</option>
              <option value="Medium">中等预算 (¥150-400)</option>
              <option value="High">较高预算 (¥400-800)</option>
              <option value="Premium">高端预算 (¥800+)</option>
            </select>
          </section>

          {/* Must-have Features */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              必备功能
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <button
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`py-2 px-4 rounded-lg border transition-all text-sm ${
                    requirements.mustHaveFeatures.includes(feature)
                      ? "border-green-500 bg-green-50 text-green-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </section>

          {/* Battery Life */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              续航要求
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Short", "Medium", "Long"] as const).map((life) => (
                <button
                  key={life}
                  onClick={() =>
                    setRequirements({ ...requirements, batteryLife: life })
                  }
                  className={`py-3 px-4 rounded-lg border transition-all ${
                    requirements.batteryLife === life
                      ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {life === "Short"
                    ? "短 (1-2h)"
                    : life === "Medium"
                    ? "中 (2-4h)"
                    : "长 (4-6h)"}
                </button>
              ))}
            </div>
          </section>

          {/* Size Constraint */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              尺寸偏好
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Compact", "Standard", "Large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() =>
                    setRequirements({ ...requirements, sizeConstraint: size })
                  }
                  className={`py-3 px-4 rounded-lg border transition-all ${
                    requirements.sizeConstraint === size
                      ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {size === "Compact"
                    ? "小巧便携"
                    : size === "Standard"
                    ? "标准尺寸"
                    : "大容量"}
                </button>
              ))}
            </div>
          </section>

          {/* Special Preferences */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              特殊偏好
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availablePreferences.map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePreference(pref)}
                  className={`py-2 px-4 rounded-lg border transition-all text-sm ${
                    requirements.specialPreferences.includes(pref)
                      ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </section>

          {/* Target Audience */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标用户群
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["入门级", "中端", "高端"] as const).map((audience) => (
                <button
                  key={audience}
                  onClick={() =>
                    setRequirements({
                      ...requirements,
                      targetAudience: audience,
                    })
                  }
                  className={`py-3 px-4 rounded-lg border transition-all ${
                    requirements.targetAudience === audience
                      ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {audience}
                </button>
              ))}
            </div>
          </section>

          {/* Additional Notes */}
          <section className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补充说明（选填）
            </label>
            <textarea
              value={requirements.additionalNotes}
              onChange={(e) =>
                setRequirements({
                  ...requirements,
                  additionalNotes: e.target.value,
                })
              }
              placeholder="例如：希望有温变图案、需要支持VR联动等..."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
              rows={3}
            />
          </section>

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform ${
                isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105 active:scale-95"
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>AI 正在生成配置...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>生成推荐配置</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </button>

            <button
              onClick={onSkipToManual}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all border border-gray-300"
            >
              跳过，手动配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsPanel;
