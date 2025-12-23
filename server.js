
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

// Load env vars from .env.local if present, otherwise .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'competitors.json');

// Initialize Gemini
// Try standard API_KEY first, then VITE_ prefixed one for compatibility
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to ensure file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
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

// --- AI Endpoints ---

// 1. Generate Competitor Data
app.post('/api/ai/competitor', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured (missing API Key)' });
    
    const { companyName } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              你是一位专业的竞品情报分析师。
              任务：请生成关于情趣用品品牌 “${companyName}” 的真实/仿真竞争情报数据。
              需包含：品牌官网域名, 主要销售平台, 
              当下的五维情感分析评分(材质, 噪音, 隐私, 易用性, 性价比 - 0-100分),
              以及2-3个核心代表产品(含名称,预估价格,标签)。
              要求：数据尽可能贴近真实市场情况。返回 JSON 格式，符合 Competitor 接口定义。
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        logo: { type: Type.STRING },
                        domain: { type: Type.STRING },
                        platform: { type: Type.STRING },
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
                        priceHistory: { 
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { date: { type: Type.STRING }, price: { type: Type.NUMBER } }
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
                                   image: { type: Type.STRING },
                                   competitorId: { type: Type.STRING }
                               }
                           }
                       }
                    }
                }
            }
        });
        
        console.info(response, '---response')
        const data = JSON.parse(response.text);
        if (!data.id || data.id === '1') data.id = `comp-${Date.now()}`;
        res.json(data);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'AI generation failed' });
    }
});

// 2. Analyze Reviews
app.post('/api/ai/analyze', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    
    const { productName, reviews } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              你是一位资深的产品体验分析师。
              任务：请分析以下关于产品 “${productName}” 的用户评论，提炼出产品的优点和待优化点。
              评论数据为 JSON 格式，请综合所有字段信息（如评论内容、sku、时间、评论点赞量等）进行深入分析。
              评论列表：
              ${reviews.map((r, i) => `${i+1}. ${r}`).join('\n')}
              要求：返回 JSON 格式 (pros: string[], cons: string[], summary: string, prosKeywords: { value: string, count: number }[], consKeywords: { value: string, count: number }[])。
              prosKeywords 和 consKeywords 用于生成词云，请提取出 10-20 个高频关键词，count 代表重要程度 (10-50)。
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                }
            }
        });
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// 3. Strategy Advice
app.post('/api/ai/strategy', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    
    const { concept } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              你是一位数据驱动的、高度现实主义的创业导师，自称为“创业压力测试员”。
              背景：用户提出了一个关于大人糖等情趣用品行业的创新产品想法：“${concept}”。
              任务：请基于行业残酷现实进行分析 (差异化, 获客成本, 定价)。
              要求：语气专业、冷静且直言不讳。返回 JSON 格式。
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        differentiation: { type: Type.STRING },
                        compliance: { type: Type.STRING },
                        pricing: { type: Type.STRING }
                    },
                    required: ["differentiation", "compliance", "pricing"]
                }
            }
        });
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Strategy generation failed' });
    }
});

app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
});
