import React from "react";
import { AdCreative } from "../../types";
import { Plus, Pencil, Trash2, Save, X, Loader2, Sparkles } from "lucide-react";
import { extractAdFromUrl } from "../../services/gemini";

interface AdListProps {
  ads: AdCreative[];
  isAddingAd: boolean;
  tempAd: Partial<AdCreative>;
  editingAdId: string | null;
  onAddAd: () => void;
  onCancelAddAd: () => void;
  onTempAdChange: (ad: Partial<AdCreative>) => void;
  onSaveAd: () => void;
  onEditAd: (ad: AdCreative) => void;
  onCancelEditAd: () => void;
  onRemoveAd: (adId: string) => void;
  isSaving?: boolean;
  onImportAds?: (ads: Partial<AdCreative>[]) => void;
}

const AdList: React.FC<AdListProps> = ({
  ads,
  isAddingAd,
  tempAd,
  editingAdId,
  onAddAd,
  onCancelAddAd,
  onTempAdChange,
  onSaveAd,
  onEditAd,
  onCancelEditAd,
  onRemoveAd,
  isSaving = false,
  onImportAds,
}) => {
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const handleExtract = async () => {
    if (!url) return;
    setIsExtracting(true);
    try {
      const results = await extractAdFromUrl(url);
      console.info(results, "---results");
      if (results && results.length > 0) {
        if (onImportAds) {
          onImportAds(results);
        } else {
          // Fallback for single (legacy behavior)
          onTempAdChange({
            ...tempAd,
            text: results[0].text || "",
            highlights: results[0].highlights || [],
          });
        }
      } else {
        alert("未能提取到有效信息");
      }
    } catch (error) {
      console.error(error);
      alert("提取失败，请确保链接有效或稍后重试");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          营销创意库
        </h3>
        <button
          onClick={onAddAd}
          className="flex items-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={14} /> 新增创意
        </button>
      </div>

      {isAddingAd && (
        <div className="border border-purple-100 rounded-xl p-5 bg-gradient-to-br from-white to-purple-50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800 text-sm">添加新创意</h4>
            <button
              onClick={onCancelAddAd}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-4">
            {/* Auto Extract from URL */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full pl-3 pr-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-gray-400"
                  placeholder="粘贴淘宝/天猫商品链接，自动提取文案..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && url) {
                      handleExtract();
                    }
                  }}
                  disabled={isExtracting}
                />
              </div>
              <button
                onClick={handleExtract}
                disabled={isExtracting || !url}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shadow-sm min-w-[110px] justify-center"
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> 提取中
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> 智能提取
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  文案内容
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all resize-none"
                  placeholder="输入吸引人的广告文案..."
                  rows={2}
                  value={tempAd.text || ""}
                  onChange={(e) =>
                    onTempAdChange({ ...tempAd, text: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  核心卖点 (空格分隔)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all resize-none"
                  placeholder="例如：静音 防水 亲肤材质"
                  rows={2}
                  value={
                    Array.isArray(tempAd.highlights)
                      ? tempAd.highlights.join(" ")
                      : tempAd.highlights || ""
                  }
                  onChange={(e) =>
                    onTempAdChange({ ...tempAd, highlights: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onCancelAddAd}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={onSaveAd}
              disabled={isSaving}
              className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  保存中...
                </>
              ) : (
                "确认保存"
              )}
            </button>
          </div>
        </div>
      )}

      {!isAddingAd && ads.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl transition-colors hover:border-purple-300 hover:bg-purple-50/30 group cursor-pointer"
          onClick={onAddAd}
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles
              className="text-purple-400 group-hover:text-purple-600"
              size={24}
            />
          </div>
          <p className="text-gray-500 font-medium mb-1">暂无宣传语创意</p>
          <p className="text-xs text-gray-400 mb-6 text-center max-w-xs">
            粘贴链接即可通过 AI 自动提取竞品卖点与文案，快速建立创意库
          </p>
          <button className="flex items-center gap-2 text-sm text-purple-600 font-bold bg-white px-5 py-2.5 rounded-full shadow-sm border border-purple-100 hover:border-purple-300 transition-all">
            <Plus size={16} /> 添加第一条创意
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:shadow-lg hover:border-purple-200 transition-all duration-300"
            >
              {editingAdId === ad.id ? (
                <div className="p-5 bg-purple-50/50">
                  <div className="flex flex-col gap-3 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">
                        文案
                      </label>
                      <textarea
                        className="w-full p-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                        rows={2}
                        value={tempAd.text}
                        onChange={(e) =>
                          onTempAdChange({ ...tempAd, text: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">
                        卖点
                      </label>
                      <input
                        className="w-full p-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                        value={
                          Array.isArray(tempAd.highlights)
                            ? tempAd.highlights.join(" ")
                            : tempAd.highlights
                        }
                        onChange={(e) =>
                          onTempAdChange({
                            ...tempAd,
                            highlights: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={onCancelEditAd}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={onSaveAd}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-70 shadow-sm"
                    >
                      {isSaving ? "保存中..." : "保存修改"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative p-5">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={() => onEditAd(ad)}
                      className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定删除该创意?")) onRemoveAd(ad.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-start gap-4 pr-16">
                    <div>
                      <p className="text-base text-gray-800 font-medium leading-relaxed mb-3 mt-1">
                        {ad.text}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ad.highlights.map((h, index) => (
                          <span
                            key={`${h}-${index}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 group-hover:border-purple-200 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors"
                          >
                            <Sparkles size={10} className="mr-1 opacity-50" />
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdList;
