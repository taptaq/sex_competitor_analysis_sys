
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Type } from "@google/genai";
import { createSDK } from 'dashscope-node';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load env vars from .env.local if present, otherwise .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'competitors.json');
const HISTORY_FILE = path.join(__dirname, 'comparison_history.json');
const DEEP_REPORTS_FILE = path.join(__dirname, 'deep_reports.json');
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

// Initialize Qwen (DashScope)
const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
const qwen = qwenApiKey ? createSDK({
    accessToken: qwenApiKey
}) : null;

// Initialize DeepSeek
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseek = deepseekApiKey ? new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: deepseekApiKey
}) : null;

// --- Helper Functions ---
async function askAI(promptInput, schema) {
    const promptStr = typeof promptInput === 'string' ? promptInput : JSON.stringify(promptInput);
    
    // Define available providers in priority order
    const providers = [];
    
    if (qwen) {
        providers.push({
            name: 'Qwen',
            call: async () => {
                const result = await qwen.chat.completion.request({
                    model: "qwen-plus",
                    input: {
                        messages: [
                            { role: "system", content: `你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的 JSON 对象：${JSON.stringify(schema)}。请确保所有 Key 名采用英文。` },
                            { role: "user", content: promptStr }
                        ]
                    },
                    parameters: {
                        response_format: { type: "json_object" },
                        enable_search: true
                    }
                });
                if (!result?.output?.text) throw new Error('Qwen returned empty output');
                return JSON.parse(result.output.text);
            }
        });
    }

    if (deepseek) {
        providers.push({
            name: 'DeepSeek',
            call: async () => {
                const response = await deepseek.chat.completions.create({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: `你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的有效 JSON 字符串：${JSON.stringify(schema)}。请直接返回 JSON 内容，不要包含 Markdown 代码块标记（如 \`\`\`json）。` },
                        { role: "user", content: promptStr }
                    ],
                    response_format: { type: "json_object" }
                });
                let content = response?.choices?.[0]?.message?.content?.trim();
                if (!content) throw new Error('DeepSeek returned empty content');
                
                // Robust markdown stripping
                if (content.startsWith('```')) {
                    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                }
                return JSON.parse(content);
            }
        });
    }

    // Execute providers in sequence
    for (const provider of providers) {
        try {
            console.log(`[AI] Attempting ${provider.name}...`);
            return await provider.call();
        } catch (err) {
            console.error(`[AI] ${provider.name} failed:`, err.message || err);
            // Continue to next provider
        }
    }

    throw new Error('All configured AI services (Qwen, DeepSeek) failed or are unavailable');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to ensure file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}
if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
}
if (!fs.existsSync(DEEP_REPORTS_FILE)) {
    fs.writeFileSync(DEEP_REPORTS_FILE, '[]', 'utf8');
}
if (!fs.existsSync(FAVORITES_FILE)) {
    fs.writeFileSync(FAVORITES_FILE, '[]', 'utf8');
}

// --- Status Check ---
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok' });
});

// --- Data Endpoints ---

// Read data
app.get('/api/competitors', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Write data
app.post('/api/competitors', (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) {
             return res.status(400).json({ error: 'Data must be an array' });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing file:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Read comparison history
app.get('/api/comparison-history', (req, res) => {
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading history file:', error);
        res.status(500).json({ error: 'Failed to read history' });
    }
});

// Save comparison history
app.post('/api/comparison-history', (req, res) => {
    try {
        const newRecord = req.body;
        if (!newRecord.id || !newRecord.timestamp || !newRecord.analysis) {
            return res.status(400).json({ error: 'Invalid record format' });
        }
        
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            history = JSON.parse(data);
        }
        
        history.unshift(newRecord); // Add to beginning
        // Keep only last 100 records
        if (history.length > 100) {
            history = history.slice(0, 100);
        }
        
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing history file:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

// Delete single comparison history record
app.delete('/api/comparison-history/:id', (req, res) => {
    try {
        const recordId = req.params.id;
        
        if (!fs.existsSync(HISTORY_FILE)) {
            return res.status(404).json({ error: 'History file not found' });
        }
        
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        let history = JSON.parse(data);
        
        history = history.filter((record) => record.id !== recordId);
        
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting history record:', error);
        res.status(500).json({ error: 'Failed to delete history record' });
    }
});

// Clear all comparison history
app.delete('/api/comparison-history', (req, res) => {
    try {
        fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// --- Deep Reports Endpoints ---

// Read deep reports
app.get('/api/deep-reports', (req, res) => {
    try {
        const data = fs.readFileSync(DEEP_REPORTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading deep reports file:', error);
        res.status(500).json({ error: 'Failed to read deep reports' });
    }
});

// Save deep report
app.post('/api/deep-reports', (req, res) => {
    try {
        const newReport = req.body;
        if (!newReport.productId || !newReport.competitorId || !newReport.report) {
            return res.status(400).json({ error: 'Invalid report format' });
        }
        
        let reports = [];
        if (fs.existsSync(DEEP_REPORTS_FILE)) {
            const data = fs.readFileSync(DEEP_REPORTS_FILE, 'utf8');
            reports = JSON.parse(data);
        }
        
        // Check if report already exists for this product
        const existingIndex = reports.findIndex(
            r => r.productId === newReport.productId && r.competitorId === newReport.competitorId
        );
        
        if (existingIndex >= 0) {
            // Update existing report
            reports[existingIndex] = {
                ...newReport,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new report
            reports.push({
                ...newReport,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        fs.writeFileSync(DEEP_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing deep reports file:', error);
        res.status(500).json({ error: 'Failed to save deep report' });
    }
});

// Delete single deep report
app.delete('/api/deep-reports/:productId', (req, res) => {
    try {
        const productId = req.params.productId;
        
        if (!fs.existsSync(DEEP_REPORTS_FILE)) {
            return res.status(404).json({ error: 'Deep reports file not found' });
        }
        
        const data = fs.readFileSync(DEEP_REPORTS_FILE, 'utf8');
        let reports = JSON.parse(data);
        
        reports = reports.filter((report) => report.productId !== productId);
        
        fs.writeFileSync(DEEP_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting deep report:', error);
        res.status(500).json({ error: 'Failed to delete deep report' });
    }
});

// Clear all deep reports
app.delete('/api/deep-reports', (req, res) => {
    try {
        fs.writeFileSync(DEEP_REPORTS_FILE, '[]', 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing deep reports:', error);
        res.status(500).json({ error: 'Failed to clear deep reports' });
    }
});

// --- Favorites Endpoints ---

// Read favorites
app.get('/api/favorites', (req, res) => {
    try {
        const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading favorites file:', error);
        res.status(500).json({ error: 'Failed to read favorites' });
    }
});

// Save favorites
app.post('/api/favorites', (req, res) => {
    try {
        const favorites = req.body;
        if (!Array.isArray(favorites)) {
            return res.status(400).json({ error: 'Favorites must be an array' });
        }
        
        fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing favorites file:', error);
        res.status(500).json({ error: 'Failed to save favorites' });
    }
});

// --- AI Endpoints ---

// 1. Generate Competitor Data
app.post('/api/ai/competitor', async (req, res) => {
    const { companyName: brandName, isDomestic } = req.body;
    const schema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            domain: { type: Type.STRING },
            philosophy: { type: Type.ARRAY, items: { type: Type.STRING } },
            focus: { type: Type.STRING }, // 'Male' | 'Female' | 'Unisex'
            sentiment: { 
                type: Type.OBJECT,
                properties: {
                    material: { type: Type.NUMBER },
                    noise: { type: Type.NUMBER },
                    privacy: { type: Type.NUMBER },
                    easeOfUse: { type: Type.NUMBER },
                    value: { type: Type.NUMBER }
                }
            },
           products: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorId: { type: Type.STRING }
                }
            }
           }
        }
    };

    const prompt = `你是一位专业的情趣用品行业市场分析师。请为情趣用品品牌 "${brandName}" 生成一份专业的竞品画像。
    ${isDomestic ? "该品牌主要在中国情趣用品市场运营，请结合国内电商平台（如淘宝、天猫、京东、小红书等）的数据和语境进行分析。" : "该品牌在国际情趣用品市场运营，请结合全球市场数据进行分析。"}
    
    输出必须严格包含以下 JSON 字段，键名必须为英文：
    1. domain: 品牌官网域名。
    2. philosophy: 品牌的经营理念，数组，每个元素字数100字以内，最多3个元素。
    3. focus: 品牌产品的目标受众，必须且只能是以下三个英文单词之一：'Male' (专攻男用), 'Female' (专攻女用), 'Unisex' (男女兼用/跨性别)。
    4. sentiment: 一个对象，包含以下五个英文键名的得分（0-100分）：
       - material (材质安全性与亲肤感)
       - noise (静音电机表现)
       - privacy (隐私包装与防漏光设计)
       - easeOfUse (操作便捷性与APP交互)
       - value (价格竞争力与耐用度)
    5. products: 代表性情趣用品核心产品数组（每一个产品的 name 和 tags 都必须翻译成中文，严禁出现英文），每个产品包含 id, name, price (数值型字段), tags (字符串数组), competitorId。
    
    输出必须是合法的 JSON 格式。`;

    console.info('AICompetitor=====')

    try {
        const data = await askAI(prompt, schema);
        if (!data.id || data.id === '1') data.id = `comp-${Date.now()}`;
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'AI generation failed' });
    }
});

// 2. Analyze Reviews
app.post('/api/ai/analyze', async (req, res) => {
    const { productName, reviews, isDomestic } = req.body;
    const schema = {
        type: Type.OBJECT,
        properties: {
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            prosKeywords: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT,
                    properties: {
                    value: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                    },
                    required: ["value", "count"]
                } 
            },
            consKeywords: { 
                type: Type.ARRAY, 
                items: { 
                type: Type.OBJECT,
                properties: {
                    value: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                },
                required: ["value", "count"]
                } 
            }
        },
        required: ["pros", "cons", "summary", "prosKeywords", "consKeywords"]
    };

    const prompt = `你是一位专业的情趣用品行业用户体验分析师。请分析情趣用品 "${productName}" 的以下用户评价数据：
    ${reviews.join('\n')}
    
    ${isDomestic ? "请结合中国市场的消费习惯和语境。" : "请结合全球市场的消费语境。"}
    
    请输出 JSON 格式的深度分析报告，包含以下英文键名：
    1. pros: 该款情趣用品的主要优点列表 (Array of Strings)。
    2. cons: 该款情趣用品的主要改进点或吐槽点列表 (Array of Strings)。
    3. summary: 对该情趣用品整体竞争力的简短总结 (String)。
    4. prosKeywords: 好评点中的高频词列表 (Array of Objects with {value: string, count: number})。
    5. consKeywords: 差评点中的高频词列表 (Array of Objects with {value: string, count: number})。`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// 4. Deep Product Comparison
app.post('/api/ai/compare', async (req, res) => {
    const { products } = req.body;
    const productIds = products.map(p => p.id);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            winnerName: { type: Type.STRING },
            bestValueReason: { type: Type.STRING },
            comparisonScores: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productId: { type: Type.STRING },
                        totalScore: { type: Type.NUMBER },
                        dimensions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    score: { type: Type.NUMBER },
                                    reason: { type: Type.STRING },
                                    deduction: { type: Type.STRING }
                                },
                                required: ["label", "score", "reason"]
                            }
                        }
                    },
                    required: ["productId", "totalScore", "dimensions"]
                }
            },
            summary: { type: Type.STRING }
        },
        required: ["winnerName", "bestValueReason", "comparisonScores", "summary"]
    };

    const prompt = `你是一位专业的情趣用品产品专家。请对以下几款情趣用品进行深度 PK 对比分析：
    ${JSON.stringify(products)}
    
    请输出 JSON 格式的详细对比结果，包含以下英文键名：
    1. winnerName: 最终胜出的情趣用品产品名称（必须是比较产品中的名称之一）。
    2. bestValueReason: 为什么该产品被认为是最佳选择（性价比/体验/创新）的详细理由。
    3. comparisonScores: 一个对象数组，每个对象代表一个产品的得分情况，数组长度必须等于产品数量（${products.length}个）：
       - productId: 产品 ID（必须是 ${productIds.join(", ")} 之一）
       - name: 产品名称（必须是比较产品中的名称之一）
       - totalScore: 该产品的总分（0-100分）
       - dimensions: 该产品在各个维度的得分数组，每个维度必须包含以下8个固定维度（顺序和名称必须完全一致）：
         * label: "外观" - 产品外观设计、颜值、造型美观度等
         * label: "核心功能" - 产品核心功能表现、技术实现、功能完整性等
         * label: "价格" - 价格竞争力、性价比、价格定位合理性等
         * label: "市场渠道" - 销售渠道覆盖、市场推广、品牌影响力等
         * label: "差异化竞争点" - 产品独特卖点、创新性、与竞品的差异化优势等
         * label: "用户好评" - 用户正面评价、满意度、推荐度等
         * label: "需优化点" - 产品存在的问题、用户负面反馈、改进空间等
         * label: "综合评价" - 综合竞争力、整体表现、市场地位等
         每个维度必须包含：
         * score: 该产品在此维度的得分（0-100分）
         * reason: 该维度下的评分依据和对比说明（详细分析）
         * deduction: （可选）该产品在此维度的"扣分项"或主要不足，如果表现良好可以为空字符串
    4. summary: 对本轮情趣用品深度 PK 的综合总结（200-300字）。
    
    重要：
    - comparisonScores 数组必须包含所有 ${products.length} 个产品
    - 每个产品的 dimensions 数组必须包含且仅包含上述8个维度，顺序和名称必须完全一致
    - 维度名称必须使用中文："外观"、"核心功能"、"价格"、"市场渠道"、"差异化竞争点"、"用户好评"、"需优化点"、"综合评价"`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Comparison analysis failed' });
    }
});

// 6. Competitor Report Analysis (Own Product vs Favorites)
app.post('/api/ai/competitor-report', async (req, res) => {
    const { ownProduct, competitorProducts, isDomestic } = req.body;
    const schema = {
        type: Type.OBJECT,
        properties: {
            comparison: { type: Type.STRING },
            ownAdvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
            ownWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitorAdvantages: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        advantages: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketStrategy: { type: Type.STRING },
            summary: { type: Type.STRING }
        },
        required: ["comparison", "ownAdvantages", "ownWeaknesses", "competitorAdvantages", "improvementSuggestions", "marketStrategy"]
    };

    const competitorInfo = competitorProducts.map((item) => {
        const comp = item.competitor;
        const prod = item.product;
        return `- ${prod.name} (${comp.name}，¥${prod.price}，${prod.category || '未分类'})：${prod.tags?.join('、') || '无标签'}${prod.analysis ? `\n  用户评价：${JSON.stringify(prod.analysis)}` : ''}`;
    }).join('\n');

    const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下自身产品与竞品进行深度对比分析：

自身产品信息：
- 产品名称：${ownProduct.name}
- 价格：¥${ownProduct.price}
- 产品类型：${ownProduct.category || '未分类'}
- 核心卖点/标签：${ownProduct.tags?.join('、') || '无'}
${ownProduct.description ? `- 产品描述：${ownProduct.description}` : ''}

竞品信息：
${competitorInfo}

${isDomestic ? "请结合中国情趣用品市场的实际情况，包括电商平台（淘宝、天猫、京东、小红书等）的竞争环境。" : "请结合全球情趣用品市场的竞争环境。"}

请输出 JSON 格式的竞品分析报告，包含以下英文键名：
1. comparison: 自身产品与竞品的整体对比分析（200-300字）
2. ownAdvantages: 自身产品相比竞品的优势列表（Array of Strings，至少3条）
3. ownWeaknesses: 自身产品相比竞品的劣势列表（Array of Strings，至少3条）
4. competitorAdvantages: 竞品优势分析（Array of Objects，每个对象包含 productName 和 advantages 数组）
5. improvementSuggestions: 针对自身产品的改进建议（Array of Strings，至少3条）
6. marketStrategy: 市场策略建议（200-300字，包括定价策略、市场定位、差异化方向等）
7. summary: 综合总结（可选，100-200字）

请确保分析专业、深入且具有实际参考价值。`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Competitor report generation failed' });
    }
});

// 5. Deep Competitor Report for Favorite Product
app.post('/api/ai/deep-report', async (req, res) => {
    const { product, competitor, isDomestic } = req.body;
    const schema = {
        type: Type.OBJECT,
        properties: {
            productOverview: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorName: { type: Type.STRING }
                }
            },
            marketPosition: {
                type: Type.OBJECT,
                properties: {
                    positioning: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    priceSegment: { type: Type.STRING }
                }
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitiveAdvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
        },
        required: ["productOverview", "marketPosition", "strengths", "weaknesses", "opportunities", "threats", "competitiveAdvantages", "improvementSuggestions", "summary"]
    };

    const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下收藏产品进行深度竞品报告分析：

产品信息：
- 产品名称：${product.name}
- 价格：¥${product.price}
- 产品类型：${product.category || '未分类'}
- 标签：${product.tags?.join('、') || '无'}
- 所属品牌：${competitor.name}
- 品牌官网：${competitor.domain || '未设置'}
- 品牌定位：${competitor.focus === 'Female' ? '专攻女用' : competitor.focus === 'Male' ? '专攻男用' : '男女兼用'}
${competitor.philosophy && competitor.philosophy.length > 0 ? `- 品牌理念：${competitor.philosophy.join('；')}` : ''}
${product.analysis ? `- 用户评价分析：${JSON.stringify(product.analysis)}` : ''}

${isDomestic ? "请结合中国情趣用品市场的实际情况，包括电商平台（淘宝、天猫、京东、小红书等）的竞争环境。" : "请结合全球情趣用品市场的竞争环境。"}

请输出 JSON 格式的深度竞品报告，包含以下英文键名：
1. productOverview: 产品概览（包含 name, price, category, tags, competitorName）
2. marketPosition: 市场定位分析（包含 positioning: 市场定位描述, targetAudience: 目标受众, priceSegment: 价格区间定位）
3. strengths: 产品优势列表（Array of Strings，至少3条）
4. weaknesses: 产品劣势列表（Array of Strings，至少3条）
5. opportunities: 市场机会列表（Array of Strings，至少3条）
6. threats: 市场威胁列表（Array of Strings，至少3条）
7. competitiveAdvantages: 竞争优势分析（Array of Strings，至少3条）
8. improvementSuggestions: 改进建议（Array of Strings，至少3条）
9. summary: 综合总结（200-300字）

请确保分析专业、深入且具有实际参考价值。`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Deep report generation failed' });
    }
});

// 3. Strategy Advice
app.post('/api/ai/strategy' , async (req, res) => {
    const { concept } = req.body;
    const schema = {
        type: Type.OBJECT,
        properties: {
            differentiation: { type: Type.STRING },
            compliance: { type: Type.STRING },
            pricing: { type: Type.STRING }
        },
        required: ["differentiation", "compliance", "pricing"]
    };

    const prompt = `你是一位专业的情趣用品行业创业导师。请对以下情趣用品创业概念进行“压力测试”：
    
    创业概念：
    ${concept}
    
    请从以下三个维度给出最直接、且带有批判性的建议：
    1. 可行性压力测试 (differentiation)：你的产品真的有差异化吗？还是只是在红海里挣扎？
    2. 流量与获客壁垒 (compliance)：在严苛的内容监管和隐私限制下，你如何寻找流量洼地？
    3. 定价与生存模型 (pricing)：你的定价策略能否支撑起昂贵的获客成本？
    
    你的语气应该是专业、冷静且一针见血的（Professional, Cold, Blunt）。
    
    输出必须严格符合 JSON 格式。`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Strategy generation failed' });
    }
});

// 6. Product Knowledge Base Query
app.post('/api/ai/knowledge-base', async (req, res) => {
    const { query, products } = req.body;
    
    if (!query || !products || !Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid request: query and products array required' });
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            productIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '相关产品的ID列表，按相关性排序'
            },
            analysis: {
                type: Type.STRING,
                description: '对查询的分析说明，解释为什么这些产品相关'
            }
        },
        required: ['productIds', 'analysis']
    };

    // 构建产品信息摘要
    const productsSummary = products.map((item, index) => {
        const { product, competitor } = item;
        return `产品 ${index + 1}:
- ID: ${product.id}
- 名称: ${product.name}
- 价格: ¥${product.price}
- 类别: ${product.category || '未分类'}
- 标签: ${product.tags?.join('、') || '无'}
- 销量: ${product.sales ? (product.sales >= 10000 ? `${(product.sales / 10000).toFixed(1)}w+` : `${product.sales.toLocaleString()}+`) : '未知'}
- 所属品牌: ${competitor.name}
- 品牌定位: ${competitor.focus === 'Female' ? '专攻女用' : competitor.focus === 'Male' ? '专攻男用' : '男女兼用'}
- 是否国内: ${competitor.isDomestic ? '是' : '否'}
${product.analysis ? `- 用户评价摘要: ${product.analysis.summary || '无'}` : ''}
`;
    }).join('\n');

    const prompt = `你是一位专业的情趣用品行业产品知识库分析师。用户提出了以下查询：

"${query}"

以下是知识库中的所有产品信息：

${productsSummary}

请根据用户的查询，**严格筛选**出完全符合条件的产品。

**重要筛选规则：**
1. **必须同时满足所有条件**：如果查询包含多个条件（如"具有加热功能的跳蛋"），产品必须同时满足：
   - 类别必须是"跳蛋"（不能是AV棒、震动棒等其他类别）
   - 标签或名称中必须包含"加热"相关功能（如"加热"、"自动加热"、"恒温"等）
   - 如果类别不匹配，即使有相关功能标签，也不应纳入结果

2. **精确匹配原则**：
   - 类别必须完全匹配，不能模糊匹配
   - 功能特性必须在标签或产品名称中明确体现
   - 不要包含"可能满足"、"相关性稍低但仍考虑"的产品

3. **排除规则**：
   - 如果查询明确指定了类别（如"跳蛋"），则其他类别（如AV棒、震动棒）的产品不应包含在内
   - 如果查询明确指定了功能（如"加热"），则没有该功能标签的产品不应包含在内
   - 不要因为"可能满足其他功能需求"而包含不匹配的产品

4. **如果没有任何产品完全匹配所有条件，请返回空数组，并在analysis中说明原因**

请输出 JSON 格式的结果，包含：
1. productIds: **完全符合所有条件**的产品ID数组（按相关性从高到低排序，最多返回10个）
2. analysis: 对查询的分析说明（200-300字），解释：
   - 查询中包含哪些条件
   - 为什么这些产品符合所有条件
   - 如果结果为空，说明原因

**请严格遵循以上规则，只返回完全匹配的产品。**`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Knowledge base query failed' });
    }
});

// 7. ProductForge: Generate Product Analysis
app.post('/api/ai/product-analysis', async (req, res) => {
    const { config, previousAnalysis } = req.body;
    
    if (!config) {
        return res.status(400).json({ error: 'Invalid request: config required' });
    }

    let optimizationContext = "";
    if (previousAnalysis) {
        optimizationContext = `
      ⚠️ CRITICAL OPTIMIZATION CONTEXT ⚠️
      This configuration is an OPTIMIZED revision designed to IMPROVE upon a previous version.
      
      Previous Analysis Baseline:
      - Cost Estimate: ${previousAnalysis.costEstimate}
      - Feasibility Score: ${previousAnalysis.feasibilityScore}
      - Technical Challenges: ${previousAnalysis.technicalChallenges.join(', ')}

      STRICT REQUIREMENTS (NON-NEGOTIABLE):
      1. Cost Estimate MUST be STRICTLY LOWER than "${previousAnalysis.costEstimate}"
         - Cost hierarchy: Low < Medium < High < Premium
         - Your cost estimate MUST be better (lower in hierarchy) than the baseline
         - If previous was "High", new must be "Medium" or "Low"
         - If previous was "Medium", new must be "Low"
      
      2. Feasibility Score MUST be HIGHER than ${previousAnalysis.feasibilityScore}
         - The new score should reflect reduced manufacturing complexity and risk
      
      3. Technical Challenges MUST be FEWER or LESS SEVERE
         - Address the previous risks: ${previousAnalysis.technicalChallenges.join(', ')}
      
      4. In "feasibilityRationale", you MUST explicitly state:
         - WHY the cost is lower (e.g., "simpler materials", "fewer components")
         - WHY feasibility improved (e.g., "eliminated conflicting processes")
         - HOW this configuration solves the previous challenges
      
      If the new configuration does NOT meet these requirements, you MUST still enforce them in your output.
      This is an optimization verification - the results MUST show improvement.
    `;
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            feasibilityScore: { type: Type.NUMBER },
            feasibilityRationale: { type: Type.STRING },
            costEstimate: { type: Type.STRING, enum: ["Low", "Medium", "High", "Premium"] },
            powerAnalysis: { type: Type.STRING },
            designAesthetics: { type: Type.STRING },
            technicalChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
            manufacturingAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["feasibilityScore", "feasibilityRationale", "costEstimate", "powerAnalysis", "designAesthetics", "technicalChallenges", "manufacturingAdvice"]
    };

    const prompt = `
    ${optimizationContext}
    
    你是一位专注于成人健康用品的高级产品工程师和技术产品经理。
    请对以下产品配置进行可行性、成本和设计含义的分析。
    
    产品基础信息：
    - 目标性别: ${config.gender === 'male' ? '男用' : '女用'}
    - 产品品类: ${config.category}
    - 创作背景/故事: ${config.background || "无"}
    - 核心特征/卖点: ${config.features || "无"}

    技术规格配置（注意：用户可能选择了多个选项）：
    - 材质: ${config.material.join(', ') || "无"}
    - 驱动系统: ${config.drive.join(', ') || "无"}
    - 主控系统: ${config.mainControl.join(', ') || "无"}
    - 加热系统: ${config.heating.join(', ') || "无"}
    - 传感器系统: ${config.sensors.join(', ') || "无"}
    - 电源系统: ${config.power.join(', ') || "无"}
    - 设备辅助: ${config.accessories.join(', ') || "无"}
    - 配色方案: ${config.color.join(', ') || "未指定"}
    - 图纹/纹理: ${config.texture.join(', ') || "未指定"}
    - 制造工艺: ${config.process.join(', ') || "未指定"}
    - 通信协议: ${config.protocol.join(', ') || "未指定"}

    请提供严谨、专业的中文技术分析：
    1. **人体工学与使用场景**：结合目标性别和品类，分析人体工学和使用场景。
    2. **创意实现评估**：结合创作背景和特征，评估实现难度和设计合理性。
    3. **多选技术兼容性分析**（重点）：
       - 如果用户选择了多种材质，分析它们能否在同一产品中共存（例如：硅胶+ABS的双色注塑可行性）
       - 如果选择了多个元器件，评估它们的功耗、空间占用、电路兼容性
       - 如果选择了多种工艺，判断工艺流程的先后顺序和兼容性（例如：喷涂是否会影响注塑）
       - 如果选择了多个通信协议，分析成本增加和芯片方案选择
       - **图纹/纹理兼容性**：评估所选图纹与材质、工艺的匹配度
         * 功能性纹理（如防滑条纹、按摩凸点）是否适合所选材质（硅胶易实现，金属难度大）
         * 装饰性纹理（如几何线条、品牌符号）与工艺的配合（激光蚀刻适合金属，IML适合塑料）
         * 隐藏式设计（如LED流光、温变图案）对电源和加热系统的需求
         * 纹理深度对清洁、防水、耐用性的影响
       - 明确指出哪些组合是**可行的**，哪些组合存在**技术冲突**或**成本过高**
    4. **可行性评分解释**：简要说明为什么给打这个分数，主要扣分点在哪里。
    5. **工程挑战**：对散热、电池寿命、材料粘合、防水密封、纹理耐久性等工程挑战保持批判性。
    6. **制造建议**：针对所选的技术组合（包括图纹实现方式），给出具体的生产线建议和风险提示。
    
    IMPORTANT: The output JSON must use English keys as defined in the schema, but all string values must be in Simplified Chinese (Except 'costEstimate' which must be one of the enum values).
  `;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Product analysis failed' });
    }
});

// 8. ProductForge: Generate Optimized Config
app.post('/api/ai/optimized-config', async (req, res) => {
    const { currentConfig, analysis } = req.body;
    
    if (!currentConfig || !analysis) {
        return res.status(400).json({ error: 'Invalid request: currentConfig and analysis required' });
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            gender: { type: Type.STRING, enum: ["male", "female"] },
            category: { type: Type.STRING },
            background: { type: Type.STRING },
            features: { type: Type.STRING },
            material: { type: Type.ARRAY, items: { type: Type.STRING } },
            drive: { type: Type.ARRAY, items: { type: Type.STRING } },
            mainControl: { type: Type.ARRAY, items: { type: Type.STRING } },
            heating: { type: Type.ARRAY, items: { type: Type.STRING } },
            sensors: { type: Type.ARRAY, items: { type: Type.STRING } },
            power: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
            color: { type: Type.ARRAY, items: { type: Type.STRING } },
            texture: { type: Type.ARRAY, items: { type: Type.STRING } },
            process: { type: Type.ARRAY, items: { type: Type.STRING } },
            protocol: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["gender", "category", "background", "features", "material", "drive", "mainControl", "heating", "sensors", "power", "accessories", "color", "texture", "process", "protocol"]
    };

    const prompt = `
    作为资深产品专家，请基于当前的产品配置和已有的技术分析，生成一份**经过优化的**产品配置方案。
    
    当前配置：
    - 性别/品类: ${currentConfig.gender} / ${currentConfig.category}
    - 材质: ${currentConfig.material.join(', ')}
    - 驱动系统: ${currentConfig.drive.join(', ')}
    - 主控系统: ${currentConfig.mainControl.join(', ')}
    - 加热系统: ${currentConfig.heating.join(', ')}
    - 传感器系统: ${currentConfig.sensors.join(', ')}
    - 电源系统: ${currentConfig.power.join(', ')}
    - 设备辅助: ${currentConfig.accessories.join(', ')}
    - 工艺: ${currentConfig.process.join(', ')}
    - 图纹: ${currentConfig.texture.join(', ')}
    - 协议: ${currentConfig.protocol.join(', ')}
    
    已有分析指出的问题（供参考）：
    - 挑战: ${analysis.technicalChallenges.join('; ')}
    - 建议: ${analysis.manufacturingAdvice.join('; ')}
    
    优化目标：
    1. 解决上述提到的技术挑战（例如兼容性、散热、成本问题）。
    2. 提升产品的可制造性和市场竞争力。
    3. 保持原有的核心产品定位（用户性别和品类不变）。
    
    请输出完整的 JSON 配置对象，格式必须与输入完全一致。
  `;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Optimized config generation failed' });
    }
});

// 9. ProductForge: Generate Recommended Config
app.post('/api/ai/recommended-config', async (req, res) => {
    const { requirements, gender } = req.body;
    
    if (!requirements || !gender) {
        return res.status(400).json({ error: 'Invalid request: requirements and gender required' });
    }

    const featureMapping = {
        '震动': '需要驱动系统（马达）',
        '加热': '需要加热系统（PTC/石墨烯加热膜）+ 温度传感器',
        '智能控制': '需要蓝牙通信协议 + 手机APP辅助',
        '防水': '需要全包胶无缝工艺 + 密封设计',
        '温控': '需要相变温控材料或NTC温度传感器',
    };

    const batteryMapping = {
        'Short': '300mAh锂聚合物电池（续航1-2小时）',
        'Medium': '600mAh锂聚合物电池（续航2-4小时）',
        'Long': '1000mAh锂聚合物电池（续航4-6小时）',
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            gender: { type: Type.STRING, enum: ["male", "female"] },
            category: { type: Type.STRING },
            background: { type: Type.STRING },
            features: { type: Type.STRING },
            material: { type: Type.ARRAY, items: { type: Type.STRING } },
            drive: { type: Type.ARRAY, items: { type: Type.STRING } },
            mainControl: { type: Type.ARRAY, items: { type: Type.STRING } },
            heating: { type: Type.ARRAY, items: { type: Type.STRING } },
            sensors: { type: Type.ARRAY, items: { type: Type.STRING } },
            power: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
            color: { type: Type.ARRAY, items: { type: Type.STRING } },
            texture: { type: Type.ARRAY, items: { type: Type.STRING } },
            process: { type: Type.ARRAY, items: { type: Type.STRING } },
            protocol: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["gender", "category", "background", "features", "material", "drive", "mainControl", "heating", "sensors", "power", "accessories", "color", "texture", "process", "protocol"]
    };

    const prompt = `
    你是一位资深的成人用品工程师，请根据用户的需求生成一套**成本最优**的产品配置方案。

    ## 用户需求
    - 目标性别: ${gender === 'male' ? '男性' : '女性'}
    - 产品品类: ${requirements.category || (gender === 'male' ? '由你根据需求自动选择（飞机杯/前列腺按摩器/震动环等）' : '由你根据需求自动选择（震动棒/跳蛋/吮吸器等）')}
    - 预算水平: ${requirements.budget}
    - 必备功能: ${requirements.mustHaveFeatures.join(', ')} 
      ${requirements.mustHaveFeatures.map(f => `  * ${f}: ${featureMapping[f] || ''}`).join('\n')}
    - 续航要求: ${requirements.batteryLife} - ${batteryMapping[requirements.batteryLife]}
    - 尺寸限制: ${requirements.sizeConstraint}
    - 特殊偏好: ${requirements.specialPreferences.join(', ')}
    - 目标用户群: ${requirements.targetAudience}
    ${requirements.additionalNotes ? `- 补充说明: ${requirements.additionalNotes}` : ''}

    ## 配置原则（按优先级排序）
    1. **成本优化**：在满足功能的前提下，优先选择性价比高的元器件和材料
    2. **功能完整性**：确保所有必备功能都能实现
    3. **兼容性**：选择的组件之间必须技术兼容，避免冲突
    4. **制造可行性**：工艺组合要可行，避免过度复杂的生产流程

    ## 预算约束指导
    - **Low**: 使用TPE材质、基础马达、塑料外壳、简单工艺、无智能功能
    - **Medium**: 使用医用硅胶、双马达、部分金属件、双色注塑、可选蓝牙
    - **High**: 使用液态硅胶、线性马达、金属+玻璃、IML/PVD工艺、智能控制
    - **Premium**: 最高端材料、AIoT芯片、相变材料、激光蚀刻、生物传感器

    ## 尺寸约束指导
    - **Compact**: 优先300mAh电池、单马达、简化传感器
    - **Standard**: 600mAh电池、双马达、标准配置
    - **Large**: 1000mAh电池、多马达、完整传感器阵列

    ## 输出要求
    请直接输出一个完整的ProductConfig JSON对象，确保：
    1. category 符合目标性别（男性: 飞机杯/前列腺按摩器; 女性: 震动棒/跳蛋/吮吸器）
    2. background 和 features 简洁描述设计理念和核心卖点
    3. 所有数组字段（material, drive, mainControl, etc.）至少包含一个选项
    4. 确保选择的组件能满足所有必备功能
    5. 成本与预算水平匹配

    注意：直接返回JSON，不要有任何额外的解释文字。
  `;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Recommended config generation failed' });
    }
});

// 10. ProductForge: Generate Product Image using Z-Image-Turbo
app.post('/api/ai/product-image', async (req, res) => {
    const { config } = req.body;
    
    if (!config) {
        return res.status(400).json({ error: 'Invalid request: config required' });
    }

    if (!qwen) {
        return res.status(500).json({ error: 'Qwen API not configured. Please set QWEN_API_KEY or DASHSCOPE_API_KEY' });
    }

    try {
        // Generate prompt from product config
        const promptParts = [];
        
        // Category and gender
        if (config.category) {
            promptParts.push(config.category);
        }
        if (config.gender === 'male') {
            promptParts.push('男性用品');
        } else if (config.gender === 'female') {
            promptParts.push('女性用品');
        }

        // Materials
        if (config.material && config.material.length > 0) {
            promptParts.push(`材质：${config.material.join('、')}`);
        }

        // Colors
        if (config.color && config.color.length > 0) {
            promptParts.push(`颜色：${config.color.join('、')}`);
        }

        // Features
        if (config.features) {
            promptParts.push(`功能特点：${config.features}`);
        }

        // Background/Context
        if (config.background) {
            promptParts.push(`背景：${config.background}`);
        }

        // Additional details
        const details = [];
        if (config.drive && config.drive.length > 0) {
            details.push(`驱动系统：${config.drive.join('、')}`);
        }
        if (config.heating && config.heating.length > 0) {
            details.push(`加热系统：${config.heating.join('、')}`);
        }
        if (config.texture && config.texture.length > 0) {
            details.push(`纹理：${config.texture.join('、')}`);
        }
        if (details.length > 0) {
            promptParts.push(details.join('，'));
        }

        // Build final prompt
        let prompt = promptParts.join('，');
        if (!prompt) {
            prompt = '情趣用品产品概念图';
        }
        
        // Add style guidance
        prompt += '，产品设计图，专业产品摄影风格，白色背景，高清细节，3D渲染效果';

        console.log(`[Image Generation] Prompt: ${prompt}`);

        // Call Z-Image-Turbo API via DashScope HTTP API
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${qwenApiKey}`
            },
            body: JSON.stringify({
                model: "z-image-turbo",
                input: {
                    prompt: prompt
                },
                parameters: {
                    size: "1024*1024",
                    n: 1
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DashScope API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (!result || !result.output || !result.output.results || result.output.results.length === 0) {
            throw new Error('Z-Image-Turbo returned empty result');
        }

        const imageUrl = result.output.results[0].url;
        if (!imageUrl) {
            throw new Error('No image URL in response');
        }

        console.log(`[Image Generation] Success: ${imageUrl}`);
        res.json({ imageUrl });
    } catch (error) {
        console.error('[Image Generation] Error:', error);
        res.status(500).json({ 
            error: 'Image generation failed', 
            message: error.message || 'Unknown error',
            imageUrl: null 
        });
    }
});

app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
});
