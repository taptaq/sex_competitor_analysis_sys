import { OpenAI } from "openai";

// Environment variables
const QWEN_API_KEY = Deno.env.get("QWEN_API_KEY") || Deno.env.get("DASHSCOPE_API_KEY");
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

// Clients
let deepseekClient: OpenAI | null = null;
if (DEEPSEEK_API_KEY) {
  deepseekClient = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: DEEPSEEK_API_KEY,
  });
}

// Qwen client integration (using REST API for simplicity as dashscope-node might be heavy or not fully compatible with Deno directly without npm specifiers)
// But Deno supports npm specifiers. Let's try direct fetch for Qwen to ensure control over retries.

export async function askAI(promptInput: string | object, schema: object): Promise<any> {
  const promptStr = typeof promptInput === "string" ? promptInput : JSON.stringify(promptInput);
  
  const providers: Array<{ name: string; call: () => Promise<any> }> = [];

  // 1. Qwen Provider (Direct Fetch)
  if (QWEN_API_KEY) {
    providers.push({
      name: "Qwen",
      call: async () => {
        const messages = [
            { role: "system", content: `你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的 JSON 对象：${JSON.stringify(schema)}。请确保所有 Key 名采用英文。` },
            { role: "user", content: promptStr }
        ];

        const maxRetries = 3;
        const retryDelay = 2000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${QWEN_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "qwen-plus",
                        input: { messages: messages },
                        parameters: {
                            result_format: "message",
                            enable_search: true
                        }
                    })
                });

                if (!response.ok) {
                     const errorText = await response.text();
                     throw new Error(`Qwen API failed: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                let content = data.output.choices[0].message.content;
                
                // Markdown cleanup
                if (content.includes("```json")) {
                    content = content.split("```json")[1].split("```")[0].trim();
                } else if (content.includes("```")) {
                    content = content.split("```")[1].split("```")[0].trim();
                }

                return JSON.parse(content);
            } catch (error) {
                 console.error(`[Qwen] Attempt ${attempt + 1} failed: ${error}`);
                 if (attempt < maxRetries - 1) {
                     await new Promise(r => setTimeout(r, retryDelay * (attempt + 1))); // access backoff
                     continue;
                 }
                 throw error;
            }
        }
      }
    });
  }

  // 2. DeepSeek Provider
  if (deepseekClient) {
    providers.push({
      name: "DeepSeek",
      call: async () => {
         const messages = [
            { role: "system", content: `你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的有效 JSON 字符串：${JSON.stringify(schema)}。请直接返回 JSON 内容，不要包含 Markdown 代码块标记。` },
            { role: "user", content: promptStr }
        ];

        // @ts-ignore
        const response = await deepseekClient.chat.completions.create({
            model: "deepseek-chat",
            messages: messages as any,
            response_format: { type: "json_object" }
        });

        let content = response.choices[0].message.content?.trim();
        if (!content) throw new Error("DeepSeek returned empty content");
        
        if (content.startsWith('```')) {
            content = content.replace('```json', '').replace('```', '');
        }
        
        return JSON.parse(content);
      }
    });
  }

  // Execute
  for (const provider of providers) {
      try {
          console.log(`[AI] Attempting ${provider.name}...`);
          return await provider.call();
      } catch (err) {
          console.error(`[AI] ${provider.name} failed: ${err}`);
          continue;
      }
  }

  throw new Error("All configured AI services failed");
}
