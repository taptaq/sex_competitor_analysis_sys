import React from "react";
import { Product, PriceHistory } from "../../types";
import { Upload, X } from "lucide-react";

const PRODUCT_CATEGORIES = [
  "跳蛋",
  "震动棒",
  "伸缩棒",
  "AV棒",
  "飞机杯",
  "倒模",
  "按摩器",
  "训练器",
  "其他",
];

interface ProductFormProps {
  product: Partial<Product>;
  onProductChange: (product: Partial<Product>) => void;
  onImageLinkChange: (link: string) => void;
  onPriceHistoryUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onProductChange,
  onImageLinkChange,
  onPriceHistoryUpload,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  return (
    <div className={`${isEditing ? "p-6 bg-gray-50" : "border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50"}`}>
      <h4 className="font-bold text-gray-700 mb-4">
        {isEditing ? "编辑产品" : "添加新产品"}
      </h4>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          className="p-2 border rounded"
          placeholder="产品名称"
          value={product.name || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              name: e.target.value,
            })
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="价格"
          type="number"
          value={product.price || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              price: Number(e.target.value),
            })
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="销量"
          type="number"
          value={product.sales || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              sales: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <select
          className="p-2 border rounded"
          value={product.category || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              category: e.target.value,
            })
          }
        >
          <option value="">选择产品类型</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          className="p-2 border rounded"
          value={product.gender || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              gender: e.target.value as 'Male' | 'Female' | 'Unisex' | undefined,
            })
          }
        >
          <option value="">选择适用性别</option>
          <option value="Male">男用</option>
          <option value="Female">女用</option>
          <option value="Unisex">通用</option>
        </select>
        <input
          className="p-2 border rounded"
          placeholder="上市时间（年月）"
          type="month"
          value={product.launchDate || ""}
          onChange={(e) =>
            onProductChange({
              ...product,
              launchDate: e.target.value || undefined,
            })
          }
        />
        <input
          className="p-2 border rounded col-span-2"
          placeholder="标签 (用逗号分隔)"
          value={
            Array.isArray(product.tags)
              ? product.tags.join("，")
              : product.tags || ""
          }
          onChange={(e) =>
            onProductChange({
              ...product,
              tags: e.target.value,
            })
          }
        />
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            产品图片链接
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              placeholder="请输入图片链接 (URL)"
              value={product.image || ""}
              onChange={(e) => onImageLinkChange(e.target.value)}
            />
            {product.image && (
              <img
                src={product.image}
                className="w-12 h-12 object-cover rounded shadow-sm"
                alt="Preview"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            支持图片 URL 链接
          </p>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">
            产品链接
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="请输入产品链接 (URL)"
            value={product.link || ""}
            onChange={(e) =>
              onProductChange({
                ...product,
                link: e.target.value,
              })
            }
          />
          <p className="text-[10px] text-gray-400 mt-1">
            产品购买或详情页面链接
          </p>
        </div>
        {!isEditing && (
          <div className="col-span-2">
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
                  onChange={onPriceHistoryUpload}
                />
              </label>
              <span className="text-[10px] text-gray-400">
                {product.priceHistory?.length || 0} 条价格记录
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              支持 .xlsx, .xls, .csv 格式，需包含日期、到手价列（页面价可选）
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm flex items-center gap-1.5"
        >
          <X size={14} />
          <span>取消</span>
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
        >
          <span>保存</span>
        </button>
      </div>
    </div>
  );
};

export default ProductForm;

