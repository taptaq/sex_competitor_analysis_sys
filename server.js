
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
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

// Initialize Gemini
// Try standard API_KEY first, then VITE_ prefixed one for compatibility
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI(apiKey) : null;

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
function isChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}

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

// --- Status Check ---
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', ai_enabled: !!ai });
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
    1. winnerName: 最终胜出的情趣用品产品名称（必须是两个比较产品的名称之一）。
    2. bestValueReason: 为什么该产品被认为是最佳选择（性价比/体验/创新）的详细理由。
    3. comparisonScores: 一个对象数组，每个对象代表一个产品的得分情况，数组长度必须等于产品数量（${products.length}个）：
       - productId: 产品 ID（必须是 ${productIds.join(", ")} 之一）
       - name: 产品名称（必须是两个比较产品的名称之一）
       - totalScore: 该产品的总分（0-100分）
       - dimensions: 该产品在各个维度的得分数组，每个维度包含：
         * label: 维度名称（如：外观设计、振动强度、材质触感、静音静谧度、APP交互、续航能力等）
         * score: 该产品在此维度的得分（0-100分）
         * reason: 该维度下的评分依据和对比说明
         * deduction: （可选）该产品在此维度的"扣分项"或主要不足，如果表现良好可以为空字符串
    4. summary: 对本轮情趣用品深度 PK 的综合总结。
    
    重要：comparisonScores 数组必须包含所有 ${products.length} 个产品，每个产品必须有相同的维度数量和维度名称。`;

    try {
        const data = await askAI(prompt, schema);
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Comparison analysis failed' });
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

app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
});
