import React, { useState } from "react";
import { ProductConfig } from "../types";
import { Check, X, Save, ArrowRight } from "lucide-react";

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalConfig: ProductConfig;
  optimizedConfig: ProductConfig;
  onApply: () => void;
  onSaveAndApply: (name: string) => void;
}

const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOpen,
  onClose,
  originalConfig,
  optimizedConfig,
  onApply,
  onSaveAndApply,
}) => {
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveAndApply(saveName);
  };

  const ChangesList = ({
    label,
    oldVal,
    newVal,
  }: {
    label: string;
    oldVal: string;
    newVal: string;
  }) => {
    if (oldVal === newVal) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-200 last:border-0">
        <span className="text-gray-600 font-medium min-w-[80px] flex-shrink-0">
          {label}
        </span>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
          <span
            className="text-gray-500 line-through break-words"
            title={oldVal}
          >
            {oldVal}
          </span>
          <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0 hidden sm:block" />
          <span
            className="text-green-700 font-semibold break-words"
            title={newVal}
          >
            {newVal}
          </span>
        </div>
      </div>
    );
  };

  const ArrayChanges = ({
    label,
    oldArr,
    newArr,
  }: {
    label: string;
    oldArr: string[];
    newArr: string[];
  }) => {
    const oldStr = oldArr.join(", ");
    const newStr = newArr.join(", ");
    return <ChangesList label={label} oldVal={oldStr} newVal={newStr} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
              ✨
            </span>
            AI 优化方案建议
          </h2>
          <p className="text-gray-600 text-sm mt-1 ml-11">
            AI 已根据分析结果生成了更优的配置方案，旨在降低成本并提高可行性。
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
              变更对比详情
            </h3>
            <div className="bg-white rounded px-4 border border-gray-200">
              <ChangesList
                label="品类"
                oldVal={originalConfig.category}
                newVal={optimizedConfig.category}
              />
              <ArrayChanges
                label="材质"
                oldArr={originalConfig.material}
                newArr={optimizedConfig.material}
              />
              <ArrayChanges
                label="驱动系统"
                oldArr={originalConfig.drive}
                newArr={optimizedConfig.drive}
              />
              <ArrayChanges
                label="主控系统"
                oldArr={originalConfig.mainControl}
                newArr={optimizedConfig.mainControl}
              />
              <ArrayChanges
                label="加热系统"
                oldArr={originalConfig.heating}
                newArr={optimizedConfig.heating}
              />
              <ArrayChanges
                label="传感器系统"
                oldArr={originalConfig.sensors}
                newArr={optimizedConfig.sensors}
              />
              <ArrayChanges
                label="电源系统"
                oldArr={originalConfig.power}
                newArr={optimizedConfig.power}
              />
              <ArrayChanges
                label="设备辅助"
                oldArr={originalConfig.accessories}
                newArr={optimizedConfig.accessories}
              />
              <ArrayChanges
                label="图纹"
                oldArr={originalConfig.texture}
                newArr={optimizedConfig.texture}
              />
              <ArrayChanges
                label="工艺"
                oldArr={originalConfig.process}
                newArr={optimizedConfig.process}
              />
              <ArrayChanges
                label="通信协议"
                oldArr={originalConfig.protocol}
                newArr={optimizedConfig.protocol}
              />
              <ChangesList
                label="目标性别"
                oldVal={originalConfig.gender === "male" ? "男用" : "女用"}
                newVal={optimizedConfig.gender === "male" ? "男用" : "女用"}
              />
            </div>
            {/* Fallback if no visual changes detected but AI still returned something (rare but possible logic) */}
            {JSON.stringify(originalConfig) ===
              JSON.stringify(optimizedConfig) && (
              <p className="text-amber-400 text-sm mt-2 text-center">
                AI 认为当前配置已是最优，未进行修改。
              </p>
            )}
          </div>

          {isSaving ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-700 mb-2">
                为新配置命名
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full bg-white border border-green-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="例如：优化版-智能手环 V2"
              />
              <div className="flex justify-end space-x-3 mt-3">
                <button
                  onClick={() => setIsSaving(false)}
                  className="text-gray-600 hover:text-gray-900 text-sm px-3 py-1"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1 rounded text-sm font-medium flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  保存并应用
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
              <span>您可以选择直接应用，或将其另存为新配置。</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            放弃修改
          </button>

          {!isSaving && (
            <button
              onClick={() => {
                // Pre-fill a default name
                setSaveName(
                  `优化版 ${
                    optimizedConfig.category
                  } ${new Date().toLocaleTimeString()}`
                );
                setIsSaving(true);
              }}
              className="px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              另存为...
            </button>
          )}

          <button
            onClick={onApply}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg shadow-md font-bold flex items-center transition-all transform hover:scale-105"
          >
            <Check className="w-4 h-4 mr-2" />
            应用并重新分析
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptimizationModal;
