import { Competitor, ReviewAnalysis } from '../types';

export const getDeepComparison = async (products: any[], isDomestic: boolean = false) => {
  try {
    const res = await fetch('/api/ai/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, isDomestic })
    });
    
    if (!res.ok) throw new Error('Comparison analysis failed');
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const getStrategyAdvice = async (concept: string , isDomestic: boolean = false) => {
  try {
    const res = await fetch('/api/ai/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, isDomestic })
    });
    
    if (!res.ok) throw new Error('Strategy analysis failed');
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      differentiation: "AI 服务暂时不可用，请检查后端服务。",
      compliance: "无数据",
      pricing: "无数据"
    };
  }
};

export const analyzeReviews = async (
  productName: string, 
  reviews: Array<{ text: string; likeCount?: number }> | string[], 
  isDomestic: boolean = false
) => {
  try {
    // 兼容旧格式（字符串数组）和新格式（对象数组）
    const reviewData = Array.isArray(reviews) && reviews.length > 0 && typeof reviews[0] === 'string'
      ? reviews.map(text => ({ text, likeCount: undefined }))
      : reviews as Array<{ text: string; likeCount?: number }>;

    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, reviews: reviewData, isDomestic })
    });

    if (!res.ok) throw new Error('Review analysis failed');
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      pros: ["AI 服务异常"],
      cons: ["无法连接到分析服务"],
      summary: "请检查本地服务器是否正常运行且已配置 API Key。"
    };
  }
};

export const fetchCompetitorData = async (companyName: string, isDomestic: boolean = false): Promise<Competitor> => {
  try {
    const res = await fetch('/api/ai/competitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, isDomestic })
    });

    if (!res.ok) {
       const err = await res.json();
       throw new Error(err.error || 'Competitor generation failed');
    }
    const data = await res.json();
    // 确保 foundedDate 和 country 字段被正确传递
    return { 
      ...data, 
      isDomestic, 
      foundedDate: data.foundedDate || undefined,
      country: data.country || undefined
    };
  } catch (error) {
     console.error('AI Service Error:', error);
     // Fallback mock
     return {
        id: `comp-${Date.now()}`,
        name: companyName,
        domain: 'example.com',
        isDomestic,
        sentiment: { material: 50, noise: 50, privacy: 50, easeOfUse: 50, value: 50 },
        products: [],
        foundedDate: undefined
    } as Competitor;
  }
};

export const generateDeepCompetitorReport = async (
  product: any,
  competitor: any,
  isDomestic: boolean = false
) => {
  try {
    const res = await fetch('/api/ai/deep-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, competitor, isDomestic })
    });

    if (!res.ok) throw new Error('Deep report generation failed');
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const generateCompetitorReport = async (
  ownProduct: {
    name: string;
    price: number;
    category?: string;
    tags?: string[];
    description?: string;
  },
  competitorProducts: Array<{ product: any; competitor: any }>,
  isDomestic: boolean = false
) => {
  try {
    const res = await fetch('/api/ai/competitor-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownProduct, competitorProducts, isDomestic })
    });

    if (!res.ok) throw new Error('Competitor report generation failed');
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const queryProductKnowledgeBase = async (
  query: string,
  products: Array<{ product: any; competitor: any }>
) => {
  try {
    const res = await fetch('/api/ai/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, products })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Knowledge base query failed');
    }
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

// ProductForge related functions
export const generateProductAnalysis = async (
  config: any,
  previousAnalysis?: any
): Promise<any> => {
  try {
    const res = await fetch('/api/ai/product-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, previousAnalysis })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Product analysis failed');
    }
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const generateProductImage = async (
  config: any
): Promise<string | null> => {
  try {
    const res = await fetch('/api/ai/product-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Product image generation failed');
    }
    const data = await res.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error('AI Service Error:', error);
    return null;
  }
};

export const generateOptimizedConfig = async (
  currentConfig: any,
  analysis: any
): Promise<any> => {
  try {
    const res = await fetch('/api/ai/optimized-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentConfig, analysis })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Optimized config generation failed');
    }
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const generateRecommendedConfig = async (
  requirements: any,
  gender: 'male' | 'female'
): Promise<any> => {
  try {
    const res = await fetch('/api/ai/recommended-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements, gender })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Recommended config generation failed');
    }
    return await res.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const recognizeProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch('/api/ai/ocr-product', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'OCR failed');
    }
    return await res.json();
  } catch (error) {
    console.error('OCR Service Error:', error);
    throw error;
  }
};

export const analyzePriceHistory = async (
  productName: string,
  priceHistory: Array<{ date: string; finalPrice: number; originalPrice?: number }>,
  currentPrice: number,
  isDomestic: boolean = false
) => {
  try {
    const res = await fetch('/api/ai/price-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, priceHistory, currentPrice, isDomestic })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Price analysis failed');
    }
    return await res.json();
  } catch (error) {
    console.error('Price Analysis Service Error:', error);
    throw error;
  }
};

export const analyzeBrandCharacteristics = async (
  competitor: {
    name: string;
    philosophy?: string[];
    products?: Array<{
      name: string;
      price: number;
      category?: string;
      tags?: string[];
      gender?: 'Male' | 'Female' | 'Unisex';
    }>;
    ads?: Array<{
      id: string;
      text: string;
      highlights: string[];
    }>;
    focus?: 'Male' | 'Female' | 'Unisex';
    isDomestic?: boolean;
  },
  isDomestic: boolean = false
) => {
  try {
    const res = await fetch('/api/ai/brand-characteristics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitor, isDomestic })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Brand characteristics analysis failed');
    }
    return await res.json();
  } catch (error) {
    console.error('Brand Characteristics Analysis Service Error:', error);
    throw error;
  }
};

export const analyzeQA = async (text: string) => {
  try {
    const res = await fetch('/api/ai/analyze-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'QA analysis failed');
    }
    return await res.json();
  } catch (error) {
    console.error('QA Analysis Service Error:', error);
    throw error;
  }
};
