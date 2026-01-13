// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.28.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    
    // API Clients
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
    const googleKey = Deno.env.get('GOOGLE_API_KEY');
    
    // Qwen/Dashscope (Mapped to OpenAI compatible client or direct fetch)
    const qwenKey = Deno.env.get('QWEN_API_KEY') || Deno.env.get('DASHSCOPE_API_KEY');

    // Helper: Sanitize Content
    function sanitizeContent(text: string): string {
      return text
        .replace(/高潮/g, '愉悦巅峰')
        .replace(/自慰/g, '自我愉悦')
        .replace(/做爱/g, '亲密互动')
        .replace(/插入/g, '进入')
        .replace(/阴道/g, '私处')
        .replace(/阴茎/g, '男性器官')
        .replace(/射精/g, '释放')
        .replace(/G点/g, '敏感点')
        .replace(/乳头/g, '胸部敏感点')
        .replace(/阴蒂/g, '重点敏感部位');
    }

    // Helper: Ask AI
    async function askAI(prompt: string, schema: any) {
      // Helper: Call DeepSeek (OpenAI Compatible)
      async function callDeepSeek(prompt: string, schema: any) {
         if (!deepseekKey) throw new Error("DeepSeek Key missing");
         try {
             const openai = new OpenAI({
                 apiKey: deepseekKey,
                 baseURL: 'https://api.deepseek.com',
             });
             const completion = await openai.chat.completions.create({
                 messages: [
                     { role: "system", content: `You are a helpful assistant. Output JSON only matching this schema: ${JSON.stringify(schema)}` },
                     { role: "user", content: prompt }
                 ],
                 model: "deepseek-chat",
                 response_format: { type: "json_object" },
             });
             const content = completion.choices[0].message.content;
             return JSON.parse(content);
         } catch (e) {
             throw new Error(`DeepSeek Error: ${e.message}`);
         }
      }

      // Helper: Call Google (Gemini)
      async function callGoogle(prompt: string, schema: any) {
          if (!googleKey) throw new Error("Google Key missing");
          try {
              const genAI = new GoogleGenerativeAI(googleKey);
              const model = genAI.getGenerativeModel({ model: "gemini-pro" });
              const result = await model.generateContent(`
                  ${prompt}
                  
                  Strictly Output JSON only matching this schema: ${JSON.stringify(schema)}
              `);
              const response = result.response;
              let text = response.text();
              // Clean up if markdown code blocks exist
              text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              return JSON.parse(text);
          } catch (e) {
               throw new Error(`Google Gemini Error: ${e.message}`);
          }
      }

      // Helper: Call Qwen (Dashscope)
      async function callQwen(prompt: string, schema: any) {
           if (!qwenKey) throw new Error("Qwen Key missing");
           // Using Dashscope direct API for Qwen-Plus (most reliable for complex JSON)
            const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${qwenKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'qwen-plus',
                input: {
                  messages: [
                    { role: 'system', content: `你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的 JSON 对象：${JSON.stringify(schema)}。请确保所有 Key 名采用英文。` },
                    { role: 'user', content: prompt }
                  ]
                },
                parameters: {
                  result_format: 'message',
                  enable_search: true
                }
              })
            });
            
            const data = await response.json();
            if (data.output?.choices?.[0]?.message?.content) {
                let content = data.output.choices[0].message.content;
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(content);
            }
            if (data.code === 'DataInspectionFailed') {
                 throw new Error("Qwen DataInspectionFailed: Content Restricted");
            }
            throw new Error(`Qwen Error: ${JSON.stringify(data)}`);
      }

      let errors = [];

      // 1. Try Qwen (Primary)
      if (qwenKey) {
          try {
              console.log("Trying Qwen...");
              return await callQwen(prompt, schema);
          } catch (e) {
              console.error("Qwen Failed:", e);
              errors.push(e.message);
          }
      }

      // 2. Try DeepSeek (Fallback)
      if (deepseekKey) {
          try {
              console.log("Trying DeepSeek...");
              return await callDeepSeek(prompt, schema);
          } catch (e) {
              console.error("DeepSeek Failed:", e);
              errors.push(e.message);
          }
      }

      // 3. Try Google (Fallback)
      if (googleKey) {
          try {
              console.log("Trying Google Gemini...");
              return await callGoogle(prompt, schema);
          } catch (e) {
              console.error("Google Failed:", e);
              errors.push(e.message);
          }
      }

      throw new Error(`All AI Providers Failed:\n${errors.join('\n')}`);
    }

    // --- Route Handlers ---

    if (action === 'competitor') {
        const { companyName, isDomestic } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "domain": { "type": "string" },
                "philosophy": { "type": "array", "items": { "type": "string" } },
                "focus": { "type": "string", "enum": ["Male", "Female", "Unisex"] }, 
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

        const prompt = `You are a Professional Medical Device & Intimate Health Market Analyst. Please generate a professional competitive profile for the Intimate Wellness brand "${companyName}".

        Context: 
        ${isDomestic ? "Operates primarily in the Chinese Intimate Health market. Analyze using data/context from major Chinese e-commerce platforms." : "Operates in the International Intimate Health market. Analyze using global market data."}
        
        Output requirements (JSON format, Keys in English):
        1. domain: Official website domain.
        2. philosophy: Brand business philosophy (Array of strings, <100 chars each, max 3).
        3. focus: Target audience (Enum: 'Male', 'Female', 'Unisex').
        4. sentiment: Object containing scores (0-100) for:
           - material (Biocompatibility & Skin Safety)
           - noise (Acoustic Performance)
           - privacy (Packaging Privacy & Discrete Design)
           - easeOfUse (Ergonomics & App Interaction)
           - value (Cost-Benefit Ratio & Durability)
        5. foundedDate: Founding date ("YYYY-MM" or "YYYY"). Empty string if unknown.
        ${!isDomestic ? "6. country: Country of origin (e.g., USA, Japan, Germany). Empty if Chinese brand." : ""}
        7. description: Brief brand overview (<100 chars), summarizing core business/status.
        
        **IMPORTANT: All string values (philosophy, description, country) must be in Simplified Chinese. Return valid JSON only.**`;

        const data = await askAI(prompt, schema);
        if (!data.id || data.id === '1') {
             data.id = `comp-${Date.now()}`;
        }
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'analyze') {
        const { productName, reviews, isDomestic } = payload;
        const schema = {
             "type": "object",
             "properties": {
                 "pros": { "type": "array", "items": { "type": "string" } },
                 "cons": { "type": "array", "items": { "type": "string" } },
                 "summary": { "type": "string" },
                 "prosKeywords": { 
                    "type": "array", 
                    "items": { 
                        "type": "object", 
                        "properties": { 
                            "value": { "type": "string" }, 
                            "count": { "type": "number" } 
                        },
                        "required": ["value", "count"]
                    } 
                 },
                 "consKeywords": { 
                    "type": "array", 
                    "items": { 
                        "type": "object", 
                        "properties": { 
                            "value": { "type": "string" }, 
                            "count": { "type": "number" } 
                        },
                        "required": ["value", "count"]
                    } 
                 }
             },
             "required": ["pros", "cons", "summary", "prosKeywords", "consKeywords"]
        };

        const reviewTexts: string[] = [];
        let totalLikes = 0;
        let highLikeCount = 0;

        for (const review of reviews) {
            const likeCount = review.likeCount || 0;
            // Sanitize review text
            const sanitizedText = sanitizeContent(review.text);
            
            if (likeCount > 0) {
                totalLikes += likeCount;
                if (likeCount >= 5) highLikeCount++;
                reviewTexts.push(`[点赞量: ${likeCount}] ${sanitizedText}`);
            } else {
                reviewTexts.push(sanitizedText);
            }
        }
        
        const avgLikes = reviews.length > 0 ? (totalLikes / reviews.length).toFixed(1) : "0";

        const prompt = `You are a professional Medical Device & Consumer Health Product Analyst. Please analyze the following user feedback data for the product "${productName}" from a strictly professional, clinical, and objective perspective.

        Review Data:
        ${reviewTexts.join('\n')}
        
        Analysis Context:
        1. Each review may contain main comments and follow-ups. Analyze comprehensively.
        2. Focus on high-engagement feedback (high like counts) as they represent consensus.
        3. Statistics: ${reviews.length} reviews, ${totalLikes} total likes, ${avgLikes} avg likes, ${highLikeCount} high-value reviews.
        4. Maintain a strictly professional tone. Avoid prohibited explicit content. Use clinical terms where necessary.
        
        ${isDomestic ? "Context: Chinese market consumer preferences." : "Context: Global market consumer preferences. Input may be in English or other languages."}
        
        Output Requirements (JSON Format, Keys in English, Values in Simplified Chinese):
        1. pros: List of main product strengths (Array of Strings). Translate to Chinese if original is English.
        2. cons: List of main product weaknesses or complaints (Array of Strings). Translate to Chinese if original is English.
        3. summary: A brief competitiveness summary (String), citing user engagement levels. Must be in Chinese.
        4. prosKeywords: High-frequency positive keywords (Array of Objects: {value: string, count: number}). Value must be in Chinese.
        5. consKeywords: High-frequency negative keywords (Array of Objects: {value: string, count: number}). Value must be in Chinese.
        
        **IMPORTANT: All value strings must be in Simplified Chinese. Even if input is English, the output analysis must be translated to Chinese. Return valid JSON only.**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (action === 'strategy') {
        const { concept } = payload;
        const schema = {
            "type": "object",
            "properties": {
                "differentiation": { "type": "string" },
                "compliance": { "type": "string" },
                "pricing": { "type": "string" }
            },
            "required": ["differentiation", "compliance", "pricing"]
        };
        const prompt = `You are a Health Tech Venture Capitalist & Strategy Advisor. Please conduct a "Stress Test" on the following Intimate Health Startup Concept.

        Startup Concept:
        ${concept}
        
        Provide critical, direct advice from three dimensions (JSON format, values in Simplified Chinese):
        1. differentiation (Clinical/Market Viability): Is there true clinical or market differentiation, or is it a "Red Ocean" generic product?
        2. compliance (Regulatory & User Acquisition): Given strict content regulations for adult health products, what is the user acquisition strategy?
        3. pricing (Survival Model): Can the pricing strategy support the high cost of user education and acquisition in the health sector?
        
        Tone: Professional, Cold, Blunt, and Insightful.
        
        **Output must be valid JSON. All values must be in Simplified Chinese.**`;
        
        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'product-image') {
        const { config } = payload;
        
        let promptParts: string[] = [];
        if (config.category) promptParts.push(config.category);
        if (config.gender === 'male') promptParts.push('男性用品');
        else if (config.gender === 'female') promptParts.push('女性用品');
        
        if (config.material && config.material.length) promptParts.push(`材质：${config.material.join('、')}`);
        if (config.color && config.color.length) promptParts.push(`颜色：${config.color.join('、')}`);
        if (config.features) promptParts.push(`功能特点：${config.features}`);
        if (config.background) promptParts.push(`背景：${config.background}`);
        
        let details: string[] = [];
        if (config.drive && config.drive.length) details.push(`驱动系统：${config.drive.join('、')}`);
        if (config.heating && config.heating.length) details.push(`加热系统：${config.heating.join('、')}`);
        if (config.texture && config.texture.length) details.push(`纹理：${config.texture.join('、')}`);
        if (details.length) promptParts.push(details.join('，'));
        
        let prompt = promptParts.join('，') || '情趣用品产品概念图';
        prompt += '，产品设计图，专业产品摄影风格，白色背景，高清细节，3D渲染效果';

        // Try Google GenAI first
        if (googleKey) {
            try {
                const genAI = new GoogleGenerativeAI(googleKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
                const result = await model.generateContent(prompt);
                const response = result.response;
                 // Note: The google-genai node SDK might return inline data or just text. 
                 // For images, we typically request standard generation but 'gemini-2.5-flash-image' usage implies we might need specific handling?
                 // Wait, standard Gemini API generateContent returns text. For IMAGE GENERATION, it's a different endpoint/model (Imagen). 
                 // The Python code used `client.models.generate_content(model="gemini-2.5-flash-image")`. 
                 // Assuming the JS SDK handles this or we might need to check if 'gemini-2.5-flash-image' supports text-to-image via this method.
                 // Actually, usually Imagen is on Vertex AI. But if the user Python code worked with that model name, we try to replicate.
                 // However, simpler is to fallback to Qwen if we align with "serverless" and maybe standard text models don't do image gen directly broadly yet without specific config.
                 // Let's implement Qwen fallback primarily as it seems robust in Python code too.
                 // But wait, Python code successfully used `gemini-2.5-flash-image`. Key is: `part.as_image()`.
                 // In JS SDK: `response.text()` is for text. Image generation might not be via `generateContent` in JS SDK standardly for public API keys unless using updated libs.
                 // Let's rely on Qwen (Wan2.5) as primary for stability in this port if Google logic is tricky in Deno.
                 // But actually, Python code had: `client.models.generate_content`.
            } catch (e: any) {
                console.error("Google GenAI Image Gen failed", e);
            }
        }

        // Qwen Fallback (Wan2.5)
        // Using Direct Fetch to DashScope for Image Generation
        if (!qwenKey) {
            return new Response(JSON.stringify({ error: 'Qwen API Key not configured' }), { status: 500, headers: corsHeaders });
        }

        const qwenResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${qwenKey}`,
                'X-DashScope-Async': 'enable' // Usually image gen is async, returns a task_id
            },
            body: JSON.stringify({
                model: "wan2.5-t2i-preview",
                input: {
                    prompt: prompt
                },
                parameters: {
                    n: 1,
                    size: '1280*1280',
                    prompt_extend: true,
                    watermark: false,
                    seed: 12345
                }
            })
        });

        // Wan2.5 usually returns a task_id for async processing.
        // We need to poll for result.
        const qwenData = await qwenResponse.json();
        
        if (qwenData.output && qwenData.output.task_id) {
            const taskId = qwenData.output.task_id;
            // Poll for result
            let retries = 0;
            while (retries < 15) { // 30 seconds timeout approx (2s * 15)
                await new Promise(resolve => setTimeout(resolve, 2000));
                const statusRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
                    headers: { 'Authorization': `Bearer ${qwenKey}` }
                });
                const statusData = await statusRes.json();
                
                if (statusData.output && statusData.output.task_status === 'SUCCEEDED') {
                    if (statusData.output.results && statusData.output.results.length > 0) {
                        return new Response(JSON.stringify({ imageUrl: statusData.output.results[0].url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
                    break;
                }
                if (statusData.output && statusData.output.task_status === 'FAILED') {
                     throw new Error(`Image generation task failed: ${JSON.stringify(statusData.output)}`);
                }
                retries++;
            }
            throw new Error("Image generation timed out");
        } else {
             // Maybe it returned directly? (unlikely for Wan2.5 but check)
             if (qwenData.output && qwenData.output.results) {
                 return new Response(JSON.stringify({ imageUrl: qwenData.output.results[0].url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
             }
             throw new Error(`Qwen API Error: ${JSON.stringify(qwenData)}`);
        }
    }

    if (action === 'ocr-product') {
        const { image } = payload; // Expecting Base64 image string (data:image/jpeg;base64,...) or just base64
        
        if (!qwenKey) throw new Error("QWEN_API_KEY not found");

        // Format base64 to data URI if needed, or extract
        let base64Img = image;
        if (!image.startsWith('data:')) {
            // Assume jpeg if not specified, or just leave as is if Qwen accepts standard base64? 
            // Qwen VL messages expects: {"image": "https://..."} OR {"image": "data:image/..."}
             base64Img = `data:image/jpeg;base64,${image}`; 
        }

        const messages = [
            {
                "role": "system",
                "content": [
                    {"text": `你是一位电商数据录入助手。请分析商品图片，提取以下信息并以严格的 JSON 格式返回：
1. name: 商品名称 (String)
2. price: 价格 (Number, 提取主要显示价格)
3. category: 类别 (String, 必须是以下之一: 跳蛋, 震动棒, 伸缩棒, 缩阴球, AV棒, 飞机杯, 倒模, 按摩器, 训练器, 阴茎环, 其他)
4. tags: 标签 (Array of Strings, 提取3-5个关键卖点)
5. gender: 适用性别 (String, Enum: 'Male', 'Female', 'Unisex')

如果无法识别某项，请留空或使用默认值。直接返回 JSON，不要包含 Markdown 标记。`}
                ]
            },
            {
                "role": "user",
                "content": [
                    { "image": base64Img }, 
                    { "text": "请提取商品信息" }
                ]
            }
        ];

        const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${qwenKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen-vl-max", // Using qwen-vl-max for better OCR
                input: {
                    messages: messages
                },
                parameters: {
                    result_format: "message"
                }
            })
        });

        const data = await response.json();
        if (data.output && data.output.choices && data.output.choices.length > 0) {
            let content = data.output.choices[0].message.content[0].text;
             // Clean up JSON
            if (content.includes("```json")) {
                content = content.split("```json")[1].split("```")[0].trim();
            } else if (content.includes("```")) {
                content = content.split("```")[1].split("```")[0].trim();
            }
            return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
            throw new Error(`Qwen-VL Error: ${JSON.stringify(data)}`);
        }
    }
    if (action === 'price-analysis') {
        const { productName, priceHistory, currentPrice, isDomestic } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "trend": { "type": "string" },
                "priceRange": { "type": "string" },
                "fluctuation": { "type": "string" },
                "discountAnalysis": { "type": "string" },
                "recommendations": { "type": "array", "items": { "type": "string" } },
                "summary": { "type": "string" }
            },
            "required": ["trend", "priceRange", "fluctuation", "discountAnalysis", "recommendations", "summary"]
        };

        const finalPrices = priceHistory.map((h: any) => h.finalPrice || 0);
        // Calculate min, max, avg based on existing finalPrices or fallback to currentPrice
        const minPrice = finalPrices.length ? Math.min(...finalPrices) : currentPrice;
        const maxPrice = finalPrices.length ? Math.max(...finalPrices) : currentPrice;
        const avgPrice = finalPrices.length ? finalPrices.reduce((a: number, b: number) => a + b, 0) / finalPrices.length : currentPrice;
        
        const discounts: number[] = [];
        priceHistory.forEach((h: any) => {
            if (h.originalPrice && h.finalPrice) {
                const discount = ((h.originalPrice - h.finalPrice) / h.originalPrice) * 100;
                discounts.push(discount);
            }
        });

        const avgDiscount = discounts.length ? discounts.reduce((a: number, b: number) => a + b, 0) / discounts.length : 0;
        const maxDiscount = discounts.length ? Math.max(...discounts) : 0;
        const minDiscount = discounts.length ? Math.min(...discounts) : 0;
        const hasDiscount = discounts.length > 0;

        const priceData = priceHistory.map((h: any) => {
            let discountInfo = "";
            if (h.originalPrice && h.finalPrice) {
                const discount = ((h.originalPrice - h.finalPrice) / h.originalPrice) * 100;
                discountInfo = `, 优惠力度: ${discount.toFixed(1)}%`;
            }
            const originalPriceStr = h.originalPrice ? `, 页面价: ¥${h.originalPrice.toFixed(2)}` : "";
            return `日期: ${h.date}, 到手价: ¥${(h.finalPrice || 0).toFixed(2)}${originalPriceStr}${discountInfo}`;
        }).join('\n');

        let discountStats = "";
        if (hasDiscount) {
            discountStats = `
优惠力度统计：
- 平均优惠力度：${avgDiscount.toFixed(1)}%
- 最大优惠力度：${maxDiscount.toFixed(1)}%
- 最小优惠力度：${minDiscount.toFixed(1)}%
- 有优惠记录：${discounts.length} 条（共 ${priceHistory.length} 条记录）`;
        }
        
        const prompt = `You are a Medical Device Market Economist. Please analyze the price trend data for the following Intimate Health Product:

        Product: ${productName}
        Current Price: ¥${Number(currentPrice).toFixed(2)}

        History (${priceHistory.length} records):
        ${priceData}

        Statistics:
        - Min Price: ¥${minPrice.toFixed(2)}
        - Max Price: ¥${maxPrice.toFixed(2)}
        - Avg Price: ¥${avgPrice.toFixed(2)}
        - Volatility: ${minPrice !== 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(1) : "0.0"}%${discountStats}

        Context: ${isDomestic ? "Chinese Intimate Health Market (E-commerce strategies)." : "Global Intimate Health Market."}

        Output JSON Analysis Report (Keys in English, Values in Simplified Chinese):
        1. trend: Price trend analysis (200-300 chars, Chinese). Analyze volatility, timing, and market comparison.
        2. priceRange: Price positioning analysis (100-200 chars, Chinese). Low/Mid/High-end check.
        3. fluctuation: Volatility analysis (100-200 chars, Chinese). Frequency and promotional factors.
        4. discountAnalysis: Discount strategy analysis (150-250 chars, Chinese). Depth, frequency, and impact.
           ${!hasDiscount ? "(Note: No discount data available, state unable to analyze)." : ""}
        5. recommendations: Pricing strategy recommendations (Array of Strings, Chinese). Data-driven advice.
        6. summary: Executive summary (200-300 chars, Chinese).

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only.**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'brand-characteristics') {
        const { competitor, isDomestic } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "brandPositioning": { "type": "string" },
                "productCharacteristics": { "type": "string" },
                "priceStrategy": { "type": "string" },
                "targetAudience": { "type": "string" },
                "competitiveAdvantages": { "type": "array", "items": { "type": "string" } },
                "brandPersonality": { "type": "string" },
                "sloganCreativity": { "type": "string" },
                "summary": { "type": "string" },
                "wordCloudKeywords": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": { "type": "string" },
                            "count": { "type": "number" }
                        },
                        "required": ["value", "count"]
                    }
                }
            },
            "required": ["brandPositioning", "productCharacteristics", "priceStrategy", "targetAudience", "competitiveAdvantages", "brandPersonality", "sloganCreativity", "summary", "wordCloudKeywords"]
        };

        const brandName = competitor.name || '';
        const philosophy = competitor.philosophy || [];
        const products = competitor.products || [];
        const ads = competitor.ads || [];
        const focus = competitor.focus || '';

        const productCount = products.length;
        const categories: Record<string, number> = {};
        const priceRanges: number[] = [];
        const allTags: string[] = [];
        const genderDistribution: Record<string, number> = { 'Male': 0, 'Female': 0, 'Unisex': 0 };

        for (const product of products) {
            const category = product.category || '未分类';
            categories[category] = (categories[category] || 0) + 1;
            
            if (product.price > 0) priceRanges.push(product.price);
            
            if (Array.isArray(product.tags)) {
                allTags.push(...product.tags);
            }
            
            const gender = product.gender || 'Unisex';
            if (genderDistribution[gender] !== undefined) {
                genderDistribution[gender]++;
            }
        }

        const avgPrice = priceRanges.length ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length : 0;
        const minPrice = priceRanges.length ? Math.min(...priceRanges) : 0;
        const maxPrice = priceRanges.length ? Math.max(...priceRanges) : 0;

        let productInfo = `共 ${productCount} 款产品`;
        if (Object.keys(categories).length > 0) {
            const categoryList = Object.entries(categories).map(([k, v]) => `${k}(${v}款)`).join(', ');
            productInfo += `，类别分布：${categoryList}`;
        }
        if (priceRanges.length > 0) {
            productInfo += `\n价格区间：¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}，平均价格：¥${avgPrice.toFixed(2)}`;
        }
        if (allTags.length > 0) {
            const tagCounts: Record<string, number> = {};
            allTags.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1);
            const topTags = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag]) => tag);
            productInfo += `\n产品标签（前10）：${topTags.join(', ')}`;
        }

        let genderInfo = "";
        if (genderDistribution['Male'] > 0 || genderDistribution['Female'] > 0 || genderDistribution['Unisex'] > 0) {
            genderInfo = `产品性别分布：男用 ${genderDistribution['Male']} 款，女用 ${genderDistribution['Female']} 款，通用 ${genderDistribution['Unisex']} 款`;
        }

        const philosophyText = philosophy.length > 0 ? philosophy.map((p: string) => `- ${p}`).join('\n') : "暂无品牌理念";
        
        let focusText = "男女兼用市场";
        if (focus === "Female") focusText = "专攻女用市场";
        else if (focus === "Male") focusText = "专攻男用市场";

        let adsText = "暂无具体宣传文案信息";
        if (ads.length > 0) {
            adsText = ads.map((ad: any) => {
                let info = `- ${ad.text || ''}`;
                if (ad.highlights && ad.highlights.length) {
                    info += ` (卖点：${ad.highlights.join(', ')})`;
                }
                return info;
            }).join('\n');
        }

        const prompt = `You are an Intimate Health Brand Analyst. Please analyze the brand characteristics based on the following data:

        Brand Name: ${brandName}
        Type: ${isDomestic ? "Domestic Brand" : "International Brand"}
        Focus: ${focusText}

        Philosophy:
        ${philosophyText}

        Product Portfolio:
        ${productInfo}
        ${genderInfo}

        Ads/Creative:
        ${adsText}

        Context: ${isDomestic ? "Chinese Intimate Health Market (Preferences, Trends, Competitors)." : "Global Intimate Health Market."}

        Output JSON analysis report (Keys in English, Values in Simplified Chinese):
        1. brandPositioning: Brand positioning analysis (50-100 chars, Chinese). Market tier, philosophy alignment, differentiation.
        2. productCharacteristics: Product features analysis (50-100 chars, Chinese). Category mix, unique selling points (USPs).
        3. priceStrategy: Pricing strategy analysis (50-100 chars, Chinese). Positioning match, competitiveness.
        4. targetAudience: Target audience analysis (50-100 chars, Chinese). Demographics, spending power.
        5. competitiveAdvantages: List of competitive advantages (Array of strings, min 4, Chinese). Based on philosophy, product, price.
        6. brandPersonality: Brand personality description (50-100 chars, Chinese).
        7. sloganCreativity: Creative analysis (50-100 chars, Chinese). Evaluate existing creative or suggest improvements.
        8. summary: Comprehensive summary (100-150 chars, Chinese). Core competitiveness and market value.
        9. wordCloudKeywords: Keywords for word cloud (Array of Objects: {value: string, count: number}, 3-5 items).
           - value: Key term (2-4 Chinese chars).
           - count: Weight (1-10 integer).
           - **STRICTLY EXCLUDE stopwords, connectors, generic terms.** Focus on unique brand attributes.

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only.**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'analyze-qa') {
        const { text } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "painPoints": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "用户使用过程中遇到的具体问题、困难或抱怨"
                },
                "concerns": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "用户在购买前或使用中关心的核心点，如安全性、材质、隐私等"
                },
                "suggestions": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "基于痛点和关心点提出的具体改进建议"
                },
                "summary": {
                    "type": "string",
                    "description": "对用户问答数据的综合分析总结，概括主要矛盾和需求"
                }
            },
            "required": ["painPoints", "concerns", "suggestions", "summary"]
        };

        const truncatedText = text.substring(0, 15000);
        const prompt = `You are a Clinical User Experience Researcher. Please analyze the following user inquiries/comments to identify pain points and concerns from a medical/health perspective:

        User Data:
        ${truncatedText}

        Context:
        - "Purchased" users: Focus on usage experience, comfort, and efficacy (Pain Points).
        - "Returning" users: Focus on deeper needs or specific dissatisfactions (Concerns/Pain Points).
        - "Potential" users: Focus on pre-purchase anxieties, safety concerns, and material inquiries (Concerns).

        Output JSON Analysis Report (Keys in English, Values in Simplified Chinese):
        1. painPoints: List of user pain points (min 10, Chinese). Focus on physical discomfort, usability issues, or failed expectations.
        2. concerns: List of user concerns (min 10, Chinese). Focus on safety, hygiene, privacy, and material quality.
        3. suggestions: Professional improvement suggestions (min 10, Chinese). Focus on product design, educational content, or hygiene guidance.
        4. summary: Executive summary (150-200 chars, Chinese). Overview of user sentiment and critical issues.

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only. Maintain a professional, clinical tone.**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'knowledge-base') {
        const { query, products } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "productIds": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "相关产品的ID列表，按相关性排序"
                },
                "analysis": {
                    "type": "string",
                    "description": "对查询的分析说明，解释为什么这些产品相关"
                }
            },
            "required": ["productIds", "analysis"]
        };

        const productsSummary = products.map((item: any, index: number) => {
            const prod = item.product || {};
            const comp = item.competitor || {};
            const sales = prod.sales;
            let salesStr = '未知';
            if (sales) {
                salesStr = sales >= 10000 ? `${(sales / 10000).toFixed(1)}w+` : `${sales}+`;
            }
            
            const brandFocusStr = comp.focus === 'Female' ? '专攻女用' : (comp.focus === 'Male' ? '专攻男用' : '男女兼用');
            const analysisSummary = prod.analysis?.summary || '无';
            const launchDate = prod.launchDate || '未标注';
            const tags = (prod.tags || []).length > 0 ? prod.tags.join('、') : '无';

            return `产品 ${index + 1}:
- ID: ${prod.id}
- 名称: ${prod.name}
- 价格: ¥${prod.price}
- 类别: ${prod.category || '未分类'}
- 标签: ${tags}
- 销量: ${salesStr}
- 上市日期: ${launchDate}
- 所属品牌: ${comp.name}
- 品牌定位: ${brandFocusStr}
- 是否国内: ${comp.isDomestic ? '是' : '否'}
- 用户评价摘要: ${analysisSummary}
`;
        }).join('');

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

        2. **上市日期筛选规则**：
           - 如果查询中包含时间相关条件（如"近几年上市"、"2024年上市"、"2024年后上市"等），必须根据产品的"上市日期"字段进行筛选
           - 上市日期格式为"YYYY-MM"（如"2024-05"表示2024年5月）或"YYYY"（如"2024"表示2024年）
           - "近几年上市"通常指最近3-5年上市的产品，需要根据当前日期计算（当前是2025年）
           - 如果产品有上市日期信息，必须严格按照日期条件筛选；如果产品未标注上市日期（显示为"未标注"），则不能匹配时间相关条件
           - 不要假设或猜测产品的上市时间，只能使用明确标注的上市日期

        3. **精确匹配原则**：
           - 类别必须完全匹配，不能模糊匹配
           - 功能特性必须在标签或产品名称中明确体现
           - 时间条件必须与上市日期字段精确匹配
           - 不要包含"可能满足"、"相关性稍低但仍考虑"的产品

        4. **排除规则**：
           - 如果查询明确指定了类别（如"跳蛋"），则其他类别（如AV棒、震动棒）的产品不应包含在内
           - 如果查询明确指定了功能（如"加热"），则没有该功能标签的产品不应包含在内
           - 如果查询明确指定了时间条件（如"近几年上市"），则未标注上市日期或不符合时间条件的产品不应包含在内
           - 不要因为"可能满足其他功能需求"而包含不匹配的产品

        5. **如果没有任何产品完全匹配所有条件，请返回空数组，并在analysis中说明原因**

        请输出 JSON 格式的结果，包含：
        1. productIds: **完全符合所有条件**的产品ID数组（按相关性从高到低排序，最多返回10个）
        2. analysis: 对查询的分析说明（200-300字），解释：
           - 查询中包含哪些条件
           - 为什么这些产品符合所有条件
           - 如果结果为空，说明原因

        **请严格遵循以上规则，只返回完全匹配的产品。**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'product-analysis') {
        const { config, previousAnalysis } = payload;
        
        let optimizationContext = "";
        if (previousAnalysis) {
            optimizationContext = `
            ⚠️ CRITICAL OPTIMIZATION CONTEXT ⚠️
            This configuration is an OPTIMIZED revision designed to IMPROVE upon a previous version.
            
            Previous Analysis Baseline:
            - Cost Estimate: ${previousAnalysis.costEstimate}
            - Feasibility Score: ${previousAnalysis.feasibilityScore}
            - Technical Challenges: ${(previousAnalysis.technicalChallenges || []).join(', ')}

            STRICT REQUIREMENTS (NON-NEGOTIABLE):
            1. Cost Estimate MUST be STRICTLY LOWER than "${previousAnalysis.costEstimate}"
               - Cost hierarchy: Low < Medium < High < Premium
               - Your cost estimate MUST be better (lower in hierarchy) than the baseline
               - If previous was "High", new must be "Medium" or "Low"
               - If previous was "Medium", new must be "Low"
            
            2. Feasibility Score MUST be HIGHER than ${previousAnalysis.feasibilityScore}
               - The new score should reflect reduced manufacturing complexity and risk
            
            3. Technical Challenges MUST be FEWER or LESS SEVERE
               - Address the previous risks: ${(previousAnalysis.technicalChallenges || []).join(', ')}
            
            4. In "feasibilityRationale", you MUST explicitly state:
               - WHY the cost is lower (e.g., "simpler materials", "fewer components")
               - WHY feasibility improved (e.g., "eliminated conflicting processes")
               - HOW this configuration solves the previous challenges
            
            If the new configuration does NOT meet these requirements, you MUST still enforce them in your output.
            This is an optimization verification - the results MUST show improvement.
            `;
        }

        const schema = {
            "type": "object",
            "properties": {
                "feasibilityScore": { "type": "number" },
                "feasibilityRationale": { "type": "string" },
                "costEstimate": { "type": "string", "enum": ["Low", "Medium", "High", "Premium"] },
                "powerAnalysis": { "type": "string" },
                "designAesthetics": { "type": "string" },
                "technicalChallenges": { "type": "array", "items": { "type": "string" } },
                "manufacturingAdvice": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["feasibilityScore", "feasibilityRationale", "costEstimate", "powerAnalysis", "designAesthetics", "technicalChallenges", "manufacturingAdvice"]
        };

        const genderStr = config.gender === 'male' ? '男用' : '女用';
        const prompt = `
        ${optimizationContext}
        
        你是一位专注于成人健康用品的高级产品工程师和技术产品经理。
        请对以下产品配置进行可行性、成本和设计含义的分析。
        
        产品基础信息：
        - 目标性别: ${genderStr}
        - 产品品类: ${config.category}
        - 创作背景/故事: ${config.background || "无"}
        - 核心特征/卖点: ${config.features || "无"}

        技术规格配置（注意：用户可能选择了多个选项）：
        - 材质: ${(config.material || []).join(', ') || "无"}
        - 驱动系统: ${(config.drive || []).join(', ') || "无"}
        - 主控系统: ${(config.mainControl || []).join(', ') || "无"}
        - 加热系统: ${(config.heating || []).join(', ') || "无"}
        - 传感器系统: ${(config.sensors || []).join(', ') || "无"}
        - 电源系统: ${(config.power || []).join(', ') || "无"}
        - 设备辅助: ${(config.accessories || []).join(', ') || "无"}
        - 配色方案: ${(config.color || []).join(', ') || "未指定"}
        - 图纹/纹理: ${(config.texture || []).join(', ') || "未指定"}
        - 制造工艺: ${(config.process || []).join(', ') || "未指定"}
        - 通信协议: ${(config.protocol || []).join(', ') || "未指定"}

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

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'optimized-config') {
        const { currentConfig, analysis } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "gender": { "type": "string", "enum": ["male", "female"] },
                "category": { "type": "string" },
                "background": { "type": "string" },
                "features": { "type": "string" },
                "material": { "type": "array", "items": { "type": "string" } },
                "drive": { "type": "array", "items": { "type": "string" } },
                "mainControl": { "type": "array", "items": { "type": "string" } },
                "heating": { "type": "array", "items": { "type": "string" } },
                "sensors": { "type": "array", "items": { "type": "string" } },
                "power": { "type": "array", "items": { "type": "string" } },
                "accessories": { "type": "array", "items": { "type": "string" } },
                "color": { "type": "array", "items": { "type": "string" } },
                "texture": { "type": "array", "items": { "type": "string" } },
                "process": { "type": "array", "items": { "type": "string" } },
                "protocol": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["gender", "category", "background", "features", "material", "drive", "mainControl", "heating", "sensors", "power", "accessories", "color", "texture", "process", "protocol"]
        };

        const prompt = `
        作为资深产品专家，请基于当前的产品配置和已有的技术分析，生成一份**经过优化的**产品配置方案。
        
        当前配置：
        - 性别/品类: ${currentConfig.gender} / ${currentConfig.category}
        - 材质: ${(currentConfig.material || []).join(', ')}
        - 驱动系统: ${(currentConfig.drive || []).join(', ')}
        - 主控系统: ${(currentConfig.mainControl || []).join(', ')}
        - 加热系统: ${(currentConfig.heating || []).join(', ')}
        - 传感器系统: ${(currentConfig.sensors || []).join(', ')}
        - 电源系统: ${(currentConfig.power || []).join(', ')}
        - 设备辅助: ${(currentConfig.accessories || []).join(', ')}
        - 工艺: ${(currentConfig.process || []).join(', ')}
        - 图纹: ${(currentConfig.texture || []).join(', ')}
        - 协议: ${(currentConfig.protocol || []).join(', ')}
        
        已有分析指出的问题（供参考）：
        - 挑战: ${(analysis.technicalChallenges || []).join('; ')}
        - 建议: ${(analysis.manufacturingAdvice || []).join('; ')}
        
        优化目标：
        1. 解决上述提到的技术挑战（例如兼容性、散热、成本问题）。
        2. 提升产品的可制造性和市场竞争力。
        3. 保持原有的核心产品定位（用户性别和品类不变）。
        
        请输出完整的 JSON 配置对象，格式必须与输入完全一致。
        `;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'recommended-config') {
        const { requirements, gender } = payload;
        
        const featureMapping: Record<string, string> = {
            '震动': '需要驱动系统（马达）',
            '加热': '需要加热系统（PTC/石墨烯加热膜）+ 温度传感器',
            '智能控制': '需要蓝牙通信协议 + 手机APP辅助',
            '防水': '需要全包胶无缝工艺 + 密封设计',
            '温控': '需要相变温控材料或NTC温度传感器',
        };
        
        const batteryMapping: Record<string, string> = {
            'Short': '300mAh锂聚合物电池（续航1-2小时）',
            'Medium': '600mAh锂聚合物电池（续航2-4小时）',
            'Long': '1000mAh锂聚合物电池（续航4-6小时）',
        };

        const schema = {
            "type": "object",
            "properties": {
                "gender": { "type": "string", "enum": ["male", "female"] },
                "category": { "type": "string" },
                "background": { "type": "string" },
                "features": { "type": "string" },
                "material": { "type": "array", "items": { "type": "string" } },
                "drive": { "type": "array", "items": { "type": "string" } },
                "mainControl": { "type": "array", "items": { "type": "string" } },
                "heating": { "type": "array", "items": { "type": "string" } },
                "sensors": { "type": "array", "items": { "type": "string" } },
                "power": { "type": "array", "items": { "type": "string" } },
                "accessories": { "type": "array", "items": { "type": "string" } },
                "color": { "type": "array", "items": { "type": "string" } },
                "texture": { "type": "array", "items": { "type": "string" } },
                "process": { "type": "array", "items": { "type": "string" } },
                "protocol": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["gender", "category", "background", "features", "material", "drive", "mainControl", "heating", "sensors", "power", "accessories", "color", "texture", "process", "protocol"]
        };

        const mustHave = requirements.mustHaveFeatures || [];
        const mustHaveDesc = mustHave.map((f: string) => `  * ${f}: ${featureMapping[f] || ''}`).join('\n');
        
        const prompt = `
        你是一位资深的成人用品工程师，请根据用户的需求生成一套**成本最优**的产品配置方案。

        ## 用户需求
        - 目标性别: ${gender === 'male' ? '男性' : '女性'}
        - 产品品类: ${requirements.category || (gender === 'male' ? '由你根据需求自动选择（飞机杯/前列腺按摩器/震动环等）' : '由你根据需求自动选择（震动棒/跳蛋/吮吸器等）')}
        - 预算水平: ${requirements.budget}
        - 必备功能: ${mustHave.join(', ')} 
          ${mustHaveDesc}
        - 续航要求: ${requirements.batteryLife} - ${batteryMapping[requirements.batteryLife] || ''}
        - 尺寸限制: ${requirements.sizeConstraint}
        - 特殊偏好: ${(requirements.specialPreferences || []).join(', ')}
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
        1. category 符合目标性别（男性: 飞机杯/前列腺按摩器/阴茎环等; 女性: 震动棒/跳蛋/吮吸器等）
        2. background 和 features 简洁描述设计理念和核心卖点
        3. 所有数组字段（material, drive, mainControl, etc.）至少包含一个选项
        4. 确保选择的组件能满足所有必备功能
        5. 成本与预算水平匹配

        注意：直接返回JSON，不要有任何额外的解释文字。
        `;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'compare') {
        const { products } = payload;
        const productIds = products.map((p: any) => p.id).join(', ');
        
        const schema = {
            "type": "object",
            "properties": {
                "winnerName": { "type": "string" },
                "bestValueReason": { "type": "string" },
                "comparisonScores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "productId": { "type": "string" },
                            "totalScore": { "type": "number" },
                            "dimensions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "label": { "type": "string" },
                                        "score": { "type": "number" },
                                        "reason": { "type": "string" },
                                        "deduction": { "type": "string" }
                                    },
                                    "required": ["label", "score", "reason"]
                                }
                            }
                        },
                        "required": ["productId", "totalScore", "dimensions"]
                    }
                },
                "summary": { "type": "string" }
            },
            "required": ["winnerName", "bestValueReason", "comparisonScores", "summary"]
        };

        const prompt = `你是一位专业的情趣用品产品专家。请对以下几款情趣用品进行深度 PK 对比分析：
        ${JSON.stringify(products)}
        
        请输出 JSON 格式的详细对比结果，包含以下英文键名：
        1. winnerName: 最终胜出的情趣用品产品名称（必须是比较产品中的名称之一）。
        2. bestValueReason: 为什么该产品被认为是最佳选择（性价比/体验/创新）的详细理由。
        3. comparisonScores: 一个对象数组，每个对象代表一个产品的得分情况，数组长度必须等于产品数量（${products.length}个）：
           - productId: 产品 ID（必须是 ${productIds} 之一）
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

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'competitor-report') {
        const { ownProduct, competitorProducts, isDomestic } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "comparison": { "type": "string" },
                "ownAdvantages": { "type": "array", "items": { "type": "string" } },
                "ownWeaknesses": { "type": "array", "items": { "type": "string" } },
                "competitorAdvantages": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "productName": { "type": "string" },
                            "advantages": { "type": "array", "items": { "type": "string" } }
                        }
                    }
                },
                "improvementSuggestions": { "type": "array", "items": { "type": "string" } },
                "marketStrategy": { "type": "string" },
                "summary": { "type": "string" }
            },
            "required": ["comparison", "ownAdvantages", "ownWeaknesses", "competitorAdvantages", "improvementSuggestions", "marketStrategy"]
        };

        const competitorInfo = competitorProducts.map((item: any) => {
            const comp = item.competitor || {};
            const prod = item.product || {};
            const analysis = prod.analysis ? `\n  用户评价：${JSON.stringify(prod.analysis)}` : '';
            const tags = (prod.tags || []).length > 0 ? prod.tags.join('、') : '无标签';
            return `- ${prod.name || ''} (${comp.name || ''}，¥${prod.price || 0}，${prod.category || '未分类'})：${tags}${analysis}`;
        });

        const competitorInfoStr = competitorInfo.join('\n');
        const ownDesc = ownProduct.description ? `- 产品描述：${ownProduct.description}` : '';
        const ownTags = (ownProduct.tags || []).length > 0 ? ownProduct.tags.join('、') : '无';

        const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下自身产品与竞品进行深度对比分析：

        自身产品信息：
        - 产品名称：${ownProduct.name}
        - 价格：¥${ownProduct.price}
        - 产品类型：${ownProduct.category || '未分类'}
        - 核心卖点/标签：${ownTags}
        ${ownDesc}

        竞品信息：
        ${competitorInfoStr}

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

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'deep-report') {
        const { product, competitor, isDomestic } = payload;
        
        const schema = {
             "type": "object",
             "properties": {
                 "productOverview": {
                     "type": "object",
                     "properties": {
                         "name": { "type": "string" },
                         "price": { "type": "number" },
                         "category": { "type": "string" },
                         "tags": { "type": "array", "items": { "type": "string" } },
                         "competitorName": { "type": "string" }
                     }
                 },
                 "marketPosition": {
                     "type": "object",
                     "properties": {
                         "positioning": { "type": "string" },
                         "targetAudience": { "type": "string" },
                         "priceSegment": { "type": "string" }
                     }
                 },
                 "strengths": { "type": "array", "items": { "type": "string" } },
                 "weaknesses": { "type": "array", "items": { "type": "string" } },
                 "opportunities": { "type": "array", "items": { "type": "string" } },
                 "threats": { "type": "array", "items": { "type": "string" } },
                 "competitiveAdvantages": { "type": "array", "items": { "type": "string" } },
                 "improvementSuggestions": { "type": "array", "items": { "type": "string" } },
                 "summary": { "type": "string" }
             },
             "required": ["productOverview", "marketPosition", "strengths", "weaknesses", "opportunities", "threats", "competitiveAdvantages", "improvementSuggestions", "summary"]
        };

        const brandFocus = competitor.focus === 'Female' ? '专攻女用' : (competitor.focus === 'Male' ? '专攻男用' : '男女兼用');
        const philosophy = competitor.philosophy ? `- 品牌理念：${competitor.philosophy.join('；')}` : '';
        const analysisStr = product.analysis ? `- 用户评价分析：${JSON.stringify(product.analysis)}` : '';
        const tags = (product.tags || []).length > 0 ? product.tags.join('、') : '无';

        const prompt = `你是一位专业的情趣用品行业市场分析师。请对以下收藏产品进行深度竞品报告分析：

        产品信息：
        - 产品名称：${product.name}
        - 价格：¥${product.price}
        - 产品类型：${product.category || '未分类'}
        - 标签：${tags}
        - 所属品牌：${competitor.name}
        - 品牌官网：${competitor.domain || '未设置'}
        - 品牌定位：${brandFocus}
        ${philosophy}
        ${analysisStr}

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

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }



    if (action === 'standardize-analysis') {
        const { productName, description, parameters, reviews, isDomestic } = payload;
        
        const schema = {
            "type": "object",
            "properties": {
                "sensoryIndices": {
                    "type": "object",
                    "properties": {
                        "penetrationIndex": { "type": "number", "description": "1-10 scale" },
                        "penetrationReasoning": { "type": "string", "description": "Explanation for the score" },
                        "penetrationDeductions": { "type": "string", "description": "List of deduction points" },
                        "acousticPrivacy": { "type": "number", "description": "1-10 scale" },
                        "acousticPrivacyReasoning": { "type": "string", "description": "Explanation for the score" },
                        "acousticPrivacyDeductions": { "type": "string", "description": "List of deduction points" },
                        "skinAffinity": { "type": "number", "description": "1-10 scale" },
                        "skinAffinityReasoning": { "type": "string", "description": "Explanation for the score" },
                        "skinAffinityDeductions": { "type": "string", "description": "List of deduction points" }
                    },
                    "required": ["penetrationIndex", "penetrationReasoning", "penetrationDeductions", "acousticPrivacy", "acousticPrivacyReasoning", "acousticPrivacyDeductions", "skinAffinity", "skinAffinityReasoning", "skinAffinityDeductions"]
                },
                "complianceCheck": {
                    "type": "object",
                    "properties": {
                        "biocompatibilityLevel": { "type": "string", "enum": ["医用级", "食品级", "工业/玩具级"] },
                        "ergonomicsScore": { "type": "number", "description": "1-10 scale" },
                        "safetyFlags": { "type": "array", "items": { "type": "string" } }
                    },
                    "required": ["biocompatibilityLevel", "ergonomicsScore", "safetyFlags"]
                },
                "specVerification": {
                    "type": "object",
                    "properties": {
                        "realityScore": { "type": "number", "description": "1-10 scale" },
                        "marketingNoise": { "type": "array", "items": { "type": "string" } }
                    },
                    "required": ["realityScore", "marketingNoise"]
                }
            },
            "required": ["sensoryIndices", "complianceCheck", "specVerification"]
        };

        const truncatedReviews = reviews ? reviews.slice(0, 20).map((r: any) => r.text).join('\n') : "No reviews available.";
        // Sanitize review content for standardization analysis as well
        const sanitizedReviews = sanitizeContent(truncatedReviews);
        
        const prompt = `You are a Medical Device Standards Engineer & Sensory Science Analyst. Please standardize and quantify the following product data:

        Product: ${productName}
        Description: ${description || "N/A"}
        Parameters: ${JSON.stringify(parameters || {})}
        User Feedback Sample:
        ${sanitizedReviews}

        Context: ${isDomestic ? "Chinese Market Standards" : "International Standards"}

        Task: Convert vague marketing terms and user feelings into standardized metrics.

        Output Requirements (JSON):
        1. sensoryIndices:
           - penetrationIndex (1-10): 1=Surface vibration, 10=Deep tissue resonance.
           - penetrationReasoning: Explain why this score was given based on motor parameters or user feedback (30-50 words, Chinese).
           - penetrationDeductions: List specific negative factors that reduced the score from 10. IMPORTANT: The total points deducted MUST equal (10 - penetrationIndex). e.g., if score is 6, list deductions totaling -4 (e.g., "-2: Weak motor; -2: Surface vibration only").
           - acousticPrivacy (1-10): 1=Loud/High-pitch, 10=Silent/Deep-tone.
           - acousticPrivacyReasoning: Explain noise levels and pitch based on feedback or specs (30-50 words, Chinese).
           - acousticPrivacyDeductions: List specific negative factors. IMPORTANT: Total deducted MUST equal (10 - acousticPrivacy). (e.g., "-2: High pitch whine; -1: >50dB").
           - skinAffinity (1-10): 1=Sticky/Rough, 10=Silky/Skin-like.
           - skinAffinityReasoning: Explain material feel and quality based on user reviews (30-50 words, Chinese).
           - skinAffinityDeductions: List specific negative factors. IMPORTANT: Total deducted MUST equal (10 - skinAffinity). (e.g., "-1: Dust magnet; -2: Mould lines").
        2. complianceCheck:
           - biocompatibilityLevel: Assess material safety using one of: "医用级", "食品级", "工业/玩具级".
           - ergonomicsScore (1-10): Anatomical fit evaluation.
           - safetyFlags: List potential risks in Chinese (e.g., "非孔隙材质", "边缘锐利").
        3. specVerification:
           - realityScore (1-10): Match between marketing claims and user reality.
           - marketingNoise: Identify pseudoscientific buzzwords in Chinese (e.g., "量子", "费洛蒙").

        **IMPORTANT: Return valid JSON only. All string fields (except keys) MUST be in Chinese.**`;

        const data = await askAI(prompt, schema);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (action === "analyze-thought") {
        const { content } = payload;
        const prompt = `
        You are a Senior Product Strategist and Innovation Consultant specializing in the adult industry.
        You are analyzing a fragmented thought or idea from a product manager's "Thinking Wall".

        Thought Content: "${content}"

        Your Goal: Expand this thought into a structured insight, challenge it, and provide actionable next steps.

        Output Requirements (JSON):
        {
          "coreConcept": "Refine the thought into a clear, professional concept title (max 10 words)",
          "deepInsight": "Analyze the underlying implication, key trends, or user psychology behind this thought (30-50 words)",
          "blindSpots": ["List 1 or 2 potential risks, overlooked factors, or counter-arguments"],
          "actionableSteps": ["List 2-3 concrete steps to validate or implement this idea"],
          "innovationAngle": "Propose one creative twist or 'What If' scenario to push this idea further"
        }

        Language: Chinese (Professional, insightful, encouraging).
        `;

        const data = await askAI(prompt, null); // No schema validation for now or use simplified schema
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown Action' }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { status: 500, headers: corsHeaders });
  }
});
