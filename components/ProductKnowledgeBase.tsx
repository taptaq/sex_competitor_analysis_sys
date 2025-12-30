import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { Product, Competitor } from "../types";
import { Search, Loader2, Sparkles, Filter, Database } from "lucide-react";
import { queryProductKnowledgeBase } from "../services/gemini";

interface SearchResult {
  product: Product;
  competitor: Competitor;
  relevanceScore?: number;
  matchedFields?: string[];
  aiAnalysis?: string;
}

const ProductKnowledgeBase: React.FC = () => {
  const { competitors, fetchCompetitors } = useStore();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [useAI, setUseAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  // 确保数据已加载
  useEffect(() => {
    if (competitors.length === 0) {
      fetchCompetitors();
    }
  }, [competitors.length, fetchCompetitors]);

  // 计算知识库统计信息
  const knowledgeBaseStats = useMemo(() => {
    const totalProducts = competitors.reduce(
      (sum, comp) => sum + (comp.products?.length || 0),
      0
    );
    const totalCompetitors = competitors.length;
    const categories = new Set<string>();
    const tags = new Set<string>();

    competitors.forEach((comp) => {
      comp.products?.forEach((prod) => {
        if (prod.category) categories.add(prod.category);
        prod.tags?.forEach((tag) => tags.add(tag));
      });
    });

    return {
      totalProducts,
      totalCompetitors,
      totalCategories: categories.size,
      totalTags: tags.size,
    };
  }, [competitors]);

  // 解析查询中的关键词和条件
  const parseQueryConditions = (queryText: string) => {
    const lowerQuery = queryText.toLowerCase();
    const conditions = {
      categories: [] as string[],
      features: [] as string[],
      priceRange: null as { operator: string; value: number } | null,
      salesRange: null as { operator: string; value: number } | null,
      launchDateRange: null as { operator: string; value: string } | null,
      keywords: [] as string[],
    };

    // 提取类别关键词（常见产品类别）
    const categoryKeywords = ['跳蛋', '震动棒', '伸缩棒', 'av棒', '飞机杯', '倒模', '按摩器'];
    categoryKeywords.forEach((cat) => {
      if (lowerQuery.includes(cat.toLowerCase())) {
        conditions.categories.push(cat);
      }
    });

    // 提取功能特性关键词（常见功能）
    const featureKeywords = [
      '加热', '恒温', '自动加热', '温控',
      '静音', '无声', '低噪音',
      '防水', 'ipx', '可水洗',
      '无线', '蓝牙', 'app',
      '多档', '多模式', '多频',
      '大功率', '强震', '强劲',
      '小巧', '便携', '迷你',
    ];
    featureKeywords.forEach((feat) => {
      if (lowerQuery.includes(feat.toLowerCase())) {
        conditions.features.push(feat);
      }
    });

    // 提取价格条件
    const priceMatch = lowerQuery.match(/(低于|小于|不超过|高于|大于|超过|价格|价格范围)?\s*(\d+)/);
    if (priceMatch) {
      const value = parseInt(priceMatch[2]);
      const operator = priceMatch[1] || '';
      conditions.priceRange = { operator, value };
    }

    // 提取销量条件（支持两种格式：1. "销量大于50000" 2. "低于50000销量的产品"）
    let salesMatch = lowerQuery.match(/销量\s*(大于|小于|超过|低于)?\s*(\d+\.?\d*)\s*(w|万)?/);
    if (!salesMatch) {
      // 尝试匹配数字在销量前面的格式："低于50000销量的产品"
      salesMatch = lowerQuery.match(/(大于|小于|超过|低于|不超过)\s*(\d+\.?\d*)\s*(w|万)?\s*销量/);
    }
    if (salesMatch) {
      const numValue = parseFloat(salesMatch[2]);
      const hasWUnit = salesMatch[3] === 'w' || salesMatch[3] === '万';
      // 如果有 w 或 万 单位，乘以 10000；否则直接使用原值
      const value = hasWUnit ? numValue * 10000 : numValue;
      const operator = salesMatch[1] || '';
      conditions.salesRange = { operator, value };
    }

    // 提取上市日期条件（支持多种格式：2024年上市、2024年后上市、2024年前上市、2024-05上市等）
    // 注意：近几年上市相关的查询将直接使用AI分析，不在这里设置筛选条件
    // 先检查相对时间表达：近几年上市、最近几年上市、近N年上市
    let recentYearsMatch = lowerQuery.match(/近\s*(\d+)?\s*年\s*上市/);
    if (!recentYearsMatch) {
      recentYearsMatch = lowerQuery.match(/最近\s*(\d+)?\s*年\s*上市/);
    }
    
    // 如果匹配到"近几年"，不设置筛选条件，让AI来处理
    if (!recentYearsMatch) {
      // 匹配格式：年份（4位数字）+ 可选月份（1-2位数字）+ 可选操作符（前/后/年）
      let dateMatch = lowerQuery.match(/(\d{4})\s*年?\s*(前|后|之前|之后|以前|以后)?\s*上市/);
      if (!dateMatch) {
        // 尝试匹配：2024-05上市、2024/05上市、2024.05上市
        dateMatch = lowerQuery.match(/(\d{4})[-/.](\d{1,2})\s*上市/);
        if (dateMatch) {
          const year = dateMatch[1];
          const month = dateMatch[2].padStart(2, '0');
          conditions.launchDateRange = { operator: '等于', value: `${year}-${month}` };
        }
      } else {
        const year = dateMatch[1];
        const operator = dateMatch[2] || '等于';
        // 如果没有指定月份，默认使用年份的第一天和最后一天
        if (operator === '等于' || !operator) {
          conditions.launchDateRange = { operator: '等于', value: year };
        } else if (operator.includes('前') || operator.includes('之前') || operator.includes('以前')) {
          conditions.launchDateRange = { operator: '之前', value: year };
        } else if (operator.includes('后') || operator.includes('之后') || operator.includes('以后')) {
          conditions.launchDateRange = { operator: '之后', value: year };
        }
      }
    }

    // 提取其他关键词
    const words = lowerQuery.split(/[\s，。、]+/).filter((w) => w.length > 1);
    words.forEach((word) => {
      // 排除日期相关的词（年、月、上市、前、后等）
      const isDateRelated = word.includes('年') || word.includes('月') || 
                           word.includes('上市') || word.includes('前') || 
                           word.includes('后') || word.match(/^\d{4}$/);
      
      if (
        !categoryKeywords.some((c) => word.includes(c.toLowerCase())) &&
        !featureKeywords.some((f) => word.includes(f.toLowerCase())) &&
        !word.match(/^\d+$/) &&
        !isDateRelated &&
        !['的', '具有', '功能', '产品', '类型', '类别'].includes(word)
      ) {
        conditions.keywords.push(word);
      }
    });

    return conditions;
  };

  // 检查产品是否匹配所有条件
  const matchesAllConditions = (
    product: Product,
    conditions: ReturnType<typeof parseQueryConditions>
  ): { matched: boolean; matchedFields: string[]; score: number } => {
    const matchedFields: string[] = [];
    let score = 0;
    let allMatched = true;

    // 类别条件：必须完全匹配
    if (conditions.categories.length > 0) {
      const categoryMatched = conditions.categories.some((cat) =>
        product.category?.toLowerCase().includes(cat.toLowerCase())
      );
      if (!categoryMatched) {
        allMatched = false;
      } else {
        matchedFields.push(`类别: ${product.category}`);
        score += 15;
      }
    }

    // 功能特性条件：必须在标签或名称中
    if (conditions.features.length > 0) {
      const matchedFeatures: string[] = [];
      conditions.features.forEach((feat) => {
        const inName = product.name.toLowerCase().includes(feat.toLowerCase());
        const inTags = product.tags?.some((tag) =>
          tag.toLowerCase().includes(feat.toLowerCase())
        );
        if (inName || inTags) {
          matchedFeatures.push(feat);
          score += 10;
        } else {
          allMatched = false;
        }
      });
      if (matchedFeatures.length > 0) {
        matchedFields.push(`功能: ${matchedFeatures.join(', ')}`);
      }
    }

    // 关键词条件：在名称、类别或标签中
    if (conditions.keywords.length > 0) {
      let keywordMatched = false;
      conditions.keywords.forEach((keyword) => {
        const inName = product.name.toLowerCase().includes(keyword);
        const inCategory = product.category?.toLowerCase().includes(keyword);
        const inTags = product.tags?.some((tag) =>
          tag.toLowerCase().includes(keyword)
        );
        if (inName || inCategory || inTags) {
          keywordMatched = true;
          score += 5;
        }
      });
      if (!keywordMatched && conditions.keywords.length > 0) {
        // 关键词不是必须的，但匹配了会加分
      }
    }

    // 价格条件
    if (conditions.priceRange) {
      const { operator, value } = conditions.priceRange;
      const price = product.price;
      let priceMatched = false;

      if (operator.includes('低') || operator.includes('小') || operator.includes('不超过')) {
        if (price <= value) {
          priceMatched = true;
          matchedFields.push(`价格: ¥${price} (低于${value})`);
        }
      } else if (operator.includes('高') || operator.includes('大') || operator.includes('超过')) {
        if (price >= value) {
          priceMatched = true;
          matchedFields.push(`价格: ¥${price} (高于${value})`);
        }
      } else {
        // 模糊匹配
        if (price >= value * 0.8 && price <= value * 1.2) {
          priceMatched = true;
          matchedFields.push(`价格: ¥${price} (接近${value})`);
        }
      }

      if (!priceMatched) {
        allMatched = false;
      } else {
        score += 5;
      }
    }

    // 销量条件
    if (conditions.salesRange && product.sales !== undefined) {
      const { operator, value } = conditions.salesRange;
      const sales = product.sales;
      let salesMatched = false;

      // 根据操作符进行匹配（注意：先检查"不超过"，再检查"超过"，避免误判）
      if (operator.includes('不超过') || operator.includes('小于') || operator.includes('低于') || operator.includes('小')) {
        // 不超过、小于、低于：销量必须 <= 阈值
        if (sales <= value) {
          salesMatched = true;
          matchedFields.push(
            `销量: ${sales >= 10000 ? `${(sales / 10000).toFixed(1)}w+` : sales.toLocaleString()}+ (${operator}${value >= 10000 ? `${(value / 10000).toFixed(1)}w` : value.toLocaleString()})`
          );
        }
      } else if (operator.includes('大') || operator.includes('超过')) {
        // 大于或超过：销量必须 >= 阈值
        if (sales >= value) {
          salesMatched = true;
          matchedFields.push(
            `销量: ${sales >= 10000 ? `${(sales / 10000).toFixed(1)}w+` : sales.toLocaleString()}+ (${operator}${value >= 10000 ? `${(value / 10000).toFixed(1)}w` : value.toLocaleString()})`
          );
        }
      } else {
        // 如果没有明确操作符，默认是"低于"（如"50000销量的产品"理解为"低于50000"）
        // 但更合理的做法是：如果查询中包含"低于"、"小于"等词，应该已经匹配到了
        // 这里作为兜底，如果操作符为空，默认使用"低于"
        if (sales <= value) {
          salesMatched = true;
          matchedFields.push(
            `销量: ${sales >= 10000 ? `${(sales / 10000).toFixed(1)}w+` : sales.toLocaleString()}+ (≤${value >= 10000 ? `${(value / 10000).toFixed(1)}w` : value.toLocaleString()})`
          );
        }
      }

      if (!salesMatched) {
        allMatched = false;
      } else {
        score += 5;
      }
    }

    // 上市日期条件
    if (conditions.launchDateRange && product.launchDate) {
      const { operator, value } = conditions.launchDateRange;
      const launchDate = product.launchDate; // 格式：YYYY-MM
      let dateMatched = false;

      // 解析日期值
      const valueYear = parseInt(value.split('-')[0]);
      const valueMonth = value.includes('-') ? parseInt(value.split('-')[1]) : null;
      const productYear = parseInt(launchDate.split('-')[0]);
      const productMonth = launchDate.includes('-') ? parseInt(launchDate.split('-')[1]) : null;

      if (operator === '等于') {
        if (valueMonth === null) {
          // 只比较年份
          if (productYear === valueYear) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate} (${valueYear}年)`);
          }
        } else {
          // 比较年月
          if (productYear === valueYear && productMonth === valueMonth) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate}`);
          }
        }
      } else if (operator === '之前' || operator.includes('前') || operator.includes('以前')) {
        // 之前：产品上市日期必须早于指定日期
        if (valueMonth === null) {
          // 只比较年份
          if (productYear < valueYear) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate} (${valueYear}年前)`);
          }
        } else {
          // 比较年月
          const valueDate = new Date(valueYear, valueMonth - 1);
          const productDate = new Date(productYear, (productMonth || 1) - 1);
          if (productDate < valueDate) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate} (${value}之前)`);
          }
        }
      } else if (operator === '之后' || operator.includes('后') || operator.includes('以后')) {
        // 之后：产品上市日期必须晚于指定日期
        if (valueMonth === null) {
          // 只比较年份
          if (productYear > valueYear) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate} (${valueYear}年后)`);
          }
        } else {
          // 比较年月
          const valueDate = new Date(valueYear, valueMonth - 1);
          const productDate = new Date(productYear, (productMonth || 1) - 1);
          if (productDate > valueDate) {
            dateMatched = true;
            matchedFields.push(`上市日期: ${launchDate} (${value}之后)`);
          }
        }
      }

      if (!dateMatched) {
        allMatched = false;
      } else {
        score += 5;
      }
    }

    return { matched: allMatched, matchedFields, score };
  };

  // 简单筛选逻辑（改进版：支持多条件组合）
  const simpleFilter = (queryText: string): SearchResult[] => {
    if (!queryText.trim()) return [];

    const conditions = parseQueryConditions(queryText);
    const results: SearchResult[] = [];

    // 如果没有任何明确条件，使用原来的简单匹配逻辑
    const hasStrictConditions =
      conditions.categories.length > 0 ||
      conditions.features.length > 0 ||
      conditions.priceRange !== null ||
      conditions.salesRange !== null ||
      conditions.launchDateRange !== null;

    competitors.forEach((competitor) => {
      competitor.products?.forEach((product) => {
        if (hasStrictConditions) {
          // 使用严格条件匹配
          const matchResult = matchesAllConditions(product, conditions);
          if (matchResult.matched) {
            results.push({
              product,
              competitor,
              relevanceScore: matchResult.score,
              matchedFields: matchResult.matchedFields,
            });
          }
        } else {
          // 使用原来的简单匹配逻辑（用于模糊查询）
          const lowerQuery = queryText.toLowerCase();
          const matchedFields: string[] = [];
          let score = 0;

          if (product.name.toLowerCase().includes(lowerQuery)) {
            matchedFields.push('产品名称');
            score += 10;
          }

          if (product.category?.toLowerCase().includes(lowerQuery)) {
            matchedFields.push('产品类别');
            score += 8;
          }

          const matchedTags = product.tags?.filter((tag) =>
            tag.toLowerCase().includes(lowerQuery)
          );
          if (matchedTags && matchedTags.length > 0) {
            matchedFields.push(`标签: ${matchedTags.join(', ')}`);
            score += matchedTags.length * 3;
          }

          if (competitor.name.toLowerCase().includes(lowerQuery)) {
            matchedFields.push(`竞品: ${competitor.name}`);
            score += 6;
          }

          if (score > 0) {
            results.push({
              product,
              competitor,
              relevanceScore: score,
              matchedFields,
            });
          }
        }
      });
    });

    // 按相关性分数排序
    return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      setAiAnalysis("");
      setUseAI(false);
      return;
    }

    // 检查是否有产品数据
    const totalProducts = competitors.reduce(
      (sum, comp) => sum + (comp.products?.length || 0),
      0
    );
    if (totalProducts === 0) {
      alert("知识库中暂无产品数据，请先添加产品信息");
      return;
    }

    setIsSearching(true);
    setUseAI(false);
    setAiAnalysis("");

    try {
      // 检查是否包含"近几年"相关查询，如果是则直接使用AI分析
      const lowerQuery = query.toLowerCase();
      const hasRecentYearsQuery = /近\s*(\d+)?\s*年\s*上市/.test(lowerQuery) || 
                                  /最近\s*(\d+)?\s*年\s*上市/.test(lowerQuery);

      // 如果包含"近几年"查询，直接使用AI分析
      if (hasRecentYearsQuery) {
        setUseAI(true);
        // 收集所有已存储的产品信息
        const allProducts = competitors.flatMap((comp) =>
          (comp.products || []).map((prod) => ({
            product: prod,
            competitor: comp,
          }))
        );

        if (allProducts.length === 0) {
          setSearchResults([]);
          setAiAnalysis("知识库中暂无产品数据");
          setIsSearching(false);
          return;
        }

        const aiResult = await queryProductKnowledgeBase(query, allProducts);
        setAiAnalysis(aiResult.analysis || "");

        // AI返回的产品ID列表
        if (aiResult.productIds && aiResult.productIds.length > 0) {
          const aiResults: SearchResult[] = [];
          aiResult.productIds.forEach((productId: string) => {
            competitors.forEach((comp) => {
              const product = comp.products?.find((p) => p.id === productId);
              if (product) {
                aiResults.push({
                  product,
                  competitor: comp,
                  aiAnalysis: aiResult.analysis,
                });
              }
            });
          });
          setSearchResults(aiResults);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
        return;
      }

      // 先尝试简单筛选（基于已存储的产品信息）
      const simpleResults = simpleFilter(query);

      // 如果简单筛选结果为空或结果较少且查询较复杂，使用AI
      const shouldUseAI =
        simpleResults.length === 0 ||
        (simpleResults.length < 3 && query.length > 10);

      if (shouldUseAI) {
        setUseAI(true);
        // 收集所有已存储的产品信息
        const allProducts = competitors.flatMap((comp) =>
          (comp.products || []).map((prod) => ({
            product: prod,
            competitor: comp,
          }))
        );

        if (allProducts.length === 0) {
          setSearchResults([]);
          setAiAnalysis("知识库中暂无产品数据");
          return;
        }

        const aiResult = await queryProductKnowledgeBase(query, allProducts);
        setAiAnalysis(aiResult.analysis || "");

        // AI返回的产品ID列表
        if (aiResult.productIds && aiResult.productIds.length > 0) {
          const aiResults: SearchResult[] = [];
          aiResult.productIds.forEach((productId: string) => {
            competitors.forEach((comp) => {
              const product = comp.products?.find((p) => p.id === productId);
              if (product) {
                aiResults.push({
                  product,
                  competitor: comp,
                  aiAnalysis: aiResult.analysis,
                });
              }
            });
          });
          setSearchResults(aiResults);
        } else {
          setSearchResults(simpleResults);
        }
      } else {
        setSearchResults(simpleResults);
      }
    } catch (error) {
      console.error("Search error:", error);
      // 如果AI失败，回退到简单筛选
      const fallbackResults = simpleFilter(query);
      setSearchResults(fallbackResults);
      setUseAI(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">产品知识库查询</h1>
        <p className="text-purple-100">
          输入您想了解的产品信息，系统将智能筛选相关产品并提供详细分析
        </p>
      </div>

      {/* 知识库统计信息 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-purple-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-800">知识库统计</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">产品总数</div>
            <div className="text-2xl font-bold text-purple-600">
              {knowledgeBaseStats.totalProducts}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">竞品品牌</div>
            <div className="text-2xl font-bold text-blue-600">
              {knowledgeBaseStats.totalCompetitors}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">产品类别</div>
            <div className="text-2xl font-bold text-green-600">
              {knowledgeBaseStats.totalCategories}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">标签总数</div>
            <div className="text-2xl font-bold text-orange-600">
              {knowledgeBaseStats.totalTags}
            </div>
          </div>
        </div>
        {knowledgeBaseStats.totalProducts === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ 知识库中暂无产品数据，请先在"仪表盘首页"添加竞品和产品信息
            </p>
          </div>
        )}
      </div>

      {/* 搜索框 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例如：价格低于100的跳蛋、销量大于1w的产品、近几年上市的静音震动棒..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
          >
            {isSearching ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>搜索中...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>搜索</span>
              </>
            )}
          </button>
        </div>

        {/* 搜索提示 */}
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium mb-2">搜索提示：</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>按产品名称、类别、标签搜索</li>
            <li>按价格范围搜索：如"低于100"、"100-200"</li>
            <li>按销量搜索：如"销量大于1w"</li>
            <li>按上市日期搜索：如"2024年上市"、"2024年后上市"、"2024-05上市"、"近几年上市"、"近3年上市"</li>
            <li>按竞品名称搜索</li>
            <li>复杂查询将自动使用AI分析</li>
          </ul>
        </div>
      </div>

      {/* AI分析结果 */}
      {useAI && aiAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="text-blue-600 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI 智能分析</h3>
              <p className="text-blue-800 whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              找到 {searchResults.length} 个相关产品
              {useAI && (
                <span className="ml-2 text-sm font-normal text-blue-600 flex items-center gap-1">
                  <Sparkles size={16} />
                  AI 筛选
                </span>
              )}
            </h2>
          </div>

          <div className="grid gap-4">
            {searchResults.map((result, index) => (
              <div
                key={`${result.product.id}-${index}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  {/* 产品图片 */}
                  {result.product.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={result.product.image}
                        alt={result.product.name}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* 产品信息 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {result.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          来自：{result.competitor.name}
                          {result.competitor.isDomestic ? (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              国内
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              海外
                            </span>
                          )}
                        </p>
                      </div>
                      {result.relevanceScore && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500">相关性</div>
                          <div className="text-lg font-bold text-purple-600">
                            {result.relevanceScore}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">价格</div>
                        <div className="text-lg font-semibold text-gray-900">
                          ¥{result.product.price.toFixed(2)}
                        </div>
                      </div>
                      {result.product.category && (
                        <div>
                          <div className="text-sm text-gray-500">类别</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {result.product.category}
                          </div>
                        </div>
                      )}
                      {result.product.sales !== undefined && (
                        <div>
                          <div className="text-sm text-gray-500">销量</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {result.product.sales >= 10000
                              ? `${(result.product.sales / 10000).toFixed(1)}w+`
                              : `${result.product.sales.toLocaleString()}+`}
                          </div>
                        </div>
                      )}
                      {result.product.launchDate && (
                        <div>
                          <div className="text-sm text-gray-500">上市日期</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {(() => {
                              const date = result.product.launchDate;
                              if (date.includes('-')) {
                                const [year, month] = date.split('-');
                                return `${year}年${month}月`;
                              }
                              return `${date}年`;
                            })()}
                          </div>
                        </div>
                      )}
                      {result.product.link && (
                        <div>
                          <div className="text-sm text-gray-500">链接</div>
                          <a
                            href={result.product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-sm truncate block"
                          >
                            查看详情 →
                          </a>
                        </div>
                      )}
                    </div>

                    {/* 匹配字段 */}
                    {result.matchedFields && result.matchedFields.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-500 mb-2">匹配字段：</div>
                        <div className="flex flex-wrap gap-2">
                          {result.matchedFields.map((field, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 标签 */}
                    {result.product.tags && result.product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.product.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 无结果提示 */}
      {!isSearching && query && searchResults.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Filter className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">未找到相关产品</h3>
          <p className="text-gray-500">
            请尝试使用不同的关键词，或使用更具体的查询条件
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductKnowledgeBase;

