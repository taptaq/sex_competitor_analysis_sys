


export interface ReviewAnalysis {
  pros: string[];
  cons: string[];
  summary: string;
  prosKeywords?: { value: string; count: number }[];
  consKeywords?: { value: string; count: number }[];
}

export interface ComparisonAnalysis {
  winnerId: string;
  bestValueReason: string;
  comparisonScores: {
    productId: string;
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

export interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
  image?: string; // Base64 or URL
  competitorId: string;
  reviews?: Review[]; // Local reviews
  analysis?: ReviewAnalysis; // AI Analysis result
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
  philosophy?: string;
  focus?: 'Male' | 'Female' | 'Unisex';
  isDomestic?: boolean;
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  COMPETITOR_DETAIL = 'COMPETITOR_DETAIL',
  STRATEGY_ADVISOR = 'STRATEGY_ADVISOR',
  PRODUCT_COMPARISON = 'PRODUCT_COMPARISON',
}
