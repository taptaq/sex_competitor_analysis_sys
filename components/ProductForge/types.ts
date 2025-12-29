export interface ProductConfig {
  gender: 'male' | 'female';
  category: string;
  background: string;
  features: string;
  material: string[];
  drive: string[];        // 驱动系统
  mainControl: string[];  // 主控系统
  heating: string[];      // 加热系统
  sensors: string[];      // 传感器系统
  power: string[];        // 电源系统
  accessories: string[];  // 设备辅助
  color: string[];
  texture: string[];      // 图纹/纹理
  process: string[];
  protocol: string[];
}

export interface AnalysisResult {
  feasibilityScore: number;
  feasibilityRationale: string; // Brief explanation of why this score was given
  costEstimate: 'Low' | 'Medium' | 'High' | 'Premium';
  powerAnalysis: string;
  designAesthetics: string;
  technicalChallenges: string[];
  manufacturingAdvice: string[];
}

export interface UserRequirements {
  budget: 'Low' | 'Medium' | 'High' | 'Premium';
  category?: string;  // 产品品类（可选）
  mustHaveFeatures: string[];  // 震动, 加热, 智能控制, 防水, 温控
  batteryLife: 'Short' | 'Medium' | 'Long';
  sizeConstraint: 'Compact' | 'Standard' | 'Large';
  specialPreferences: string[];  // 静音, 高端外观, 易清洁
  targetAudience: '入门级' | '中端' | '高端';
  additionalNotes?: string;
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGeneratingImage: boolean;
  error: string | null;
}

export enum TabOption {
  CONFIG = 'config',
  RESULTS = 'results',
}

