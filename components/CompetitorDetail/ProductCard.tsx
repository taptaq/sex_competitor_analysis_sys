import React, { useState, useEffect } from "react";
import { Product, Competitor, ProductSpecs } from "../../types";
import { TagCloud } from "react-tagcloud";
import {
  Globe,
  ShieldAlert,
  Star,
  Plus,
  Upload,
  Pencil,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Heart,
  TrendingUp,
  Package,
} from "lucide-react";
import ProductForm from "./ProductForm";

interface ProductCardProps {
  product: Product;
  competitor: Competitor;
  onUpdateProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
  onAnalyzeProduct: (product: Product) => Promise<void>;
  onUpdateProductAnalysis: (productId: string, analysis: any) => void;
  onUploadReviews: (productId: string, files: FileList) => Promise<void>;
  onUploadPriceHistory: (productId: string, files: FileList) => Promise<void>;
  onClearPriceHistory: (product: Product) => void;
  onShowPriceChart: (product: Product) => void;
  onToggleFavorite: (product: Product, competitor: Competitor) => void;
  isProductFavorite: (productId: string) => boolean;
  analyzingProductId: string | null;
  editingProductId: string | null;
  tempProduct: Partial<Product>;
  onTempProductChange: (product: Partial<Product>) => void;
  onStartEdit: (product: Product) => void;
  onSaveProduct: () => void;
  onCancelEdit: () => void;
  editingAnalysisProductId: string | null;
  tempAnalysis: any;
  onTempAnalysisChange: (analysis: any) => void;
  onStartEditAnalysis: (productId: string, analysis: any) => void;
  onSaveAnalysis: () => void;
  onCancelAnalysisEdit: () => void;
  editingImageProductId: string | null;
  tempImageLink: string;
  onTempImageLinkChange: (link: string) => void;
  onSaveImageLink: (product: Product) => void;
  onCancelImageEdit: () => void;
  onStartEditImage: (productId: string) => void;
}

// 产品规格参数弹窗组件
interface ProductSpecsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (specs: ProductSpecs) => void;
}

const ProductSpecsModal: React.FC<ProductSpecsModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
}) => {
  const [specs, setSpecs] = useState<ProductSpecs>({});

  // 当产品变化时，更新规格参数
  useEffect(() => {
    if (isOpen && product) {
      setSpecs(product.specs || {});
    }
  }, [isOpen, product?.specs, product?.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(specs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {product.name} - 产品规格参数
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              填写产品的详细规格参数信息
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 规格参数表单 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                产品尺寸
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：长x宽x高 或 直径x长度"
                value={specs.dimensions || ""}
                onChange={(e) => setSpecs({ ...specs, dimensions: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">例如：120x45x35mm 或 Φ35x120mm</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                产品材质
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：医用硅胶、TPE、ABS等"
                value={specs.material || ""}
                onChange={(e) => setSpecs({ ...specs, material: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                噪音值
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：≤45dB"
                value={specs.noiseLevel || ""}
                onChange={(e) => setSpecs({ ...specs, noiseLevel: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用时长
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：60分钟"
                value={specs.usageTime || ""}
                onChange={(e) => setSpecs({ ...specs, usageTime: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                充电时长
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：2小时"
                value={specs.chargingTime || ""}
                onChange={(e) => setSpecs({ ...specs, chargingTime: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                控制方式
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：APP控制、按键控制、遥控器"
                value={specs.controlMethod || ""}
                onChange={(e) => setSpecs({ ...specs, controlMethod: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重量
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：200g"
                value={specs.weight || ""}
                onChange={(e) => setSpecs({ ...specs, weight: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                防水防尘等级
              </label>
              <textarea
                className="w-full p-3 h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="如：IPX7、IPX4、IP67"
                value={specs.ipRating || ""}
                onChange={(e) => setSpecs({ ...specs, ipRating: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">例如：IPX7（防水7级）、IP67（防尘6级+防水7级）</p>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  competitor,
  onUpdateProduct,
  onRemoveProduct,
  onAnalyzeProduct,
  onUpdateProductAnalysis,
  onUploadReviews,
  onUploadPriceHistory,
  onClearPriceHistory,
  onShowPriceChart,
  onToggleFavorite,
  isProductFavorite,
  analyzingProductId,
  editingProductId,
  tempProduct,
  onTempProductChange,
  onStartEdit,
  onSaveProduct,
  onCancelEdit,
  editingAnalysisProductId,
  tempAnalysis,
  onTempAnalysisChange,
  onStartEditAnalysis,
  onSaveAnalysis,
  onCancelAnalysisEdit,
  editingImageProductId,
  tempImageLink,
  onTempImageLinkChange,
  onSaveImageLink,
  onCancelImageEdit,
  onStartEditImage,
}) => {
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  // Helper functions for analysis editing
  const handleArrayChange = (
    field: "pros" | "cons",
    index: number,
    value: string
  ) => {
    if (!tempAnalysis) return;
    const newArray = [...tempAnalysis[field]];
    newArray[index] = value;
    onTempAnalysisChange({ ...tempAnalysis, [field]: newArray });
  };

  const handleArrayDelete = (field: "pros" | "cons", index: number) => {
    if (!tempAnalysis) return;
    const newArray = [...tempAnalysis[field]];
    newArray.splice(index, 1);
    onTempAnalysisChange({ ...tempAnalysis, [field]: newArray });
  };

  const handleArrayAdd = (field: "pros" | "cons") => {
    if (!tempAnalysis) return;
    onTempAnalysisChange({
      ...tempAnalysis,
      [field]: [...tempAnalysis[field], ""],
    });
  };

  const handleKeywordChange = (
    field: "prosKeywords" | "consKeywords",
    index: number,
    key: "value" | "count",
    val: string | number
  ) => {
    if (!tempAnalysis) return;
    const newKeywords = [...(tempAnalysis[field] || [])];
    newKeywords[index] = { ...newKeywords[index], [key]: val };
    onTempAnalysisChange({ ...tempAnalysis, [field]: newKeywords });
  };

  const handleKeywordDelete = (
    field: "prosKeywords" | "consKeywords",
    index: number
  ) => {
    if (!tempAnalysis) return;
    const newKeywords = [...(tempAnalysis[field] || [])];
    newKeywords.splice(index, 1);
    onTempAnalysisChange({ ...tempAnalysis, [field]: newKeywords });
  };

  const handleKeywordAdd = (field: "prosKeywords" | "consKeywords") => {
    if (!tempAnalysis) return;
    onTempAnalysisChange({
      ...tempAnalysis,
      [field]: [...(tempAnalysis[field] || []), { value: "", count: 10 }],
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await onUploadReviews(productId, files);
    e.target.value = "";
  };

  const handlePriceHistoryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await onUploadPriceHistory(productId, files);
    e.target.value = "";
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow group/card">
      {editingProductId === product.id ? (
        <ProductForm
          product={tempProduct}
          onProductChange={onTempProductChange}
          onImageLinkChange={(link) =>
            onTempProductChange({ ...tempProduct, image: link })
          }
          onPriceHistoryUpload={async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            await onUploadPriceHistory(product.id, files);
            e.target.value = "";
          }}
          onSave={onSaveProduct}
          onCancel={onCancelEdit}
          isEditing={true}
        />
      ) : (
        <div className="flex flex-col md:flex-row relative">
          {/* Product Actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm shadow-sm z-10">
            <button
              onClick={() => onToggleFavorite(product, competitor)}
              className={`p-1.5 rounded transition-colors ${
                isProductFavorite(product.id)
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-400 hover:bg-gray-50 hover:text-red-500"
              }`}
              title={isProductFavorite(product.id) ? "取消收藏" : "收藏产品"}
            >
              <Heart
                size={14}
                className={isProductFavorite(product.id) ? "fill-current" : ""}
              />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1 self-center" />
            <button
              onClick={() => onStartEdit(product)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="编辑产品"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm("确定删除该产品?")) onRemoveProduct(product.id);
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Product Image */}
          <div className="w-full md:w-56 bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 overflow-hidden shrink-0 relative group/image">
            {editingImageProductId === product.id ? (
              <div className="w-full p-3 space-y-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded text-xs"
                  placeholder="请输入图片链接 (URL)"
                  value={tempImageLink}
                  onChange={(e) => onTempImageLinkChange(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onCancelImageEdit}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => onSaveImageLink(product)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    保存
                  </button>
                </div>
                {tempImageLink && (
                  <img
                    src={tempImageLink}
                    className="w-full max-h-32 object-contain rounded mt-2"
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
            ) : product.image ? (
              <>
                <img
                  src={product.image}
                  className="w-full h-full max-h-64 object-contain transition-transform duration-300"
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                  <button
                    onClick={() => {
                      onTempImageLinkChange(product.image || "");
                      onStartEditImage(product.id);
                    }}
                    className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-gray-700 hover:bg-white"
                  >
                    <Pencil size={14} />
                    <span>编辑链接</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  onTempImageLinkChange("");
                  onStartEditImage(product.id);
                }}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-100 transition-colors p-4"
              >
                <ImageIcon size={32} className="text-gray-300" />
                <span className="text-xs">点击输入图片链接</span>
              </button>
            )}
          </div>

          {/* Product Content */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-lg text-gray-800">
                  {product.name}（ ¥{product.price}）
                </h4>
                <div className="flex items-center gap-2 mb-2 mt-1">
                  {product.category && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                      {product.category}
                    </span>
                  )}
                  {product.gender && (
                    <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
                      product.gender === 'Male' 
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : product.gender === 'Female'
                        ? 'bg-pink-100 text-pink-700 border-pink-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {product.gender === 'Male' ? '男用' : product.gender === 'Female' ? '女用' : '通用'}
                    </span>
                  )}
                  {product.sales !== undefined && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">
                      销量:{" "}
                      {product.sales >= 10000
                        ? `${(product.sales / 10000).toFixed(1)}w+`
                        : `${product.sales.toLocaleString()}+`}
                    </span>
                  )}
                  {product.launchDate && product.launchDate.includes('-') && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                      上市: {product.launchDate.split('-')[0]}年{product.launchDate.split('-')[1]}月
                    </span>
                  )}
                  {product.specs && (
                    <button
                      onClick={() => setShowSpecsModal(true)}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold border border-orange-200 hover:bg-orange-200 transition-colors flex items-center gap-1"
                      title="查看规格参数"
                    >
                      <Package size={12} />
                      规格参数
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {product.link && (
                  <div className="mt-2">
                    <a
                      href={
                        product.link.trim().startsWith("http") ||
                        product.link.trim().startsWith("https")
                          ? product.link.trim()
                          : `https://${product.link.trim()}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                    >
                      <Globe size={12} />
                      <span>查看产品链接</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Section */}
            {editingAnalysisProductId === product.id ? (
              <div className="mt-4 bg-purple-50 p-4 rounded-lg flex-1 border border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* Pros Editing */}
                  <div>
                    <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Plus size={12} /> 用户好评点
                      </span>
                      <button
                        onClick={() => handleArrayAdd("pros")}
                        className="text-green-600 hover:bg-green-100 p-1 rounded"
                      >
                        <Plus size={12} />
                      </button>
                    </h5>
                    <ul className="space-y-2 mb-4">
                      {tempAnalysis?.pros?.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-1">
                          <input
                            className="flex-1 text-xs p-1 border rounded"
                            value={pro}
                            onChange={(e) =>
                              handleArrayChange("pros", i, e.target.value)
                            }
                          />
                          <button
                            onClick={() => handleArrayDelete("pros", i)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-purple-200 pt-2">
                      <h6 className="text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                        词云关键词 (好评)
                        <button
                          onClick={() => handleKeywordAdd("prosKeywords")}
                          className="text-purple-600"
                        >
                          <Plus size={10} />
                        </button>
                      </h6>
                      <div className="space-y-1">
                        {tempAnalysis?.prosKeywords?.map(
                          (kw: any, i: number) => (
                            <div key={i} className="flex gap-1 items-center">
                              <input
                                className="w-20 text-[10px] p-1 border rounded"
                                placeholder="词"
                                value={kw.value}
                                onChange={(e) =>
                                  handleKeywordChange(
                                    "prosKeywords",
                                    i,
                                    "value",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                className="w-12 text-[10px] p-1 border rounded"
                                type="number"
                                placeholder="权重"
                                value={kw.count}
                                onChange={(e) =>
                                  handleKeywordChange(
                                    "prosKeywords",
                                    i,
                                    "count",
                                    Number(e.target.value)
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  handleKeywordDelete("prosKeywords", i)
                                }
                                className="text-red-400"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cons Editing */}
                  <div>
                    <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldAlert size={12} /> 需优化点
                      </span>
                      <button
                        onClick={() => handleArrayAdd("cons")}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
                      >
                        <Plus size={12} />
                      </button>
                    </h5>
                    <ul className="space-y-2 mb-4">
                      {tempAnalysis?.cons?.map((con: string, i: number) => (
                        <li key={i} className="flex gap-1">
                          <input
                            className="flex-1 text-xs p-1 border rounded"
                            value={con}
                            onChange={(e) =>
                              handleArrayChange("cons", i, e.target.value)
                            }
                          />
                          <button
                            onClick={() => handleArrayDelete("cons", i)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-purple-200 pt-2">
                      <h6 className="text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                        词云关键词 (差评)
                        <button
                          onClick={() => handleKeywordAdd("consKeywords")}
                          className="text-purple-600"
                        >
                          <Plus size={10} />
                        </button>
                      </h6>
                      <div className="space-y-1">
                        {tempAnalysis?.consKeywords?.map(
                          (kw: any, i: number) => (
                            <div key={i} className="flex gap-1 items-center">
                              <input
                                className="w-20 text-[10px] p-1 border rounded"
                                placeholder="词"
                                value={kw.value}
                                onChange={(e) =>
                                  handleKeywordChange(
                                    "consKeywords",
                                    i,
                                    "value",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                className="w-12 text-[10px] p-1 border rounded"
                                type="number"
                                placeholder="权重"
                                value={kw.count}
                                onChange={(e) =>
                                  handleKeywordChange(
                                    "consKeywords",
                                    i,
                                    "count",
                                    Number(e.target.value)
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  handleKeywordDelete("consKeywords", i)
                                }
                                className="text-red-400"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    总结
                  </label>
                  <textarea
                    className="w-full text-xs p-2 border rounded"
                    rows={3}
                    value={tempAnalysis?.summary || ""}
                    onChange={(e) =>
                      onTempAnalysisChange({
                        ...tempAnalysis,
                        summary: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={onCancelAnalysisEdit}
                    className="px-3 py-1 text-xs text-gray-500"
                  >
                    取消
                  </button>
                  <button
                    onClick={onSaveAnalysis}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : product.analysis ? (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg flex-1 relative group/analysis">
                <button
                  onClick={() => onStartEditAnalysis(product.id, product.analysis)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-purple-600 opacity-0 group-hover/analysis:opacity-100 transition-opacity"
                  title="编辑分析"
                >
                  <Pencil size={14} />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                      <Plus size={12} /> 用户好评点
                    </h5>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 mb-4">
                      {product.analysis.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                    {product.analysis.prosKeywords && (
                      <TagCloud
                        minSize={12}
                        maxSize={20}
                        tags={product.analysis.prosKeywords}
                        className="simple-cloud mb-2"
                        onClick={(tag: any) =>
                          console.log("clicking on tag:", tag)
                        }
                      />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                      <ShieldAlert size={12} /> 需优化点
                    </h5>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 mb-4">
                      {product.analysis.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                    {product.analysis.consKeywords && (
                      <TagCloud
                        minSize={12}
                        maxSize={20}
                        tags={product.analysis.consKeywords}
                        className="simple-cloud mb-2"
                        colorOptions={{
                          luminosity: "dark",
                          hue: "red",
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    "{product.analysis.summary}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">暂无 AI 分析报告</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    导入评论数据 (Excel/CSV):
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors">
                      <Upload size={14} />
                      <span>选择文件导入</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        multiple
                        onChange={(e) => handleFileUpload(e, product.id)}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">
                      已录入 {product.reviews?.length || 0} 条评论
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    支持 .xlsx, .xls, .csv 格式
                  </p>
                </div>
                <button
                  onClick={() => onAnalyzeProduct(product)}
                  disabled={analyzingProductId === product.id}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-10"
                >
                  {analyzingProductId === product.id ? (
                    "分析中..."
                  ) : (
                    <>
                      <Star size={16} className="fill-white" />
                      生成分析
                    </>
                  )}
                </button>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    导入价格数据 (Excel/CSV):
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors">
                      <Upload size={14} />
                      <span>选择文件导入</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        multiple
                        onChange={(e) => handlePriceHistoryUpload(e, product.id)}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">
                      已录入 {product.priceHistory?.length || 0} 条价格记录
                    </span>
                    {product.priceHistory && product.priceHistory.length > 0 && (
                      <button
                        onClick={() => onClearPriceHistory(product)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                        title="清空价格走势数据"
                      >
                        <Trash2 size={12} />
                        清空
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    支持 .xlsx, .xls, .csv 格式，需包含日期、到手价列（页面价可选）。重新上传将覆盖现有数据。
                  </p>
                </div>
                <button
                  onClick={() => onShowPriceChart(product)}
                  disabled={!product.priceHistory || product.priceHistory.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-10"
                >
                  <TrendingUp size={16} />
                  查看价格走势
                </button>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    产品规格参数
                  </label>
                  <button
                    onClick={() => setShowSpecsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-orange-700 transition-colors"
                  >
                    <Package size={16} />
                    {product.specs ? "编辑规格参数" : "添加规格参数"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 产品规格参数弹窗 */}
      <ProductSpecsModal
        product={product}
        isOpen={showSpecsModal}
        onClose={() => setShowSpecsModal(false)}
        onSave={(specs) => {
          onUpdateProduct({ ...product, specs });
          setShowSpecsModal(false);
        }}
      />
    </div>
  );
};

export default ProductCard;

