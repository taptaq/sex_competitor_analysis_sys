
export interface Competitor {
  id: string;
  name: string;
  logo: string;
  domain: string;
  platform: string;
  sentiment: {
    material: number;
    noise: number;
    privacy: number;
    easeOfUse: number;
    value: number;
  };
  priceHistory: { date: string; price: number }[];
}

export interface ReviewAnalysis {
  pros: string[];
  cons: string[];
  summary: string;
  prosKeywords?: { value: string; count: number }[];
  consKeywords?: { value: string; count: number }[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
  image: string;
  competitorId: string;
  reviews?: Review[]; // Local reviews
  analysis?: ReviewAnalysis; // AI Analysis result
}

export interface AdCreative {
  id: string;
  image: string;
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
  logo: string;
  domain: string;
  platform: string;
  sentiment: {
    material: number;
    noise: number;
    privacy: number;
    easeOfUse: number;
    value: number;
  };
  priceHistory: { date: string; price: number }[];
  marketOpportunity?: { category: string; competition: number; volume: number }[];
  radarData?: { subject: string; A: number; fullMark: number }[];
  products?: Product[];
  ads?: AdCreative[];
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  COMPETITOR_DETAIL = 'COMPETITOR_DETAIL',
  STRATEGY_ADVISOR = 'STRATEGY_ADVISOR',
}
