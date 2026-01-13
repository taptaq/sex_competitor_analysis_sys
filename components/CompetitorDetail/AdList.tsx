import React from "react";
import { AdCreative } from "../../types";
import { Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";

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
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onAddAd}
          className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-2 rounded-lg transition"
        >
          <Plus size={16} /> 新增创意
        </button>
      </div>

      {isAddingAd && (
        <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50">
          <h4 className="font-bold text-gray-700 mb-4">添加新创意</h4>
          <div className="flex flex-col gap-4 mb-4">
            <textarea
              className="p-2 border rounded"
              placeholder="广告文案"
              rows={2}
              value={tempAd.text || ""}
              onChange={(e) =>
                onTempAdChange({ ...tempAd, text: e.target.value })
              }
            />
            <input
              className="p-2 border rounded"
              placeholder="亮点 (用空格分隔)"
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
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancelAddAd}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
            <button
              onClick={onSaveAd}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </button>
          </div>
        </div>
      )}

      {!isAddingAd && ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm mb-4">暂无宣传语创意数据</p>
          <button
            onClick={onAddAd}
            className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-100 px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} /> 添加第一条创意
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="border border-gray-100 rounded-xl overflow-hidden group/card relative"
            >
              {editingAdId === ad.id ? (
                <div className="p-4 bg-gray-50">
                  <div className="flex flex-col gap-2 mb-2">
                    <textarea
                      className="p-2 border rounded text-xs"
                      rows={2}
                      value={tempAd.text}
                      onChange={(e) =>
                        onTempAdChange({ ...tempAd, text: e.target.value })
                      }
                    />
                    <input
                      className="p-2 border rounded text-xs"
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
                  <div className="flex gap-2 justify-end text-xs">
                    <button
                      onClick={onCancelEditAd}
                      className="flex items-center gap-1 px-2 py-1 text-gray-500"
                    >
                      取消
                    </button>
                    <button
                      onClick={onSaveAd}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded disabled:opacity-70"
                    >
                      {isSaving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "保存"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm shadow-sm z-10">
                    <button
                      onClick={() => onEditAd(ad)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定删除该创意?")) onRemoveAd(ad.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      "{ad.text}"
                    </p>
                    <div className="flex gap-2">
                      {ad.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold border border-purple-100"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdList;
