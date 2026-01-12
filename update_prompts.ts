
const path = "/Users/taptaq/Documents/初心路/项目/情趣用品竞品分析系统/supabase/functions/ai-api/index.ts";
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

async function updateFile() {
  const data = await Deno.readFile(path);
  let content = decoder.decode(data);

  // 1. Update Price Analysis Prompt (approx lines 562-602)
  // We match the start of the prompt and the end marker
  const pricePromptRegex = /const prompt = `你是一位专业的情趣用品行业价格分析师[\s\S]*?请确保分析专业、深入且具有实际参考价值。`;/;
  
  const newPricePrompt = `const prompt = \`You are a Medical Device Market Economist. Please analyze the price trend data for the following Intimate Health Product:

        Product: \${productName}
        Current Price: ¥\${Number(currentPrice).toFixed(2)}

        History (\${priceHistory.length} records):
        \${priceData}

        Statistics:
        - Min Price: ¥\${minPrice.toFixed(2)}
        - Max Price: ¥\${maxPrice.toFixed(2)}
        - Avg Price: ¥\${avgPrice.toFixed(2)}
        - Volatility: \${minPrice !== 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(1) : "0.0"}%\${discountStats}

        Context: \${isDomestic ? "Chinese Intimate Health Market (E-commerce strategies)." : "Global Intimate Health Market."}

        Output JSON Analysis Report (Keys in English, Values in Simplified Chinese):
        1. trend: Price trend analysis (200-300 chars, Chinese). Analyze volatility, timing, and market comparison.
        2. priceRange: Price positioning analysis (100-200 chars, Chinese). Low/Mid/High-end check.
        3. fluctuation: Volatility analysis (100-200 chars, Chinese). Frequency and promotional factors.
        4. discountAnalysis: Discount strategy analysis (150-250 chars, Chinese). Depth, frequency, and impact.
           \${!hasDiscount ? "(Note: No discount data available, state unable to analyze)." : ""}
        5. recommendations: Pricing strategy recommendations (Array of Strings, Chinese). Data-driven advice.
        6. summary: Executive summary (200-300 chars, Chinese).

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only.**\`;`;

  if (pricePromptRegex.test(content)) {
    content = content.replace(pricePromptRegex, newPricePrompt);
    console.log("Successfully replaced Price Analysis Prompt");
  } else {
    console.error("Failed to find Price Analysis Prompt");
  }

  // 2. Update Brand Characteristics Prompt (approx lines 709-782)
  const brandPromptRegex = /const prompt = `你是一位专业的情趣用品行业品牌分析师[\s\S]*?请确保分析专业、深入且具有实际参考价值，要结合品牌理念、产品特征和价格等因素进行综合分析。`;/;
  
  const newBrandPrompt = `const prompt = \`You are an Intimate Health Brand Analyst. Please analyze the brand characteristics based on the following data:

        Brand Name: \${brandName}
        Type: \${isDomestic ? "Domestic Brand" : "International Brand"}
        Focus: \${focusText}

        Philosophy:
        \${philosophyText}

        Product Portfolio:
        \${productInfo}
        \${genderInfo}

        Ads/Creative:
        \${adsText}

        Context: \${isDomestic ? "Chinese Intimate Health Market (Preferences, Trends, Competitors)." : "Global Intimate Health Market."}

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

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only.**\`;`;

  if (brandPromptRegex.test(content)) {
    content = content.replace(brandPromptRegex, newBrandPrompt);
    console.log("Successfully replaced Brand Characteristics Prompt");
  } else {
    console.error("Failed to find Brand Characteristics Prompt");
  }

  // 3. Update Analyze QA Prompt (approx lines 818-834)
  const qaPromptRegex = /const prompt = `你是一位专业的用户体验分析师。请分析以下用户问答\/评论数据[\s\S]*? \*\*所有输出必须使用简体中文。\*\*`;/;
  
  const newQaPrompt = `const prompt = \`You are a Clinical User Experience Researcher. Please analyze the following user inquiries/comments to identify pain points and concerns from a medical/health perspective:

        User Data:
        \${truncatedText}

        Context:
        - "Purchased" users: Focus on usage experience, comfort, and efficacy (Pain Points).
        - "Returning" users: Focus on deeper needs or specific dissatisfactions (Concerns/Pain Points).
        - "Potential" users: Focus on pre-purchase anxieties, safety concerns, and material inquiries (Concerns).

        Output JSON Analysis Report (Keys in English, Values in Simplified Chinese):
        1. painPoints: List of user pain points (min 10, Chinese). Focus on physical discomfort, usability issues, or failed expectations.
        2. concerns: List of user concerns (min 10, Chinese). Focus on safety, hygiene, privacy, and material quality.
        3. suggestions: Professional improvement suggestions (min 10, Chinese). Focus on product design, educational content, or hygiene guidance.
        4. summary: Executive summary (150-200 chars, Chinese). Overview of user sentiment and critical issues.

        **IMPORTANT: All value strings must be in Simplified Chinese. Return valid JSON only. Maintain a professional, clinical tone.**\`;`;

  if (qaPromptRegex.test(content)) {
    content = content.replace(qaPromptRegex, newQaPrompt);
    console.log("Successfully replaced Analyze QA Prompt");
  } else {
    console.error("Failed to find Analyze QA Prompt");
  }

  await Deno.writeFile(path, encoder.encode(content));
}

updateFile();
