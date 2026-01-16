import { supabase } from './supabase';
import { Competitor } from '../types';

// Helper to sanitize product data
const sanitizeProduct = (p: any) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  category: p.category,
  tags: p.tags,
  description: p.description,
  gender: p.gender,
  sales: p.sales,
  launchDate: p.launchDate,
  analysis: p.analysis ? { summary: p.analysis.summary } : undefined // Only need summary usually
});

const invokeAI = async (action: string, payload: any) => {
  // ... (existing invokeAI code)
  const { data, error } = await supabase.functions.invoke('ai-api', {
    body: { action, payload }
  });

  if (error) {
    if (error instanceof Error) throw error;
    throw new Error(error.message || 'Unknown Supabase Function Error');
  }
  
  if (data && data.error) {
     throw new Error(data.error);
  }
  return data;
};

export const getDeepComparison = async (products: any[], isDomestic: boolean = false) => {
  try {
    const sanitizedProducts = products.map(sanitizeProduct);
    return await invokeAI('compare', { products: sanitizedProducts });
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const getStrategyAdvice = async (concept: string , isDomestic: boolean = false) => {
  try {
    return await invokeAI('strategy', { concept, isDomestic });
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      differentiation: "AI 服务暂时不可用，请检查网络连接。",
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
    const reviewData = Array.isArray(reviews) && reviews.length > 0 && typeof reviews[0] === 'string'
      ? reviews.map(text => ({ text, likeCount: undefined }))
      : reviews as Array<{ text: string; likeCount?: number }>;

    return await invokeAI('analyze', { productName, reviews: reviewData, isDomestic });
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      pros: ["AI 服务异常"],
      cons: ["无法连接到分析服务"],
      summary: "请检查网络连接。"
    };
  }
};

export const fetchCompetitorData = async (companyName: string, isDomestic: boolean = false): Promise<Competitor> => {
  try {
    const data = await invokeAI('competitor', { companyName, isDomestic });
    return { 
      ...data, 
      id: crypto.randomUUID(), // Ensure we always generate a valid UUID for the database
      isDomestic, 
      foundedDate: data.foundedDate || undefined,
      country: data.country || undefined,
      majorUserGroupProfile: data.majorUserGroupProfile || undefined
    };
  } catch (error) {
     console.error('AI Service Error:', error);
     return {
        id: crypto.randomUUID(),
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
    const sanitizedProduct = sanitizeProduct(product);
    // Competitor usually doesn't have huge fields directly, but sanitize its products if present? 
    // Usually competitor object here is metadata (name, focus, philosophy).
    // If competitor has 'products' array, we should probably strip it as it's not used in 'deep-report' prompt (only product + competitor info used).
    // Looking at ai-api/index.ts for deep-report: uses competitor.name, domain, focus, philosophy.
    const sanitizedCompetitor = {
        name: competitor.name,
        domain: competitor.domain,
        focus: competitor.focus,
        philosophy: competitor.philosophy
    };

    return await invokeAI('deep-report', { product: sanitizedProduct, competitor: sanitizedCompetitor, isDomestic });
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
    const sanitizedCompetitorProducts = competitorProducts.map(item => ({
        product: sanitizeProduct(item.product),
        competitor: {
            name: item.competitor.name,
            focus: item.competitor.focus,
            isDomestic: item.competitor.isDomestic
        }
    }));
    return await invokeAI('competitor-report', { ownProduct, competitorProducts: sanitizedCompetitorProducts, isDomestic });
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
    const sanitizedProducts = products.map(item => ({
        product: sanitizeProduct(item.product),
        competitor: {
            name: item.competitor.name,
            focus: item.competitor.focus,
            isDomestic: item.competitor.isDomestic
        }
    }));
    return await invokeAI('knowledge-base', { query, products: sanitizedProducts });
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

// ... (ProductForge functions unchanged)
export const generateProductAnalysis = async (
  config: any,
  previousAnalysis?: any
) => {
    return await invokeAI('product-analysis', { config, previousAnalysis });
};
export const generateProductImage = async (config: any) => {
    const data = await invokeAI('product-image', { config });
    return data.imageUrl || null;
};
export const generateOptimizedConfig = async (currentConfig: any, analysis: any) => {
    return await invokeAI('optimized-config', { currentConfig, analysis });
};
export const generateRecommendedConfig = async (requirements: any, gender: 'male' | 'female') => {
    return await invokeAI('recommended-config', { requirements, gender });
};

export const recognizeProductImage = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string; 
        const data = await invokeAI('ocr-product', { image: base64 });
        resolve(data);
      } catch (e) {
        console.error('OCR Service Error:', e);
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzePriceHistory = async (
  productName: string,
  priceHistory: Array<{ date: string; finalPrice: number; originalPrice?: number }>,
  currentPrice: number,
  isDomestic: boolean = false
) => {
  try {
    return await invokeAI('price-analysis', { productName, priceHistory, currentPrice, isDomestic });
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
    // Sanitize products inside competitor object
    const sanitizedCompetitor = {
        ...competitor,
        products: competitor.products?.map(p => ({
            name: p.name,
            price: p.price,
            category: p.category,
            tags: p.tags,
            gender: p.gender
            // EXCLUDE: image, etc.
        }))
    };
    return await invokeAI('brand-characteristics', { competitor: sanitizedCompetitor, isDomestic });
  } catch (error) {
    console.error('Brand Characteristics Analysis Service Error:', error);
    throw error;
  }
};

export const analyzeUserGroupProfile = async (
  brandName: string, 
  isDomestic: boolean = false,
  context?: {
    philosophy?: string[];
    description?: string;
    focus?: string;
  }
) => {
  try {
    const data = await invokeAI('analyze-user-group', { brandName, isDomestic, context });
    return data.result;
  } catch (error) {
    console.error('User Group Analysis Service Error:', error);
    throw error;
  }
};

export const analyzeQA = async (text: string) => {
  try {
    return await invokeAI('analyze-qa', { text });
  } catch (error) {
    console.error('QA Analysis Service Error:', error);
    throw error;
  }
};

export const analyzeStandardization = async (
  productName: string,
  description: string,
  parameters: any,
  reviews: Array<{ text: string }> | string[],
  isDomestic: boolean = false
) => {
  try {
    const reviewData = Array.isArray(reviews) && reviews.length > 0 && typeof reviews[0] === 'string'
      ? reviews.map(text => ({ text }))
      : reviews as Array<{ text: string }>;

    return await invokeAI('standardize-analysis', { 
        productName, 
        description, 
        parameters, 
        reviews: reviewData, 
        isDomestic 
    });
  } catch (error) {
    console.error('Standardization Analysis Service Error:', error);
    throw error;
  }
};
export const analyzeThought = async (content: string) => {
  return await invokeAI('analyze-thought', { content });
};

export const analyzeGlobalReviewQA = async (
  question: string,
  reviews: Array<{ productName: string; text: string }>
) => {
  try {
    return await invokeAI('review-qa', { question, reviews });
  } catch (error) {
    console.error('Global Review QA Service Error:', error);
    throw error;
  }
};
