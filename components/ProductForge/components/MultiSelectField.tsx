import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface MultiSelectOption {
  id: string;
  label: string;
  desc?: string;
  hex?: string;
}

interface MultiSelectFieldProps {
  label: string;
  value: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  showColorPreview?: boolean;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "选择或添加选项",
  showColorPreview = false,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleOption = (optionLabel: string) => {
    if (value.includes(optionLabel)) {
      onChange(value.filter(v => v !== optionLabel));
    } else {
      onChange([...value, optionLabel]);
    }
  };

  const removeValue = (valueToRemove: string) => {
    onChange(value.filter(v => v !== valueToRemove));
  };

  const addCustomOption = () => {
    if (customInput.trim() && !value.includes(customInput.trim())) {
      onChange([...value, customInput.trim()]);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomOption();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-500/50 transition-colors shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      
      {/* Selected Values Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((val) => {
            const option = options.find(opt => opt.label === val);
            return (
              <div
                key={val}
                className="flex items-center space-x-1 bg-purple-50 border border-purple-200 text-purple-700 px-2 py-1 rounded-md text-xs"
              >
                {showColorPreview && option?.hex && (
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: option.hex }}
                  />
                )}
                <span>{val}</span>
                <button
                  onClick={() => removeValue(val)}
                  disabled={disabled}
                  className="hover:text-purple-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Predefined Options */}
      <div className="space-y-2 mb-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all ${
              value.includes(opt.label)
                ? 'bg-purple-50 border border-purple-300'
                : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={value.includes(opt.label)}
              onChange={() => toggleOption(opt.label)}
              disabled={disabled}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            {showColorPreview && opt.hex && (
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: opt.hex }}
              />
            )}
            <div className="flex-1">
              <div className="text-sm text-gray-900">{opt.label}</div>
              {opt.desc && <div className="text-xs text-gray-500">{opt.desc}</div>}
            </div>
          </label>
        ))}
      </div>

      {/* Custom Input */}
      {showCustomInput ? (
        <div className="flex space-x-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入自定义选项"
            disabled={disabled}
            className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            autoFocus
          />
          <button
            onClick={addCustomOption}
            disabled={disabled || !customInput.trim()}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            添加
          </button>
          <button
            onClick={() => {
              setShowCustomInput(false);
              setCustomInput('');
            }}
            disabled={disabled}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          disabled={disabled}
          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>添加自定义选项</span>
        </button>
      )}
    </div>
  );
};

export default MultiSelectField;
