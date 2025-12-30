


export interface ReviewAnalysis {
  pros: string[];
  cons: string[];
  summary: string;
  prosKeywords?: { value: string; count: number }[];
  consKeywords?: { value: string; count: number }[];
}

export interface ComparisonAnalysis {
  winnerName: string;
  bestValueReason: string;
  comparisonScores: {
    productId: string;
    name: string;
    totalScore: number;
    dimensions: {
      label: string;
      score: number;
      reason: string;
      deduction: string;
    }[];
  }[];
  summary: string;
}

export interface DeepCompetitorReport {
  productOverview: {
    name: string;
    price: number;
    category: string;
    tags: string[];
    competitorName: string;
  };
  marketPosition: {
    positioning: string;
    targetAudience: string;
    priceSegment: string;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitiveAdvantages: string[];
  improvementSuggestions: string[];
  summary: string;
}

export interface CompetitorReport {
  comparison: string;
  ownAdvantages: string[];
  ownWeaknesses: string[];
  competitorAdvantages: Array<{
    productName: string;
    advantages: string[];
  }>;
  improvementSuggestions: string[];
  marketStrategy: string;
  summary?: string;
}

export interface PriceHistory {
  date: string; // ISO date string (YYYY-MM-DD)
  finalPrice: number; // 到手价
  originalPrice?: number; // 券面价（可选）
}

export interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
  image?: string; // Base64 or URL
  category?: string; // 产品类型：跳蛋、震动棒、伸缩棒、AV棒等
  link?: string; // 产品链接
  competitorId: string;
  reviews?: Review[]; // Local reviews
  analysis?: ReviewAnalysis; // AI Analysis result
  priceHistory?: PriceHistory[]; // 价格历史数据
  sales?: number; // 销量
  launchDate?: string; // 上市时间 (YYYY-MM)
  gender?: 'Male' | 'Female' | 'Unisex'; // 产品适用性别：男用、女用、通用
}

export interface AdCreative {
  id: string;
  text: string;
  highlights: string[];
}

export interface Review {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative';
  keywords: string[];
}

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  sentiment: {
    material: number;
    noise: number;
    privacy: number;
    easeOfUse: number;
    value: number;
  };
  marketOpportunity?: { category: string; competition: number; volume: number }[];
  radarData?: { subject: string; A: number; fullMark: number }[];
  products?: Product[];
  ads?: AdCreative[];
  philosophy?: string[];
  focus?: 'Male' | 'Female' | 'Unisex';
  isDomestic?: boolean;
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  COMPETITOR_DETAIL = 'COMPETITOR_DETAIL',
  STRATEGY_ADVISOR = 'STRATEGY_ADVISOR',
  PRODUCT_COMPARISON = 'PRODUCT_COMPARISON',
  COMPETITOR_REPORT = 'COMPETITOR_REPORT',
  PRODUCT_KNOWLEDGE_BASE = 'PRODUCT_KNOWLEDGE_BASE',
}
