import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Product, AdCreative } from "../types";
import { ChevronLeft } from "lucide-react";
import { analyzeReviews } from "../services/gemini";
import * as XLSX from "xlsx";
import CompetitorSidebar from "./CompetitorDetail/CompetitorSidebar";
import ProductForm from "./CompetitorDetail/ProductForm";
import ProductList from "./CompetitorDetail/ProductList";
import AdList from "./CompetitorDetail/AdList";
import PriceChartModal from "./CompetitorDetail/PriceChartModal";
import {
  parsePriceHistoryFromFiles,
  getLatestPrice,
} from "../utils/priceHistoryUtils";

const CompetitorDetail: React.FC = () => {
  const {
    selectedCompetitorId,
    competitors,
    setSelectedCompetitor,

    setProductAnalysis,
    addProduct,
    updateProduct,
    removeProduct,
    addAd,
    updateAd,
    removeAd,
    setProductReviews,
    updateCompetitor,
    toggleFavoriteProduct,
    isProductFavorite,
    fetchFavorites,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"products" | "ads">("products");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingImageProductId, setEditingImageProductId] = useState<
    string | null
  >(null);
  const [tempImageLink, setTempImageLink] = useState<string>("");
  const [editingAnalysisProductId, setEditingAnalysisProductId] = useState<
    string | null
  >(null);
  const [tempAnalysis, setTempAnalysis] = useState<any>(null);
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [tempAd, setTempAd] = useState<Partial<AdCreative>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [analyzingProductId, setAnalyzingProductId] = useState<string | null>(
    null
  );
  const [priceSortOrder, setPriceSortOrder] = useState<"none" | "asc" | "desc">(
    "none"
  );
  const [salesSortOrder, setSalesSortOrder] = useState<"none" | "asc" | "desc">(
    "none"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [showPriceChartModal, setShowPriceChartModal] = useState(false);
  const [selectedProductForChart, setSelectedProductForChart] =
    useState<Product | null>(null);

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const competitor = competitors.find((c) => c.id === selectedCompetitorId);

  if (!competitor) {
    return <div>Competitor not found</div>;
  }

  const filteredAndSortedProducts = [...(competitor.products || [])]
    .filter((product) => {
      // 类别筛选
      if (selectedCategory !== "all") {
        if (selectedCategory === "uncategorized") {
          if (product.category) return false;
        } else {
          if (product.category !== selectedCategory) return false;
        }
      }
      // 性别筛选
      if (selectedGender !== "all") {
        if (selectedGender === "none") {
          if (product.gender) return false;
        } else {
          if (product.gender !== selectedGender) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (salesSortOrder !== "none") {
        const aSales = a.sales ?? 0;
        const bSales = b.sales ?? 0;
        if (salesSortOrder === "asc") {
          return aSales - bSales;
        } else {
          return bSales - aSales;
        }
      }
      if (priceSortOrder !== "none") {
        if (priceSortOrder === "asc") {
          return a.price - b.price;
        } else {
          return b.price - a.price;
        }
      }
      return 0;
    });

  const handlePriceSort = () => {
    if (priceSortOrder === "none") {
      setPriceSortOrder("asc");
      setSalesSortOrder("none");
    } else if (priceSortOrder === "asc") {
      setPriceSortOrder("desc");
    } else {
      setPriceSortOrder("none");
    }
  };

  const handleSalesSort = () => {
    if (salesSortOrder === "none") {
      setSalesSortOrder("asc");
      setPriceSortOrder("none");
    } else if (salesSortOrder === "asc") {
      setSalesSortOrder("desc");
    } else {
      setSalesSortOrder("none");
    }
  };

  const handleAnalyze = async (product: Product) => {
    if (!product.reviews || product.reviews.length === 0) {
      alert("请先添加评论");
      return;
    }
    setAnalyzingProductId(product.id);
    try {
      // 提取评论文本和点赞量，包括主评论和追评内容
      const reviewDataList = product.reviews.map((r) => {
        let reviewData: any;
        let likeCount: number | undefined = undefined;

        // 尝试解析 JSON 字符串
        try {
          reviewData = JSON.parse(r.text);
        } catch {
          // 如果不是 JSON，直接使用文本
          return {
            text: r.text,
            likeCount: undefined,
          };
        }

        // 如果是对象，提取所有文本字段和点赞量
        if (typeof reviewData === "object" && reviewData !== null) {
          const texts: string[] = [];

          // 提取点赞量（可能的字段名：评论点赞量、点赞量、likeCount等）
          const likeFields = [
            "评论点赞量",
            "点赞量",
            "likeCount",
            "likes",
            "点赞数",
          ];
          for (const field of likeFields) {
            if (reviewData[field] !== undefined && reviewData[field] !== null) {
              const likeValue = reviewData[field];
              if (typeof likeValue === "number") {
                likeCount = likeValue;
              } else if (
                typeof likeValue === "string" &&
                likeValue !== "有用" &&
                !isNaN(Number(likeValue))
              ) {
                likeCount = Number(likeValue);
              }
              break; // 只取第一个匹配的字段
            }
          }

          // 提取主评论（可能的字段名：评论、评价、内容等）
          const mainReviewFields = [
            "评论",
            "评价",
            "内容",
            "review",
            "comment",
            "content",
            "评论内容",
          ];
          for (const field of mainReviewFields) {
            if (
              reviewData[field] &&
              typeof reviewData[field] === "string" &&
              reviewData[field].trim()
            ) {
              texts.push(reviewData[field].trim());
              break; // 只取第一个匹配的字段
            }
          }

          // 提取所有追评字段（追评1、追评2、追评3 等）
          const followupPattern = /^(追评|追评1|追评2|追评3|追加评论)[\d]*$/i;
          Object.keys(reviewData).forEach((key) => {
            if (
              followupPattern.test(key) &&
              reviewData[key] &&
              typeof reviewData[key] === "string" &&
              reviewData[key].trim()
            ) {
              texts.push(reviewData[key].trim());
            }
          });

          // 如果没有找到任何文本，返回原始 JSON 字符串
          return {
            text: texts.length > 0 ? texts.join("\n") : r.text,
            likeCount: likeCount,
          };
        }

        return {
          text: r.text,
          likeCount: undefined,
        };
      });

      const analysis = await analyzeReviews(
        product.name,
        reviewDataList,
        competitor.isDomestic
      );
      setProductAnalysis(competitor.id, product.id, analysis);
      setProductReviews(competitor.id, product.id, []);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("分析失败，请检查 API Key");
    } finally {
      setAnalyzingProductId(null);
    }
  };

  const saveProduct = () => {
    if (!tempProduct.name || !tempProduct.price) return;

    const productToSave: Product = {
      id: tempProduct.id || crypto.randomUUID(),
      name: tempProduct.name,
      price: Number(tempProduct.price),
      tags:
        typeof tempProduct.tags === "string"
          ? (tempProduct.tags as string)
              .split("，")
              .map((t: string) => t.trim())
          : tempProduct.tags || [],
      category: tempProduct.category,
      link: tempProduct.link,
      competitorId: competitor.id,
      reviews: tempProduct.reviews || [],
      analysis: tempProduct.analysis,
      image: tempProduct.image,
      sales: tempProduct.sales ? Number(tempProduct.sales) : undefined,
      priceHistory: tempProduct.priceHistory,
      launchDate: tempProduct.launchDate,
      gender: tempProduct.gender,
      priceAnalysis: tempProduct.priceAnalysis,
      specs: tempProduct.specs,
    };

    if (editingProductId) {
      updateProduct(competitor.id, productToSave);
    } else {
      addProduct(competitor.id, productToSave);
    }

    setEditingProductId(null);
    setIsAddingProduct(false);
    setTempProduct({});
  };

  const saveAd = () => {
    if (!tempAd.text) return;

    const adToSave: AdCreative = {
      id: tempAd.id || `ad-${Date.now()}`,
      text: tempAd.text,
      highlights:
        typeof tempAd.highlights === "string"
          ? (tempAd.highlights as string)
              .split(" ")
              .map((h: string) => h.trim())
          : tempAd.highlights || [],
    };

    if (selectedCompetitorId) {
      if (editingAdId) {
        updateAd(selectedCompetitorId, adToSave);
      } else {
        addAd(selectedCompetitorId, adToSave);
      }
      setEditingAdId(null);
      setIsAddingAd(false);
      setTempAd({});
    }
  };

  const saveAnalysis = () => {
    if (selectedCompetitorId && editingAnalysisProductId && tempAnalysis) {
      setProductAnalysis(
        selectedCompetitorId,
        editingAnalysisProductId,
        tempAnalysis
      );
      setEditingAnalysisProductId(null);
      setTempAnalysis(null);
    }
  };
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let allParsedReviews: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet)?.map((item: any) => {
          let time = item?.["时间"];
          // 处理 Excel 日期格式 (数字类型)
          if (typeof time === "number") {
            // Excel 序列号转 JS Date: (n - 25569) * 86400 * 1000
            const date = new Date((time - 25569) * 86400 * 1000);
            // 格式化为 YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            time = `${year}-${month}-${day}`;
          } else if (typeof time === "string") {
            // 处理字符串格式
            time = time.trim();
            // 归一化分隔符
            time = time.replace(/\//g, "-");
            if (time.split("-").length < 3) {
              time = `2025-${time}`;
            }
          }

          return {
            ...item,
            时间: time,
            评论点赞量:
              item?.["评论点赞量"] === "有用" ? 0 : +item?.["评论点赞量"] || 0,
          };
        });

        if (jsonData) {
          allParsedReviews = [...allParsedReviews, ...jsonData];
        }
      }

      console.info(allParsedReviews, "---all parsed excel data");

      if (allParsedReviews.length > 0) {
        setProductReviews(competitor.id, productId, allParsedReviews);
        alert(
          `成功导入 ${allParsedReviews.length} 条评论 (来自 ${files.length} 个文件)`
        );
      } else {
        alert("未找到有效评论数据");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("文件解析失败");
    } finally {
      e.target.value = "";
    }
  };

  const handleProductImageLinkChange = (link: string) => {
    setTempProduct({
      ...tempProduct,
      image: link,
    });
  };

  const handleSaveImageLink = (product: Product) => {
    const updatedProduct = {
      ...product,
      image: tempImageLink,
    };
    updateProduct(competitor.id, updatedProduct);
    setEditingImageProductId(null);
    setTempImageLink("");
  };

  const handlePriceHistoryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const priceHistory = await parsePriceHistoryFromFiles(files);

      if (priceHistory.length > 0) {
        const latestPrice = getLatestPrice(priceHistory);
        if (latestPrice === null) {
          alert("未找到有效的价格数据");
          return;
        }

        const product = competitor.products?.find((p) => p.id === productId);
        if (product) {
          const updatedProduct = {
            ...product,
            price: latestPrice,
            priceHistory: priceHistory,
          };
          updateProduct(competitor.id, updatedProduct);
          alert(
            `成功导入 ${
              priceHistory.length
            } 条价格记录，产品价格已更新为 ¥${latestPrice.toFixed(2)}`
          );
        }
      } else {
        alert("未找到有效的价格数据，请检查 Excel 文件格式");
      }
    } catch (error) {
      console.error("Price history upload error:", error);
      alert("文件解析失败，请检查文件格式");
    } finally {
      e.target.value = "";
    }
  };

  const handleShowPriceChart = (product: Product) => {
    setSelectedProductForChart(product);
    setShowPriceChartModal(true);
  };

  const handleClearPriceHistory = (product: Product) => {
    if (
      !confirm(
        `确定要清空 "${product.name}" 的价格走势数据吗？此操作不可恢复。`
      )
    ) {
      return;
    }

    const updatedProduct = {
      ...product,
      priceHistory: [],
    };
    updateProduct(competitor.id, updatedProduct);
    alert("价格走势数据已清空");
  };

  const handlePriceHistoryUploadForNewProduct = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const priceHistory = await parsePriceHistoryFromFiles(files);

      if (priceHistory.length > 0) {
        const latestPrice = getLatestPrice(priceHistory);
        if (latestPrice === null) {
          alert("未找到有效的价格数据");
          return;
        }

        setTempProduct({
          ...tempProduct,
          price: latestPrice,
          priceHistory: priceHistory,
        });
        alert(
          `成功导入 ${
            priceHistory.length
          } 条价格记录，产品价格已更新为 ¥${latestPrice.toFixed(2)}`
        );
      } else {
        alert("未找到有效的价格数据，请检查 Excel 文件格式");
      }
    } catch (error) {
      console.error("Price history upload error:", error);
      alert("文件解析失败，请检查文件格式");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => setSelectedCompetitor(null)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">返回仪表盘</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-2">
          <CompetitorSidebar
            competitor={competitor}
            onUpdateCompetitor={updateCompetitor}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {["products", "ads"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "products"
                    ? `核心产品 (${competitor.products?.length || 0})`
                    : `宣传语创意 (${competitor.ads?.length || 0})`}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6">
              {activeTab === "products" && (
                <>
                  {isAddingProduct && (
                    <ProductForm
                      product={tempProduct}
                      onProductChange={setTempProduct}
                      onImageLinkChange={handleProductImageLinkChange}
                      onPriceHistoryUpload={
                        handlePriceHistoryUploadForNewProduct
                      }
                      onSave={saveProduct}
                      onCancel={() => {
                        setIsAddingProduct(false);
                        setTempProduct({});
                      }}
                      isEditing={false}
                    />
                  )}
                  <ProductList
                    competitor={competitor}
                    products={filteredAndSortedProducts}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedGender={selectedGender}
                    onGenderChange={setSelectedGender}
                    priceSortOrder={priceSortOrder}
                    salesSortOrder={salesSortOrder}
                    onPriceSort={handlePriceSort}
                    onSalesSort={handleSalesSort}
                    onAddProduct={() => {
                      setIsAddingProduct(true);
                      setTempProduct({});
                    }}
                    onUpdateProduct={(product) =>
                      updateProduct(competitor.id, product)
                    }
                    onRemoveProduct={(productId) =>
                      removeProduct(competitor.id, productId)
                    }
                    onAnalyzeProduct={handleAnalyze}
                    onUpdateProductAnalysis={(productId, analysis) =>
                      setProductAnalysis(competitor.id, productId, analysis)
                    }
                    onUploadReviews={async (productId, files) => {
                      const event = {
                        target: { files },
                      } as React.ChangeEvent<HTMLInputElement>;
                      await handleFileUpload(event, productId);
                    }}
                    onUploadPriceHistory={async (productId, files) => {
                      const event = {
                        target: { files },
                      } as React.ChangeEvent<HTMLInputElement>;
                      await handlePriceHistoryUpload(event, productId);
                    }}
                    onClearPriceHistory={handleClearPriceHistory}
                    onShowPriceChart={handleShowPriceChart}
                    onToggleFavorite={toggleFavoriteProduct}
                    isProductFavorite={isProductFavorite}
                    analyzingProductId={analyzingProductId}
                    editingProductId={editingProductId}
                    tempProduct={tempProduct}
                    onTempProductChange={setTempProduct}
                    onStartEdit={(product) => {
                      setTempProduct({ ...product });
                      setEditingProductId(product.id);
                    }}
                    onSaveProduct={saveProduct}
                    onCancelEdit={() => {
                      setEditingProductId(null);
                      setTempProduct({});
                    }}
                    editingAnalysisProductId={editingAnalysisProductId}
                    tempAnalysis={tempAnalysis}
                    onTempAnalysisChange={setTempAnalysis}
                    onStartEditAnalysis={(productId, analysis) => {
                      setTempAnalysis(analysis);
                      setEditingAnalysisProductId(productId);
                    }}
                    onSaveAnalysis={saveAnalysis}
                    onCancelAnalysisEdit={() => {
                      setEditingAnalysisProductId(null);
                      setTempAnalysis(null);
                    }}
                    editingImageProductId={editingImageProductId}
                    tempImageLink={tempImageLink}
                    onTempImageLinkChange={setTempImageLink}
                    onSaveImageLink={handleSaveImageLink}
                    onCancelImageEdit={() => {
                      setEditingImageProductId(null);
                      setTempImageLink("");
                    }}
                    onStartEditImage={(productId) => {
                      setEditingImageProductId(productId);
                    }}
                  />
                </>
              )}

              {activeTab === "ads" && (
                <AdList
                  ads={competitor.ads || []}
                  isAddingAd={isAddingAd}
                  tempAd={tempAd}
                  editingAdId={editingAdId}
                  onAddAd={() => {
                    setIsAddingAd(true);
                    setTempAd({});
                  }}
                  onCancelAddAd={() => {
                    setIsAddingAd(false);
                    setTempAd({});
                  }}
                  onTempAdChange={setTempAd}
                  onSaveAd={saveAd}
                  onEditAd={(ad) => {
                    setEditingAdId(ad.id);
                    setTempAd({ ...ad });
                  }}
                  onCancelEditAd={() => {
                    setEditingAdId(null);
                    setTempAd({});
                  }}
                  onRemoveAd={(adId) => {
                    if (confirm("确定删除该创意?")) {
                      removeAd(competitor.id, adId);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 价格走势图弹窗 */}
      <PriceChartModal
        product={selectedProductForChart}
        isOpen={showPriceChartModal}
        onClose={() => {
          setShowPriceChartModal(false);
          setSelectedProductForChart(null);
        }}
        isDomestic={competitor.isDomestic}
        onUpdateProduct={(updatedProduct) => {
          updateProduct(competitor.id, updatedProduct);
          // 更新当前选中的产品，以便立即显示分析结果
          setSelectedProductForChart(updatedProduct);
        }}
      />
    </div>
  );
};

export default CompetitorDetail;
