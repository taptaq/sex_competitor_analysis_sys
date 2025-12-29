import React from "react";
import { Product, Competitor } from "../../types";
import { ArrowUp, ArrowDown, ArrowUpDown, Plus } from "lucide-react";
import ProductCard from "./ProductCard";

const PRODUCT_CATEGORIES = [
  "跳蛋",
  "震动棒",
  "伸缩棒",
  "AV棒",
  "飞机杯",
  "倒模",
  "按摩器",
  "其他",
];

interface ProductListProps {
  competitor: Competitor;
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceSortOrder: "none" | "asc" | "desc";
  salesSortOrder: "none" | "asc" | "desc";
  onPriceSort: () => void;
  onSalesSort: () => void;
  onAddProduct: () => void;
  // Product actions
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

const ProductList: React.FC<ProductListProps> = ({
  competitor,
  products,
  selectedCategory,
  onCategoryChange,
  priceSortOrder,
  salesSortOrder,
  onPriceSort,
  onSalesSort,
  onAddProduct,
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
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <select
            className="text-sm text-gray-600 font-medium border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">全部类型</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="uncategorized">未分类</option>
          </select>
          <button
            onClick={onPriceSort}
            className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition border border-gray-200"
          >
            {priceSortOrder === "none" ? (
              <>
                <ArrowUpDown size={16} />
                按价格排序
              </>
            ) : priceSortOrder === "asc" ? (
              <>
                <ArrowUp size={16} />
                价格：低到高
              </>
            ) : (
              <>
                <ArrowDown size={16} />
                价格：高到低
              </>
            )}
          </button>
          <button
            onClick={onSalesSort}
            className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition border border-gray-200"
          >
            {salesSortOrder === "none" ? (
              <>
                <ArrowUpDown size={16} />
                按销量排序
              </>
            ) : salesSortOrder === "asc" ? (
              <>
                <ArrowUp size={16} />
                销量：低到高
              </>
            ) : (
              <>
                <ArrowDown size={16} />
                销量：高到低
              </>
            )}
          </button>
        </div>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-2 rounded-lg transition"
        >
          <Plus size={16} /> 新增产品
        </button>
      </div>

      {/* Product cards will be rendered here */}
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          competitor={competitor}
          onUpdateProduct={onUpdateProduct}
          onRemoveProduct={onRemoveProduct}
          onAnalyzeProduct={onAnalyzeProduct}
          onUpdateProductAnalysis={onUpdateProductAnalysis}
          onUploadReviews={onUploadReviews}
          onUploadPriceHistory={onUploadPriceHistory}
          onClearPriceHistory={onClearPriceHistory}
          onShowPriceChart={onShowPriceChart}
          onToggleFavorite={onToggleFavorite}
          isProductFavorite={isProductFavorite}
          analyzingProductId={analyzingProductId}
          editingProductId={editingProductId}
          tempProduct={tempProduct}
          onTempProductChange={onTempProductChange}
          onStartEdit={onStartEdit}
          onSaveProduct={onSaveProduct}
          onCancelEdit={onCancelEdit}
          editingAnalysisProductId={editingAnalysisProductId}
          tempAnalysis={tempAnalysis}
          onTempAnalysisChange={onTempAnalysisChange}
          onStartEditAnalysis={onStartEditAnalysis}
          onSaveAnalysis={onSaveAnalysis}
          onCancelAnalysisEdit={onCancelAnalysisEdit}
          editingImageProductId={editingImageProductId}
          tempImageLink={tempImageLink}
          onTempImageLinkChange={onTempImageLinkChange}
          onSaveImageLink={onSaveImageLink}
          onCancelImageEdit={onCancelImageEdit}
          onStartEditImage={onStartEditImage}
        />
      ))}
    </div>
  );
};

export default ProductList;

