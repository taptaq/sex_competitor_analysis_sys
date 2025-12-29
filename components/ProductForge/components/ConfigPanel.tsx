import React, { useState, useEffect } from "react";
import { PRODUCT_OPTIONS } from "../constants";
import { ProductConfig } from "../types";
import { Shuffle, Save, FolderOpen, Trash2 } from "lucide-react";
import MultiSelectField from "./MultiSelectField";

interface ConfigPanelProps {
  config: ProductConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProductConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

interface SavedConfig {
  name: string;
  date: number;
  config: ProductConfig;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  onGenerate,
  isGenerating,
}) => {
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("productforge_configs");
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load configs", e);
      }
    }
  }, []);

  const saveConfig = () => {
    const name = prompt(
      "请输入配置名称保存:",
      `配置 ${new Date().toLocaleDateString()}`
    );
    if (!name) return;

    const newSaved = [{ name, date: Date.now(), config }, ...savedConfigs];
    setSavedConfigs(newSaved);
    localStorage.setItem("productforge_configs", JSON.stringify(newSaved));
  };

  const loadConfig = (saved: SavedConfig) => {
    setConfig(saved.config);
    setShowLoadModal(false);
  };

  const deleteConfig = (index: number) => {
    if (confirm("确定要删除这个配置吗？")) {
      const newSaved = savedConfigs.filter((_, i) => i !== index);
      setSavedConfigs(newSaved);
      localStorage.setItem("productforge_configs", JSON.stringify(newSaved));
    }
  };

  const handleRandomize = () => {
    const randomOption = <T extends { label: string }>(arr: T[]) =>
      arr[Math.floor(Math.random() * arr.length)];

    // Randomly select gender
    const randomGender: "male" | "female" =
      Math.random() > 0.5 ? "male" : "female";

    // Define categories based on gender
    const maleCategories = [
      "飞机杯 (Masturbator Cup)",
      "前列腺按摩器 (Prostate Massager)",
      "锁精环 (Cock Ring)",
      "互动设备 (Interactive Device)",
      "延时训练器 (Endurance Trainer)",
    ];

    const femaleCategories = [
      "震动棒 (Vibrator)",
      "仿真器具 (Dildo)",
      "吮吸器 (Clitoral Stimulator)",
      "凯格尔球 (Kegel Ball)",
      "跳蛋 (Bullet Vibrator)",
    ];

    const categories =
      randomGender === "male" ? maleCategories : femaleCategories;

    setConfig({
      gender: randomGender,
      category: categories[Math.floor(Math.random() * categories.length)],
      background: config.background, // Keep existing background
      features: config.features, // Keep existing features
      material: [randomOption(PRODUCT_OPTIONS.materials).label],
      drive: [randomOption(PRODUCT_OPTIONS.driveComponents).label],
      mainControl: [randomOption(PRODUCT_OPTIONS.controlComponents).label],
      heating: [randomOption(PRODUCT_OPTIONS.heatingComponents).label],
      sensors: [randomOption(PRODUCT_OPTIONS.sensorComponents).label],
      power: [randomOption(PRODUCT_OPTIONS.powerComponents).label],
      accessories: [randomOption(PRODUCT_OPTIONS.accessories).label],
      color: [randomOption(PRODUCT_OPTIONS.colors).label],
      texture: [randomOption(PRODUCT_OPTIONS.textures).label],
      process: [randomOption(PRODUCT_OPTIONS.processes).label],
      protocol: [randomOption(PRODUCT_OPTIONS.protocols).label],
    });
  };

  const handleChange = (key: keyof ProductConfig, value: string | string[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">规格配置</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowLoadModal(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <FolderOpen className="w-4 h-4" />
              <span>加载配置</span>
            </button>
            <button
              onClick={saveConfig}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              <span>保存配置</span>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-2 self-center" />
            <button
              onClick={handleRandomize}
              disabled={isGenerating}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Shuffle className="w-4 h-4" />
              <span>随机配置</span>
            </button>
          </div>
        </div>

        {/* Load Modal Overlay */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">已保存的配置</h3>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  关闭
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {savedConfigs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    暂无保存的配置
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedConfigs.map((saved, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-3 rounded-lg flex justify-between items-center group hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className="flex-grow cursor-pointer"
                          onClick={() => loadConfig(saved)}
                        >
                          <p className="font-medium text-gray-900">
                            {saved.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(saved.date).toLocaleString()} •{" "}
                            {saved.config.category}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteConfig(idx)}
                          className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Section 1: Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-purple-700 border-l-4 border-purple-600 pl-3">
            1. 基础定位 (Basic Info)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Selection */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-500/50 transition-colors shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                目标用户性别 (Target Gender)
              </label>
              <div className="flex space-x-4">
                <label
                  className={`flex-1 cursor-pointer p-3 rounded-lg border transition-all ${
                    config.gender === "male"
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={config.gender === "male"}
                    onChange={() => handleChange("gender", "male")}
                    className="hidden"
                    disabled={isGenerating}
                  />
                  <div className="text-center font-medium">男用 (Male)</div>
                </label>
                <label
                  className={`flex-1 cursor-pointer p-3 rounded-lg border transition-all ${
                    config.gender === "female"
                      ? "bg-pink-600 border-pink-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={config.gender === "female"}
                    onChange={() => handleChange("gender", "female")}
                    className="hidden"
                    disabled={isGenerating}
                  />
                  <div className="text-center font-medium">女用 (Female)</div>
                </label>
              </div>
            </div>

            {/* Category Selection */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-500/50 transition-colors shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                产品品类 (Category)
              </label>
              <select
                value={config.category}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  选择品类
                </option>
                {(config.gender === "male"
                  ? [
                      "飞机杯 (Masturbator Cup)",
                      "前列腺按摩器 (Prostate Massager)",
                      "锁精环 (Cock Ring)",
                      "互动设备 (Interactive Device)",
                      "延时训练器 (Endurance Trainer)",
                    ]
                  : [
                      "震动棒 (Vibrator)",
                      "仿真器具 (Dildo)",
                      "吮吸器 (Clitoral Stimulator)",
                      "凯格尔球 (Kegel Ball)",
                      "跳蛋 (Bullet Vibrator)",
                    ]
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Custom Details */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-purple-700 border-l-4 border-purple-600 pl-3">
            2. 个性化定义 (Custom Details)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-500/50 transition-colors shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                创作背景 / 故事 (Background)
              </label>
              <textarea
                value={config.background}
                onChange={(e) => handleChange("background", e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none"
                placeholder="例如：赛博朋克风格，为异地恋情侣设计..."
              />
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-500/50 transition-colors shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                核心特征 / 卖点 (Key Features)
              </label>
              <textarea
                value={config.features}
                onChange={(e) => handleChange("features", e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none"
                placeholder="例如：人体工学握持，静音马达，APP远程控制..."
              />
            </div>
          </div>
        </section>

        {/* Section 3: Technical Specs (Existing) */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-purple-700 border-l-4 border-purple-600 pl-3">
            3. 技术规格 (Technical Specs)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MultiSelectField
              label="材质 (Material)"
              value={config.material}
              options={PRODUCT_OPTIONS.materials}
              onChange={(values) => handleChange("material", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="驱动系统 (Drive)"
              value={config.drive}
              options={PRODUCT_OPTIONS.driveComponents}
              onChange={(values) => handleChange("drive", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="主控系统 (Main Control)"
              value={config.mainControl}
              options={PRODUCT_OPTIONS.controlComponents}
              onChange={(values) => handleChange("mainControl", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="加热系统 (Heating)"
              value={config.heating}
              options={PRODUCT_OPTIONS.heatingComponents}
              onChange={(values) => handleChange("heating", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="传感器系统 (Sensors)"
              value={config.sensors}
              options={PRODUCT_OPTIONS.sensorComponents}
              onChange={(values) => handleChange("sensors", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="电源系统 (Power)"
              value={config.power}
              options={PRODUCT_OPTIONS.powerComponents}
              onChange={(values) => handleChange("power", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="设备辅助 (Accessories)"
              value={config.accessories}
              options={PRODUCT_OPTIONS.accessories}
              onChange={(values) => handleChange("accessories", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="CMF: 颜色 (Color)"
              value={config.color}
              options={PRODUCT_OPTIONS.colors}
              onChange={(values) => handleChange("color", values)}
              disabled={isGenerating}
              showColorPreview={true}
            />

            <MultiSelectField
              label="图纹/纹理 (Texture)"
              value={config.texture}
              options={PRODUCT_OPTIONS.textures}
              onChange={(values) => handleChange("texture", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="制造工艺 (Process)"
              value={config.process}
              options={PRODUCT_OPTIONS.processes}
              onChange={(values) => handleChange("process", values)}
              disabled={isGenerating}
            />

            <MultiSelectField
              label="通信协议 (Connectivity)"
              value={config.protocol}
              options={PRODUCT_OPTIONS.protocols}
              onChange={(values) => handleChange("protocol", values)}
              disabled={isGenerating}
            />
          </div>
        </section>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={
            isGenerating ||
            config.material.length === 0 ||
            (config.drive.length === 0 &&
              config.mainControl.length === 0 &&
              config.heating.length === 0 &&
              config.sensors.length === 0 &&
              config.power.length === 0)
          }
          className={`
                px-8 py-4 rounded-lg font-semibold text-white shadow-lg transition-all transform active:scale-95
                ${
                  isGenerating || config.material.length === 0
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/40"
                }
            `}
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>正在进行技术验证...</span>
            </div>
          ) : (
            "验证并生成可视化"
          )}
        </button>
      </div>
    </>
  );
};

export default ConfigPanel;
