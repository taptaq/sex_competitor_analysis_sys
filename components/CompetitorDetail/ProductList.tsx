import React from "react";
import { Product, Competitor } from "../../types";
import { ArrowUp, ArrowDown, ArrowUpDown, Plus } from "lucide-react";
import ProductCard from "./ProductCard";

const PRODUCT_CATEGORIES = [
  "跳蛋",
  "震动棒",
  "伸缩棒",
  "缩阴球",
  "AV棒",
  "吮吸器",
  "飞机杯",
  "阴茎环",
  "倒模",
  "按摩器",
  "训练器",
  "其他",
];

interface ProductListProps {
  competitor: Competitor;
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
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
  uploadingProductId: string | null;
  isSavingProduct: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  competitor,
  products,
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
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
  uploadingProductId,
  isSavingProduct,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="text-sm text-gray-600 font-medium border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition flex-1 md:flex-none min-w-[100px]"
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
          <select
            className="text-sm text-gray-600 font-medium border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition flex-1 md:flex-none min-w-[100px]"
            value={selectedGender}
            onChange={(e) => onGenderChange(e.target.value)}
          >
            <option value="all">全部性别</option>
            <option value="Male">男用</option>
            <option value="Female">女用</option>
            <option value="Unisex">通用</option>
            <option value="none">未标注</option>
          </select>
          <div className="flex gap-2 flex-1 md:flex-none w-full md:w-auto">
            <button
              onClick={onPriceSort}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm text-gray-600 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition border border-gray-200"
            >
              {priceSortOrder === "none" ? (
                <>
                  <ArrowUpDown size={16} />
                  <span className="hidden sm:inline">按价格</span>
                </>
              ) : priceSortOrder === "asc" ? (
                <>
                  <ArrowUp size={16} />
                  <span className="hidden sm:inline">价格升</span>
                </>
              ) : (
                <>
                  <ArrowDown size={16} />
                  <span className="hidden sm:inline">价格降</span>
                </>
              )}
            </button>
            <button
              onClick={onSalesSort}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm text-gray-600 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition border border-gray-200"
            >
              {salesSortOrder === "none" ? (
                <>
                  <ArrowUpDown size={16} />
                  <span className="hidden sm:inline">按销量</span>
                </>
              ) : salesSortOrder === "asc" ? (
                <>
                  <ArrowUp size={16} />
                  <span className="hidden sm:inline">销量升</span>
                </>
              ) : (
                <>
                  <ArrowDown size={16} />
                  <span className="hidden sm:inline">销量降</span>
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={onAddProduct}
          className="w-full md:w-auto flex items-center justify-center gap-2 text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-2 rounded-lg transition border border-purple-200 shadow-sm"
        >
          <Plus size={16} /> 新增产品
        </button>
      </div>

      {/* Product cards will be rendered here */}
      {products.length > 0 ? (
        products.map((product) => (
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
            uploadingProductId={uploadingProductId}
            isSavingProduct={isSavingProduct}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg font-medium mb-2">暂无产品数据</p>
          <p className="text-gray-400 text-sm mb-4">
            {selectedCategory !== "all" || selectedGender !== "all"
              ? "当前筛选条件下没有匹配的产品"
              : "点击上方「新增产品」按钮添加第一个产品"}
          </p>
          {(selectedCategory !== "all" || selectedGender !== "all") && (
            <button
              onClick={() => {
                onCategoryChange("all");
                onGenderChange("all");
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              清除筛选条件
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;
