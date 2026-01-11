import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/deno";
import { DB } from "./db.ts";
import { askAI } from "./ai_service.ts";

const app = new Hono();

app.use("*", cors());

// --- Status ---
app.get("/api/status", (c) => c.json({ status: "ok" }));

// --- Competitors ---
app.get("/api/competitors", async (c) => {
  const data = await DB.getCompetitors();
  return c.json(data);
});
app.post("/api/competitors", async (c) => {
  const data = await c.req.json();
  await DB.saveCompetitors(data);
  return c.json({ success: true });
});

// --- History ---
app.get("/api/comparison-history", async (c) => {
  const data = await DB.getHistory();
  return c.json(data);
});
app.post("/api/comparison-history", async (c) => {
  const record = await c.req.json();
  if (!record.id || !record.analysis) {
      return c.json({ error: "Invalid record" }, 400);
  }
  await DB.saveHistory(record);
  return c.json({ success: true });
});
app.delete("/api/comparison-history/:id", async (c) => {
  const id = c.req.param("id");
  await DB.deleteHistory(id);
  return c.json({ success: true });
});
app.delete("/api/comparison-history", async (c) => {
    await DB.clearHistory();
    return c.json({ success: true });
});

// --- Deep Reports ---
app.get("/api/deep-reports", async (c) => {
  const data = await DB.getDeepReports();
  return c.json(data);
});
app.post("/api/deep-reports", async (c) => {
  const report = await c.req.json();
  await DB.saveDeepReport(report);
  return c.json({ success: true });
});
app.delete("/api/deep-reports/:id", async (c) => {
  const id = c.req.param("id");
  await DB.deleteDeepReport(id);
  return c.json({ success: true });
});
app.delete("/api/deep-reports", async (c) => {
    await DB.clearDeepReports();
    return c.json({ success: true });
});

// --- Favorites ---
app.get("/api/favorites", async (c) => {
  const data = await DB.getFavorites();
  return c.json(data);
});
app.post("/api/favorites", async (c) => {
  const data = await c.req.json();
  await DB.saveFavorites(data);
  return c.json({ success: true });
});

// --- AI Endpoints ---

// 1. Generate Competitor
app.post("/api/ai/competitor", async (c) => {
  const { companyName, isDomestic } = await c.req.json();
  
  const schema = {
        "type": "object",
        "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "domain": { "type": "string" },
            "philosophy": { "type": "array", "items": { "type": "string" } },
            "focus": { "type": "string" }, 
            "sentiment": { 
                "type": "object",
                "properties": {
                    "material": { "type": "number" },
                    "noise": { "type": "number" },
                    "privacy": { "type": "number" },
                    "easeOfUse": { "type": "number" },
                    "value": { "type": "number" }
                }
            },
            "foundedDate": { "type": "string" },
            "country": { "type": "string" },
            "description": { "type": "string" }
        }
  };

  let prompt = `你是一位专业的情趣用品行业市场分析师。请为情趣用品品牌 "${companyName}" 生成一份专业的竞品画像。
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
    5. foundedDate: 品牌的创立日期，格式为 "YYYY-MM"（如 "2020-01"）或 "YYYY"（如 "2020"）。如果无法确定具体日期，请使用年份格式 "YYYY"。如果完全无法确定，可以返回空字符串 ""。
  `;

  if (!isDomestic) {
      prompt += `\n    6. country: 品牌所在国家（仅用于国际品牌，如：美国、日本、德国、英国等）。如果是中国品牌，返回空字符串。`;
  }
  prompt += `\n    7. description: 品牌简单说明（100字以内），概括品牌的核心业务、市场地位或特色。` + `\n    \n    输出必须是合法的 JSON 格式。`;

  const data = await askAI(prompt, schema);
  if (!data.id || data.id === '1') {
      data.id = `comp-${Date.now()}`;
  }
  return c.json(data);
});

// 2. Analyze Reviews
app.post("/api/ai/analyze", async (c) => {
    const { productName, reviews, isDomestic } = await c.req.json();
    
    const schema = {
        "type": "object",
        "properties": {
            "pros": { "type": "array", "items": { "type": "string" } },
            "cons": { "type": "array", "items": { "type": "string" } },
            "summary": { "type": "string" },
            "prosKeywords": { "type": "array", "items": { "type": "object", "properties": { "value": { "type": "string" }, "count": { "type": "number" } } } },
            "consKeywords": { "type": "array", "items": { "type": "object", "properties": { "value": { "type": "string" }, "count": { "type": "number" } } } }
        },
        "required": ["pros", "cons", "summary", "prosKeywords", "consKeywords"]
    };

    const reviewTexts = reviews.map((r: any) => {
        if (r.likeCount > 0) return `[点赞量: ${r.likeCount}] ${r.text}`;
        return r.text;
    });

    const prompt = `你是一位专业的情趣用品行业用户体验分析师。请分析情趣用品 "${productName}" 的以下用户评价数据：
    ${reviewTexts.join("\n")}
    
    ${isDomestic ? "请结合中国市场的消费习惯和语境。" : "请结合全球市场的消费语境。"}
    
    请输出 JSON 格式的深度分析报告，包含以下英文键名（但所有字符串值必须使用简体中文）：
    1. pros: (Array of Strings) 优点列表
    2. cons: (Array of Strings) 缺点列表
    3. summary: (String) 总结
    4. prosKeywords: (Array of Objects) 好评关键词
    5. consKeywords: (Array of Objects) 差评关键词
    
    重要：所有字符串值必须使用简体中文。`;

    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 3. Compare Products
app.post("/api/ai/compare", async (c) => {
    const { products } = await c.req.json();
    const productIds = products.map((p: any) => p.id);

    const schema = {
        "type": "object",
        "properties": {
            "winnerName": { "type": "string" },
            "bestValueReason": { "type": "string" },
            "comparisonScores": {
                "type": "array",
                "items": { "type": "object", "properties": {
                    "productId": { "type": "string" },
                    "totalScore": { "type": "number" },
                    "dimensions": { "type": "array", "items": { "type": "object", "properties": { "label": { "type": "string" }, "score": { "type": "number" }, "reason": { "type": "string" }, "deduction": { "type": "string" } } } }
                } }
            },
            "summary": { "type": "string" }
        }
    };

    const prompt = `你是一位专业的情趣用品产品专家。请对以下几款情趣用品进行深度 PK 对比分析：
    ${JSON.stringify(products)}
    
    请输出 JSON 格式的详细对比结果，包含winnerName, bestValueReason, comparisonScores(productId, name, totalScore, dimensions 8个维度: 外观/核心功能/价格/市场渠道/差异化竞争点/用户好评/需优化点/综合评价), summary。`;

    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 4. Competitor Report
app.post("/api/ai/competitor-report", async (c) => {
    const req = await c.req.json();
    
    const schema = {
        "type": "object",
        "properties": {
            "comparison": { "type": "string" },
            "ownAdvantages": { "type": "array", "items": { "type": "string" } },
            "ownWeaknesses": { "type": "array", "items": { "type": "string" } },
            "competitorAdvantages": { "type": "array", "items": { "type": "object", "properties": { "productName": { "type": "string" }, "advantages": { "type": "array", "items": { "type": "string" } } } } },
            "improvementSuggestions": { "type": "array", "items": { "type": "string" } },
            "marketStrategy": { "type": "string" },
            "summary": { "type": "string" }
        }
    };

    const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下自身产品与竞品进行深度对比分析：
    自身产品：${JSON.stringify(req.ownProduct)}
    竞品：${JSON.stringify(req.competitorProducts)}
    
    请输出 JSON 格式的竞品分析报告。
    `;

    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 5. Deep Report
app.post("/api/ai/deep-report", async (c) => {
    const req = await c.req.json();
    const schema = {
        "type": "object",
        "properties": {
            "productOverview": { "type": "object", "properties": { "name": { "type": "string" }, "price": { "type": "number" }, "category": { "type": "string" }, "tags": { "type": "array", "items": { "type": "string" } }, "competitorName": { "type": "string" } } },
            "marketPosition": { "type": "object", "properties": { "positioning": { "type": "string" }, "targetAudience": { "type": "string" }, "priceSegment": { "type": "string" } } },
            "strengths": { "type": "array", "items": { "type": "string" } },
            "weaknesses": { "type": "array", "items": { "type": "string" } },
            "opportunities": { "type": "array", "items": { "type": "string" } },
            "threats": { "type": "array", "items": { "type": "string" } },
            "competitiveAdvantages": { "type": "array", "items": { "type": "string" } },
            "improvementSuggestions": { "type": "array", "items": { "type": "string" } },
            "summary": { "type": "string" }
        }
    };

    const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下收藏产品进行深度竞品报告分析：
    产品：${JSON.stringify(req.product)}
    品牌：${JSON.stringify(req.competitor)}
    
    输出详细 JSON 报告。`;

    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 6. Strategy
app.post("/api/ai/strategy", async (c) => {
    const { concept } = await c.req.json();
    const schema = {
        "type": "object",
        "properties": {
            "differentiation": { "type": "string" },
            "compliance": { "type": "string" },
            "pricing": { "type": "string" }
        }
    };
    const prompt = `你是一位专业的情趣用品行业创业导师。请对以下情趣用品创业概念进行“压力测试”：
    ${concept}
    请从 可行性、合规性、定价 三个维度给出批判性建议。`;
    
    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 7. Knowledge Base
app.post("/api/ai/knowledge-base", async (c) => {
    const req = await c.req.json();
    const schema = {
        "type": "object",
        "properties": {
            "productIds": { "type": "array", "items": { "type": "string" } },
            "analysis": { "type": "string" }
        }
    };

    const prompt = `你是一位专业的情趣用品行业产品知识库分析师。用户查询：
    "${req.query}"
    
    产品库摘要：${req.products.map((item: any, i: number) => `(${i}) ${item.product.name} ${JSON.stringify(item.product.tags)} ${item.product.category}`).join("\n")}
    
    请严格筛选符合条件的产品，返回 productIds 和分析。`;

    const data = await askAI(prompt, schema);
    return c.json(data);
});

// 8. OCR Product (Stub for now as it requires file upload handling)
app.post("/api/ai/ocr-product", async (c) => {
    // Handling multipart form data in Hono
    // const body = await c.req.parseBody();
    // const file = body['file']; 
    // This requires Qwen-VL integration which uses DashScope SDK in Python. 
    // Direct REST API for Qwen-VL binary upload is complicated.
    // For now, return error or mock stub. 
    return c.json({ error: "OCR feature pending implementation in Deno" }, 501);
});

// --- Static Assets (Frontend) ---
app.use("/*", serveStatic({ root: "../dist" }));

// --- SPA Fallback ---
app.get("*", serveStatic({ path: "../dist/index.html" }));

Deno.serve(app.fetch);
