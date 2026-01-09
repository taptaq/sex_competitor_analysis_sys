


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

export interface PriceAnalysis {
  trend: string; // 价格趋势分析
  priceRange: string; // 价格区间分析
  fluctuation: string; // 价格波动分析
  discountAnalysis: string; // 优惠力度分析
  recommendations: string[]; // 定价建议
  summary: string; // 综合分析总结
}

export interface BrandCharacteristicAnalysis {
  brandPositioning: string; // 品牌定位分析
  productCharacteristics: string; // 产品特征分析
  priceStrategy: string; // 价格策略分析
  targetAudience: string; // 目标受众分析
  competitiveAdvantages: string[]; // 竞争优势
  brandPersonality: string; // 品牌个性
  sloganCreativity: string; // 宣传语与创意分析
  summary: string; // 综合分析总结
  wordCloudKeywords?: Array<{ value: string; count: number }>; // AI生成的词云关键词（已过滤无用词）
}

export interface ProductSpecs {
  dimensions?: string; // 产品尺寸，如 "长x宽x高" 或 "直径x长度"
  material?: string; // 产品材质
  noiseLevel?: string; // 噪音值，如 "≤45dB"
  usageTime?: string; // 使用时长，如 "60分钟"
  chargingTime?: string; // 充电时长，如 "2小时"
  controlMethod?: string; // 控制方式，如 "APP控制"、"按键控制"、"遥控器"
  weight?: string; // 重量，如 "200g"
  ipRating?: string; // 防水防尘等级，如 "IPX7"、"IPX4"、"IP67" 等
}

export interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
  image?: string; // Base64 or URL
  category?: string; // 产品类型：跳蛋、震动棒、伸缩棒、AV棒、缩阴球等
  link?: string; // 产品链接
  competitorId: string;
  reviews?: Review[]; // Local reviews
  analysis?: ReviewAnalysis; // AI Analysis result
  priceHistory?: PriceHistory[]; // 价格历史数据
  sales?: number; // 销量
  launchDate?: string; // 上市时间 (YYYY-MM)
  gender?: 'Male' | 'Female' | 'Unisex'; // 产品适用性别：男用、女用、通用
  priceAnalysis?: PriceAnalysis; // 价格走势分析结果
  specs?: ProductSpecs; // 产品规格参数
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
  foundedDate?: string; // 创立日期，格式：YYYY-MM 或 YYYY
  country?: string; // 国家名（仅用于国外品牌）
  brandCharacteristicAnalysis?: BrandCharacteristicAnalysis; // 品牌特点分析结果
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  COMPETITOR_DETAIL = 'COMPETITOR_DETAIL',
  STRATEGY_ADVISOR = 'STRATEGY_ADVISOR',
  PRODUCT_COMPARISON = 'PRODUCT_COMPARISON',
  COMPETITOR_REPORT = 'COMPETITOR_REPORT',
  PRODUCT_KNOWLEDGE_BASE = 'PRODUCT_KNOWLEDGE_BASE',
}
