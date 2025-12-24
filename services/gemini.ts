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

export const analyzeReviews = async (productName: string, reviews: string[], isDomestic: boolean = false) => {
  try {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, reviews, isDomestic })
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
    return { ...data, isDomestic };
  } catch (error) {
     console.error('AI Service Error:', error);
     // Fallback mock
     return {
        id: `comp-${Date.now()}`,
        name: companyName,
        domain: 'example.com',
        isDomestic,
        sentiment: { material: 50, noise: 50, privacy: 50, easeOfUse: 50, value: 50 },
        products: []
    } as Competitor;
  }
};
