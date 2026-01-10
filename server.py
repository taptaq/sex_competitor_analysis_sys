import os
import json
import time
import asyncio
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from pathlib import Path
import shutil
import tempfile

from fastapi import FastAPI, HTTPException, Request, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
from pydantic import BaseModel

import dashscope
from openai import OpenAI
import requests
from google import genai
from PIL import Image
import io
import base64

# Load env vars
env_loaded_local = load_dotenv(dotenv_path='.env.local')
env_loaded = load_dotenv()  # fallback to .env

# Debug: Print env loading status
if not env_loaded_local and not env_loaded:
    print("[WARNING] No .env.local or .env file found. API keys may not be loaded.")

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / 'competitors.json'
HISTORY_FILE = BASE_DIR / 'comparison_history.json'
DEEP_REPORTS_FILE = BASE_DIR / 'deep_reports.json'
FAVORITES_FILE = BASE_DIR / 'favorites.json'

# Initialize App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys and Clients
QWEN_API_KEY = os.getenv('QWEN_API_KEY') or os.getenv('DASHSCOPE_API_KEY')
if QWEN_API_KEY:
    dashscope.api_key = QWEN_API_KEY
    print(f"[INFO] QWEN_API_KEY loaded: {QWEN_API_KEY[:10]}...")
else:
    print("[WARNING] QWEN_API_KEY not found. Qwen features will not work.")

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
if DEEPSEEK_API_KEY:
    print(f"[INFO] DEEPSEEK_API_KEY loaded: {DEEPSEEK_API_KEY[:10]}...")
else:
    print("[WARNING] DEEPSEEK_API_KEY not found. DeepSeek features will not work.")

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    print(f"[INFO] GOOGLE_API_KEY loaded: {GOOGLE_API_KEY[:10]}...")
else:
    print("[WARNING] GOOGLE_API_KEY not found. Google GenAI features will not work.")

deepseek_client = None
if DEEPSEEK_API_KEY:
    deepseek_client = OpenAI(
        base_url='https://api.deepseek.com',
        api_key=DEEPSEEK_API_KEY
    )

# --- Helper Functions ---

def ensure_file_exists(file_path: Path):
    if not file_path.exists():
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump([], f)

for f in [DATA_FILE, HISTORY_FILE, DEEP_REPORTS_FILE, FAVORITES_FILE]:
    ensure_file_exists(f)

def read_json_file(file_path: Path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []

def write_json_file(file_path: Path, data: Any):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save data to {file_path.name}")

async def ask_ai(prompt_input: Union[str, Dict], schema: Dict) -> Dict:
    prompt_str = prompt_input if isinstance(prompt_input, str) else json.dumps(prompt_input, ensure_ascii=False)
    
    providers = []

    print(f"QWEN_API_KEY: {QWEN_API_KEY}")

    # Qwen Provider
    if QWEN_API_KEY:
        async def call_qwen():
            messages = [
                {'role': 'system', 'content': f'你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的 JSON 对象：{json.dumps(schema, ensure_ascii=False)}。请确保所有 Key 名采用英文。'},
                {'role': 'user', 'content': prompt_str}
            ]
            
            # 添加重试机制处理 SSL 连接问题
            max_retries = 3
            retry_delay = 2  # 秒
            
            for attempt in range(max_retries):
                try:
                    response = dashscope.Generation.call(
                        model="qwen-plus",
                        messages=messages,
                        result_format='message',  # set the result to be "message" format.
                        enable_search=True
                    )
                    
                    if response.status_code == 200:
                        content = response.output.choices[0].message.content
                        # Attempt to extract JSON if it's wrapped in markdown
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                             content = content.split("```")[1].split("```")[0].strip()
                        return json.loads(content)
                    else:
                        error_msg = f"Qwen API failed: {response.code} - {response.message}"
                        if attempt < max_retries - 1:
                            print(f"[Qwen] Attempt {attempt + 1} failed: {error_msg}, retrying...")
                            await asyncio.sleep(retry_delay)
                            continue
                        raise Exception(error_msg)
                        
                except Exception as e:
                    error_str = str(e)
                    # 检查是否是 SSL 相关错误
                    if "SSL" in error_str or "SSLError" in error_str or "EOF" in error_str:
                        if attempt < max_retries - 1:
                            print(f"[Qwen] SSL error on attempt {attempt + 1}: {error_str}, retrying in {retry_delay}s...")
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2  # 指数退避
                            continue
                        else:
                            print(f"[Qwen] SSL error after {max_retries} attempts: {error_str}")
                            raise Exception(f"Qwen API SSL connection failed after {max_retries} attempts: {error_str}")
                    else:
                        # 非 SSL 错误直接抛出
                        raise
        
        providers.append({'name': 'Qwen', 'call': call_qwen})

    # DeepSeek Provider
    if deepseek_client:
        async def call_deepseek():
            messages = [
                {'role': 'system', 'content': f'你是一位专业分析师。输出必须且只能是符合此 JSON Schema 的有效 JSON 字符串：{json.dumps(schema, ensure_ascii=False)}。请直接返回 JSON 内容，不要包含 Markdown 代码块标记（如 ```json）。'},
                {'role': 'user', 'content': prompt_str}
            ]
            response = deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            if not content:
                raise Exception("DeepSeek returned empty content")
            
            if content.startswith('```'):
                content = content.replace('```json', '').replace('```', '')
            
            return json.loads(content)

        providers.append({'name': 'DeepSeek', 'call': call_deepseek})

    # Execute providers
    for provider in providers:
        try:
            print(f"[AI] Attempting {provider['name']}...")
            return await provider['call']()
        except Exception as err:
            print(f"[AI] {provider['name']} failed: {err}")
            continue
            
    raise HTTPException(status_code=500, detail="All configured AI services returned incorrect results or are unavailable")

# --- Endpoints ---

@app.get("/api/status")
async def get_status():
    return {"status": "ok"}

# 1. Competitors Data
@app.get("/api/competitors")
async def get_competitors():
    return read_json_file(DATA_FILE)

@app.post("/api/competitors")
async def save_competitors(data: List[Dict] = Body(...)):
    write_json_file(DATA_FILE, data)
    return {"success": True}

# 2. Comparison History
@app.get("/api/comparison-history")
async def get_history():
    return read_json_file(HISTORY_FILE)

@app.post("/api/comparison-history")
async def save_history(record: Dict = Body(...)):
    if 'id' not in record or 'timestamp' not in record or 'analysis' not in record:
        raise HTTPException(status_code=400, detail="Invalid record format")
    
    history = read_json_file(HISTORY_FILE)
    history.insert(0, record)
    if len(history) > 100:
        history = history[:100]
    
    write_json_file(HISTORY_FILE, history)
    return {"success": True}

@app.delete("/api/comparison-history/{record_id}")
async def delete_history_item(record_id: str):
    history = read_json_file(HISTORY_FILE)
    history = [r for r in history if r.get('id') != record_id]
    write_json_file(HISTORY_FILE, history)
    return {"success": True}

@app.delete("/api/comparison-history")
async def clear_history():
    write_json_file(HISTORY_FILE, [])
    return {"success": True}

# 3. Deep Reports
@app.get("/api/deep-reports")
async def get_deep_reports():
    return read_json_file(DEEP_REPORTS_FILE)

@app.post("/api/deep-reports")
async def save_deep_report(report: Dict = Body(...)):
    if 'productId' not in report or 'competitorId' not in report or 'report' not in report:
        raise HTTPException(status_code=400, detail="Invalid report format")
    
    reports = read_json_file(DEEP_REPORTS_FILE)
    existing_index = next((i for i, r in enumerate(reports) if r['productId'] == report['productId'] and r['competitorId'] == report['competitorId']), -1)
    
    now = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    
    if existing_index >= 0:
        reports[existing_index].update(report)
        reports[existing_index]['updatedAt'] = now
    else:
        report['createdAt'] = now
        report['updatedAt'] = now
        reports.append(report)
        
    write_json_file(DEEP_REPORTS_FILE, reports)
    return {"success": True}

@app.delete("/api/deep-reports/{product_id}")
async def delete_deep_report(product_id: str):
    reports = read_json_file(DEEP_REPORTS_FILE)
    reports = [r for r in reports if r.get('productId') != product_id]
    write_json_file(DEEP_REPORTS_FILE, reports)
    return {"success": True}

@app.delete("/api/deep-reports")
async def clear_deep_reports():
    write_json_file(DEEP_REPORTS_FILE, [])
    return {"success": True}

# 4. Favorites
@app.get("/api/favorites")
async def get_favorites():
    return read_json_file(FAVORITES_FILE)

@app.post("/api/favorites")
async def save_favorites(favorites: List[Dict] = Body(...)):
    write_json_file(FAVORITES_FILE, favorites)
    return {"success": True}

# --- AI Endpoints ---

# AI 1. Generate Competitor Data
class CompetitorRequest(BaseModel):
    companyName: str
    isDomestic: bool = True

@app.post("/api/ai/competitor")
async def ai_competitor(req: CompetitorRequest):
    brand_name = req.companyName
    is_domestic = req.isDomestic
    
    schema = {
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
            "country": { "type": "string" }
        }
    }

    prompt = f"""你是一位专业的情趣用品行业市场分析师。请为情趣用品品牌 "{brand_name}" 生成一份专业的竞品画像。
    {"该品牌主要在中国情趣用品市场运营，请结合国内电商平台（如淘宝、天猫、京东、小红书等）的数据和语境进行分析。" if is_domestic else "该品牌在国际情趣用品市场运营，请结合全球市场数据进行分析。"}
    
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
    5. foundedDate: 品牌的创立日期，格式为 "YYYY-MM"（如 "2020-01"）或 "YYYY"（如 "2020"）。如果无法确定具体日期，请使用年份格式 "YYYY"。如果完全无法确定，可以返回空字符串 ""。"""
    
    country_instruction = ""
    if not is_domestic:
        country_instruction = "\n    6. country: 品牌所在国家（仅用于国际品牌，如：美国、日本、德国、英国等）。如果是中国品牌，返回空字符串。"
    
    prompt += country_instruction + "\n    \n    输出必须是合法的 JSON 格式。"""

    data = await ask_ai(prompt, schema)
    if 'id' not in data or data['id'] == '1':
        data['id'] = f"comp-{int(time.time() * 1000)}"
    return data

# AI 2. Analyze Reviews
class ReviewItem(BaseModel):
    text: str
    likeCount: Optional[int] = None

class AnalyzeRequest(BaseModel):
    productName: str
    reviews: List[ReviewItem]
    isDomestic: bool = True

@app.post("/api/ai/analyze")
async def ai_analyze(req: AnalyzeRequest):
    schema = {
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
    }

    # 格式化评论数据，包含文本和点赞量
    reviewTexts = []
    totalLikes = 0
    highLikeCount = 0
    
    for review in req.reviews:
        likeCount = review.likeCount or 0
        if likeCount > 0:
            totalLikes += likeCount
            if likeCount >= 5:  # 点赞量>=10的评论视为高点赞评论
                highLikeCount += 1
            reviewTexts.append(f"[点赞量: {likeCount}] {review.text}")
        else:
            reviewTexts.append(review.text)
    
    avgLikes = totalLikes / len(req.reviews) if req.reviews else 0
    
    prompt = f"""你是一位专业的情趣用品行业用户体验分析师。请分析情趣用品 "{req.productName}" 的以下用户评价数据：
    {chr(10).join(reviewTexts)}
    
    注意：
    1. 每条评论可能包含主评论和追评内容（如追评1、追评2、追评3等），请综合分析主评论和所有追评内容，全面了解用户的真实体验和反馈。
    2. 评论数据中标注了每条评论的点赞量（如 [点赞量: 15]），点赞量高的评论通常代表更多用户的认同，请重点关注高点赞量评论中的观点和反馈。
    3. 统计信息：共 {len(req.reviews)} 条评论，总点赞量 {totalLikes}，平均点赞量 {avgLikes:.1f}，高点赞量评论（≥5）共 {highLikeCount} 条。
    4. 在分析时，请优先考虑高点赞量评论中的观点，这些观点往往更能代表大多数用户的真实感受。
    
    {"请结合中国市场的消费习惯和语境。" if req.isDomestic else "请结合全球市场的消费语境。"}
    
    请输出 JSON 格式的深度分析报告，包含以下英文键名（但所有字符串值必须使用简体中文）：
    1. pros: 该款情趣用品的主要优点列表 (Array of Strings，每个字符串必须使用中文)，优先参考高点赞量评论中的正面反馈。
    2. cons: 该款情趣用品的主要改进点或吐槽点列表 (Array of Strings，每个字符串必须使用中文)，优先参考高点赞量评论中的负面反馈。
    3. summary: 对该情趣用品整体竞争力的简短总结 (String，必须使用中文)，需结合点赞量数据说明用户认可度。
    4. prosKeywords: 好评点中的高频词列表 (Array of Objects with {{value: string, count: number}}，value 字段必须使用中文)，优先提取高点赞量评论中的关键词。
    5. consKeywords: 差评点中的高频词列表 (Array of Objects with {{value: string, count: number}}，value 字段必须使用中文)，优先提取高点赞量评论中的关键词。
    
    **重要：所有字符串值（pros 数组中的每个元素、cons 数组中的每个元素、summary、prosKeywords 和 consKeywords 数组中每个对象的 value 字段）都必须使用简体中文，不要使用英文。**"""

    return await ask_ai(prompt, schema)

# AI 4. Deep Product Comparison (Keeping numerical order from JS if possible, but JS had weird order)
class CompareRequest(BaseModel):
    products: List[Dict]

@app.post("/api/ai/compare")
async def ai_compare(req: CompareRequest):
    products = req.products
    productIds = [p.get('id') for p in products]
    
    schema = {
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
    }

    prompt = f"""你是一位专业的情趣用品产品专家。请对以下几款情趣用品进行深度 PK 对比分析：
    {json.dumps(products, ensure_ascii=False)}
    
    请输出 JSON 格式的详细对比结果，包含以下英文键名：
    1. winnerName: 最终胜出的情趣用品产品名称（必须是比较产品中的名称之一）。
    2. bestValueReason: 为什么该产品被认为是最佳选择（性价比/体验/创新）的详细理由。
    3. comparisonScores: 一个对象数组，每个对象代表一个产品的得分情况，数组长度必须等于产品数量（{len(products)}个）：
       - productId: 产品 ID（必须是 {", ".join(map(str, productIds))} 之一）
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
    - comparisonScores 数组必须包含所有 {len(products)} 个产品
    - 每个产品的 dimensions 数组必须包含且仅包含上述8个维度，顺序和名称必须完全一致
    - 维度名称必须使用中文："外观"、"核心功能"、"价格"、"市场渠道"、"差异化竞争点"、"用户好评"、"需优化点"、"综合评价" """

    return await ask_ai(prompt, schema)

# AI 6. Competitor Report Analysis
class CompetitorReportRequest(BaseModel):
    ownProduct: Dict
    competitorProducts: List[Dict]
    isDomestic: bool = True

@app.post("/api/ai/competitor-report")
async def ai_competitor_report(req: CompetitorReportRequest):
    schema = {
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
    }
    
    competitor_info = []
    for item in req.competitorProducts:
        comp = item.get('competitor', {})
        prod = item.get('product', {})
        analysis = f"\n  用户评价：{json.dumps(prod.get('analysis'))}" if prod.get('analysis') else ''
        competitor_info.append(f"- {prod.get('name')} ({comp.get('name')}，¥{prod.get('price')}，{prod.get('category', '未分类')})：{chr(12289).join(prod.get('tags', []) or '无标签')}{analysis}")
    
    competitor_info_str = "\n".join(competitor_info)
    own_desc = f"- 产品描述：{req.ownProduct.get('description')}" if req.ownProduct.get('description') else ''

    prompt = f"""你是一位专业的情趣用品行业市场分析师。请对以下自身产品与竞品进行深度对比分析：

自身产品信息：
- 产品名称：{req.ownProduct.get('name')}
- 价格：¥{req.ownProduct.get('price')}
- 产品类型：{req.ownProduct.get('category') or '未分类'}
- 核心卖点/标签：{chr(12289).join(req.ownProduct.get('tags', []) or ['无'])}
{own_desc}

竞品信息：
{competitor_info_str}

{"请结合中国情趣用品市场的实际情况，包括电商平台（淘宝、天猫、京东、小红书等）的竞争环境。" if req.isDomestic else "请结合全球情趣用品市场的竞争环境。"}

请输出 JSON 格式的竞品分析报告，包含以下英文键名：
1. comparison: 自身产品与竞品的整体对比分析（200-300字）
2. ownAdvantages: 自身产品相比竞品的优势列表（Array of Strings，至少3条）
3. ownWeaknesses: 自身产品相比竞品的劣势列表（Array of Strings，至少3条）
4. competitorAdvantages: 竞品优势分析（Array of Objects，每个对象包含 productName 和 advantages 数组）
5. improvementSuggestions: 针对自身产品的改进建议（Array of Strings，至少3条）
6. marketStrategy: 市场策略建议（200-300字，包括定价策略、市场定位、差异化方向等）
7. summary: 综合总结（可选，100-200字）

请确保分析专业、深入且具有实际参考价值。"""

    return await ask_ai(prompt, schema)

# AI 5. Deep Competitor Report for Favorite Product
class DeepReportRequest(BaseModel):
    product: Dict
    competitor: Dict
    isDomestic: bool = True

@app.post("/api/ai/deep-report")
async def ai_deep_report(req: DeepReportRequest):
    p = req.product
    c = req.competitor
    
    schema = {
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
    }

    brand_focus = '专攻女用' if c.get('focus') == 'Female' else ('专攻男用' if c.get('focus') == 'Male' else '男女兼用')
    philosophy = f"- 品牌理念：{'；'.join(c.get('philosophy', []))}" if c.get('philosophy') else ''
    analysis_str = f"- 用户评价分析：{json.dumps(p.get('analysis'))}" if p.get('analysis') else ''

    prompt = f"""你是一位专业的情趣用品行业市场分析师。请对以下收藏产品进行深度竞品报告分析：

产品信息：
- 产品名称：{p.get('name')}
- 价格：¥{p.get('price')}
- 产品类型：{p.get('category') or '未分类'}
- 标签：{chr(12289).join(p.get('tags', []) or ['无'])}
- 所属品牌：{c.get('name')}
- 品牌官网：{c.get('domain') or '未设置'}
- 品牌定位：{brand_focus}
{philosophy}
{analysis_str}

{"请结合中国情趣用品市场的实际情况，包括电商平台（淘宝、天猫、京东、小红书等）的竞争环境。" if req.isDomestic else "请结合全球情趣用品市场的竞争环境。"}

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

请确保分析专业、深入且具有实际参考价值。"""

    return await ask_ai(prompt, schema)

# AI 3. Strategy Advice
class StrategyRequest(BaseModel):
    concept: str

@app.post("/api/ai/strategy")
async def ai_strategy(req: StrategyRequest):
    schema = {
        "type": "object",
        "properties": {
            "differentiation": { "type": "string" },
            "compliance": { "type": "string" },
            "pricing": { "type": "string" }
        },
        "required": ["differentiation", "compliance", "pricing"]
    }

    prompt = f"""你是一位专业的情趣用品行业创业导师。请对以下情趣用品创业概念进行“压力测试”：
    
    创业概念：
    {req.concept}
    
    请从以下三个维度给出最直接、且带有批判性的建议：
    1. 可行性压力测试 (differentiation)：你的产品真的有差异化吗？还是只是在红海里挣扎？
    2. 流量与获客壁垒 (compliance)：在严苛的内容监管和隐私限制下，你如何寻找流量洼地？
    3. 定价与生存模型 (pricing)：你的定价策略能否支撑起昂贵的获客成本？
    
    你的语气应该是专业、冷静且一针见血的（Professional, Cold, Blunt）。
    
    输出必须严格符合 JSON 格式。"""

    return await ask_ai(prompt, schema)

# AI 6. Product Knowledge Base Query (Wait, there was 6 in JS too, duplicated numbering in comment)
class KBRequest(BaseModel):
    query: str
    products: List[Dict]

@app.post("/api/ai/knowledge-base")
async def ai_knowledge_base(req: KBRequest):
    schema = {
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
    }

    products_summary = []
    for index, item in enumerate(req.products):
        prod = item.get('product', {})
        comp = item.get('competitor', {})
        sales = prod.get('sales')
        sales_str = '未知'
        if sales:
           sales_str = f"{(sales / 10000):.1f}w+" if sales >= 10000 else f"{sales:n}+"
        
        brand_focus_str = '专攻女用' if comp.get('focus') == 'Female' else ('专攻男用' if comp.get('focus') == 'Male' else '男女兼用')
        analysis_summary = prod.get('analysis', {}).get('summary', '无') if prod.get('analysis') else '无'
        
        launch_date = prod.get('launchDate', '')
        launch_date_str = '未标注' if not launch_date else launch_date
        
        products_summary.append(f"""产品 {index + 1}:
- ID: {prod.get('id')}
- 名称: {prod.get('name')}
- 价格: ¥{prod.get('price')}
- 类别: {prod.get('category') or '未分类'}
- 标签: {chr(12289).join(prod.get('tags', []) or ['无'])}
- 销量: {sales_str}
- 上市日期: {launch_date_str}
- 所属品牌: {comp.get('name')}
- 品牌定位: {brand_focus_str}
- 是否国内: {'是' if comp.get('isDomestic') else '否'}
- 用户评价摘要: {analysis_summary}
""")

    prompt = f"""你是一位专业的情趣用品行业产品知识库分析师。用户提出了以下查询：

"{req.query}"

以下是知识库中的所有产品信息：

{"".join(products_summary)}

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

**请严格遵循以上规则，只返回完全匹配的产品。**"""

    return await ask_ai(prompt, schema)


# AI 8. Product OCR (Qwen-VL)
@app.post("/api/ai/ocr-product")
async def ai_ocr_product(file: UploadFile = File(...)):
    if not QWEN_API_KEY:
        raise HTTPException(status_code=500, detail="QWEN_API_KEY not found")

    # Save uploaded file to temp
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Construct prompt for Qwen-VL
        # Note: Qwen-VL in DashScope usually uses MultiModalConversation, but let's check basic generation or just use the OpenAI-compatible interface if possible? 
        # The existing code uses dashscope.Generation.call for text.
        # For VL, we typically use dashscope.MultiModalConversation.call
        
        # Schema for output
        schema = {
            "name": "Product Name",
            "price": 100,
            "category": "跳蛋", 
            "tags": ["tag1", "tag2"],
            "gender": "Female"
        }
        
        messages = [
            {
                "role": "system",
                "content": [
                    {"text": f"你是一位电商数据录入助手。请分析商品图片，提取以下信息并以严格的 JSON 格式返回：\n1. name: 商品名称 (String)\n2. price: 价格 (Number, 提取主要显示价格)\n3. category: 类别 (String, 必须是以下之一: 跳蛋, 震动棒, 伸缩棒, 缩阴球, AV棒, 飞机杯, 倒模, 按摩器, 训练器, 阴茎环, 其他)\n4. tags: 标签 (Array of Strings, 提取3-5个关键卖点)\n5. gender: 适用性别 (String, Enum: 'Male', 'Female', 'Unisex')\n\n如果无法识别某项，请留空或使用默认值。直接返回 JSON，不要包含 Markdown 标记。"}
                ]
            },
            {
                "role": "user",
                "content": [
                    {"image": f"file://{tmp_path}"},
                    {"text": "请提取商品信息"}
                ]
            }
        ]

        # 添加重试机制处理 SSL 连接问题
        max_retries = 3
        retry_delay = 2
        response = None
        
        for attempt in range(max_retries):
            try:
                response = dashscope.MultiModalConversation.call(
                    api_key=QWEN_API_KEY,
                    model='qwen3-vl-plus',
                    messages=messages,
                    result_format='message'
                )
                break  # 成功则跳出循环
            except Exception as e:
                error_str = str(e)
                if ("SSL" in error_str or "SSLError" in error_str or "EOF" in error_str) and attempt < max_retries - 1:
                    print(f"[Qwen-VL] SSL error on attempt {attempt + 1}: {error_str}, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    raise

        if response and response.status_code == 200:
            content = response.output.choices[0].message.content[0]['text']
            # Clean up JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
        else:
            raise Exception(f"Qwen-VL Failed: {response.code} - {response.message}")

    except Exception as e:
        print(f"OCR Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# AI 7. ProductForge: Generate Product Analysis
class ProductAnalysisRequest(BaseModel):
    config: Dict
    previousAnalysis: Optional[Dict] = None

@app.post("/api/ai/product-analysis")
async def ai_product_analysis(req: ProductAnalysisRequest):
    config = req.config
    prev = req.previousAnalysis
    
    optimization_context = ""
    if prev:
        optimization_context = f"""
      ⚠️ CRITICAL OPTIMIZATION CONTEXT ⚠️
      This configuration is an OPTIMIZED revision designed to IMPROVE upon a previous version.
      
      Previous Analysis Baseline:
      - Cost Estimate: {prev.get('costEstimate')}
      - Feasibility Score: {prev.get('feasibilityScore')}
      - Technical Challenges: {', '.join(prev.get('technicalChallenges', []))}

      STRICT REQUIREMENTS (NON-NEGOTIABLE):
      1. Cost Estimate MUST be STRICTLY LOWER than "{prev.get('costEstimate')}"
         - Cost hierarchy: Low < Medium < High < Premium
         - Your cost estimate MUST be better (lower in hierarchy) than the baseline
         - If previous was "High", new must be "Medium" or "Low"
         - If previous was "Medium", new must be "Low"
      
      2. Feasibility Score MUST be HIGHER than {prev.get('feasibilityScore')}
         - The new score should reflect reduced manufacturing complexity and risk
      
      3. Technical Challenges MUST be FEWER or LESS SEVERE
         - Address the previous risks: {', '.join(prev.get('technicalChallenges', []))}
      
      4. In "feasibilityRationale", you MUST explicitly state:
         - WHY the cost is lower (e.g., "simpler materials", "fewer components")
         - WHY feasibility improved (e.g., "eliminated conflicting processes")
         - HOW this configuration solves the previous challenges
      
      If the new configuration does NOT meet these requirements, you MUST still enforce them in your output.
      This is an optimization verification - the results MUST show improvement.
    """

    schema = {
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
    }

    gender_str = '男用' if config.get('gender') == 'male' else '女用'
    prompt = f"""
    {optimization_context}
    
    你是一位专注于成人健康用品的高级产品工程师和技术产品经理。
    请对以下产品配置进行可行性、成本和设计含义的分析。
    
    产品基础信息：
    - 目标性别: {gender_str}
    - 产品品类: {config.get('category')}
    - 创作背景/故事: {config.get('background') or "无"}
    - 核心特征/卖点: {config.get('features') or "无"}

    技术规格配置（注意：用户可能选择了多个选项）：
    - 材质: {', '.join(config.get('material', [])) or "无"}
    - 驱动系统: {', '.join(config.get('drive', [])) or "无"}
    - 主控系统: {', '.join(config.get('mainControl', [])) or "无"}
    - 加热系统: {', '.join(config.get('heating', [])) or "无"}
    - 传感器系统: {', '.join(config.get('sensors', [])) or "无"}
    - 电源系统: {', '.join(config.get('power', [])) or "无"}
    - 设备辅助: {', '.join(config.get('accessories', [])) or "无"}
    - 配色方案: {', '.join(config.get('color', [])) or "未指定"}
    - 图纹/纹理: {', '.join(config.get('texture', [])) or "未指定"}
    - 制造工艺: {', '.join(config.get('process', [])) or "未指定"}
    - 通信协议: {', '.join(config.get('protocol', [])) or "未指定"}

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
    """

    return await ask_ai(prompt, schema)

# AI 8. ProductForge: Generate Optimized Config
class OptConfigRequest(BaseModel):
    currentConfig: Dict
    analysis: Dict

@app.post("/api/ai/optimized-config")
async def ai_optimized_config(req: OptConfigRequest):
    c = req.currentConfig
    a = req.analysis
    
    schema = {
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
    }

    prompt = f"""
    作为资深产品专家，请基于当前的产品配置和已有的技术分析，生成一份**经过优化的**产品配置方案。
    
    当前配置：
    - 性别/品类: {c.get('gender')} / {c.get('category')}
    - 材质: {', '.join(c.get('material', []))}
    - 驱动系统: {', '.join(c.get('drive', []))}
    - 主控系统: {', '.join(c.get('mainControl', []))}
    - 加热系统: {', '.join(c.get('heating', []))}
    - 传感器系统: {', '.join(c.get('sensors', []))}
    - 电源系统: {', '.join(c.get('power', []))}
    - 设备辅助: {', '.join(c.get('accessories', []))}
    - 工艺: {', '.join(c.get('process', []))}
    - 图纹: {', '.join(c.get('texture', []))}
    - 协议: {', '.join(c.get('protocol', []))}
    
    已有分析指出的问题（供参考）：
    - 挑战: {'; '.join(a.get('technicalChallenges', []))}
    - 建议: {'; '.join(a.get('manufacturingAdvice', []))}
    
    优化目标：
    1. 解决上述提到的技术挑战（例如兼容性、散热、成本问题）。
    2. 提升产品的可制造性和市场竞争力。
    3. 保持原有的核心产品定位（用户性别和品类不变）。
    
    请输出完整的 JSON 配置对象，格式必须与输入完全一致。
    """

    return await ask_ai(prompt, schema)

# AI 9. ProductForge: Generate Recommended Config
class RecConfigRequest(BaseModel):
    requirements: Dict
    gender: str

@app.post("/api/ai/recommended-config")
async def ai_rec_config(req: RecConfigRequest):
    r = req.requirements
    g = req.gender
    
    feature_mapping = {
        '震动': '需要驱动系统（马达）',
        '加热': '需要加热系统（PTC/石墨烯加热膜）+ 温度传感器',
        '智能控制': '需要蓝牙通信协议 + 手机APP辅助',
        '防水': '需要全包胶无缝工艺 + 密封设计',
        '温控': '需要相变温控材料或NTC温度传感器',
    }
    
    battery_mapping = {
        'Short': '300mAh锂聚合物电池（续航1-2小时）',
        'Medium': '600mAh锂聚合物电池（续航2-4小时）',
        'Long': '1000mAh锂聚合物电池（续航4-6小时）',
    }

    schema = {
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
    }

    must_have = r.get('mustHaveFeatures', [])
    must_have_desc = [f"  * {f}: {feature_mapping.get(f, '')}" for f in must_have]
    
    prompt = f"""
    你是一位资深的成人用品工程师，请根据用户的需求生成一套**成本最优**的产品配置方案。

    ## 用户需求
    - 目标性别: {'男性' if g == 'male' else '女性'}
    - 产品品类: {r.get('category') or ('由你根据需求自动选择（飞机杯/前列腺按摩器/震动环等）' if g == 'male' else '由你根据需求自动选择（震动棒/跳蛋/吮吸器等）')}
    - 预算水平: {r.get('budget')}
    - 必备功能: {', '.join(must_have)} 
      {chr(10).join(must_have_desc)}
    - 续航要求: {r.get('batteryLife')} - {battery_mapping.get(r.get('batteryLife'), '')}
    - 尺寸限制: {r.get('sizeConstraint')}
    - 特殊偏好: {', '.join(r.get('specialPreferences', []))}
    - 目标用户群: {r.get('targetAudience')}
    {f"- 补充说明: {r.get('additionalNotes')}" if r.get('additionalNotes') else ''}

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
    """

    return await ask_ai(prompt, schema)

# AI 10. ProductForge: Generate Product Image using Z-Image-Turbo
class ImageRequest(BaseModel):
    config: Dict

@app.post("/api/ai/product-image")
async def ai_product_image(req: ImageRequest):
    config = req.config
    
    # Prompt construction
    prompt_parts = []
    if config.get('category'): prompt_parts.append(config['category'])
    if config.get('gender') == 'male': prompt_parts.append('男性用品')
    elif config.get('gender') == 'female': prompt_parts.append('女性用品')
    
    if config.get('material'): prompt_parts.append(f"材质：{'、'.join(config['material'])}")
    if config.get('color'): prompt_parts.append(f"颜色：{'、'.join(config['color'])}")
    if config.get('features'): prompt_parts.append(f"功能特点：{config['features']}")
    if config.get('background'): prompt_parts.append(f"背景：{config['background']}")
    
    details = []
    if config.get('drive'): details.append(f"驱动系统：{'、'.join(config['drive'])}")
    if config.get('heating'): details.append(f"加热系统：{'、'.join(config['heating'])}")
    if config.get('texture'): details.append(f"纹理：{'、'.join(config['texture'])}")
    if details: prompt_parts.append('，'.join(details))
    
    prompt = '，'.join(prompt_parts) or '情趣用品产品概念图'
    prompt += '，产品设计图，专业产品摄影风格，白色背景，高清细节，3D渲染效果'
    
    print(f"[Image Generation] Prompt: {prompt}")

    # 1. Try Google GenAI (Gemini 2.5 Flash Image)
    if GOOGLE_API_KEY:
        print("[Image Generation] Attempting Google GenAI...")
        try:
            client = genai.Client(api_key=GOOGLE_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt,
            )
            
            generated_image = None
            for part in response.parts:
                if part.inline_data:
                    generated_image = part.as_image()
                    break
            
            if generated_image:
                # Convert PIL Image to Base64 Data URI
                buffered = io.BytesIO()
                generated_image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                data_uri = f"data:image/png;base64,{img_str}"
                
                print(f"[Image Generation] Google GenAI Success")
                return {"imageUrl": data_uri}
            else:
                print("[Image Generation] Google GenAI returned no image data.")
                # Fall through to Qwen

        except Exception as e:
            print(f"[Image Generation] Google GenAI error: {e}")
            # Fall through to Qwen

    # 2. Fallback to Qwen (Wan2.5) -- EXISTING LOGIC
    if not QWEN_API_KEY:
        raise HTTPException(status_code=500, detail="Qwen API not configured and Google GenAI failed/not configured.")

    print("[Image Generation] Falling back to Qwen...")
    try:
        # 添加重试机制处理 SSL 连接问题
        max_retries = 3
        retry_delay = 2
        rsp = None
        
        for attempt in range(max_retries):
            try:
                rsp = dashscope.ImageSynthesis.call(
                    api_key=QWEN_API_KEY,
                    model="wan2.5-t2i-preview",
                    prompt=prompt,
                    n=1,
                    size='1280*1280',
                    prompt_extend=True,
                    watermark=False,
                    seed=12345,
                )
                break  # 成功则跳出循环
            except Exception as e:
                error_str = str(e)
                if ("SSL" in error_str or "SSLError" in error_str or "EOF" in error_str) and attempt < max_retries - 1:
                    print(f"[Image Generation] SSL error on attempt {attempt + 1}: {error_str}, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    raise
        
        if rsp and rsp.status_code == 200:
            image_url = rsp.output.results[0].url
            print(f"[Image Generation] Qwen Success: {image_url}")
            return {"imageUrl": image_url}
        else:
            raise Exception(f"DashScope API error: {rsp.code} - {rsp.message}")

    except Exception as e:
        print(f"[Image Generation] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

# AI 11. Price History Analysis
class PriceAnalysisRequest(BaseModel):
    productName: str
    priceHistory: List[Dict]
    currentPrice: float
    isDomestic: bool = True

@app.post("/api/ai/price-analysis")
async def ai_price_analysis(req: PriceAnalysisRequest):
    schema = {
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
    }

    # 计算价格统计数据
    finalPrices = [h.get('finalPrice', 0) for h in req.priceHistory]
    originalPrices = [h.get('originalPrice') for h in req.priceHistory if h.get('originalPrice') is not None]
    
    minPrice = min(finalPrices) if finalPrices else req.currentPrice
    maxPrice = max(finalPrices) if finalPrices else req.currentPrice
    avgPrice = sum(finalPrices) / len(finalPrices) if finalPrices else req.currentPrice
    
    # 计算优惠力度统计数据
    discounts = []
    for h in req.priceHistory:
        if h.get('originalPrice') and h.get('finalPrice'):
            discount = ((h.get('originalPrice') - h.get('finalPrice')) / h.get('originalPrice')) * 100
            discounts.append(discount)
    
    avgDiscount = sum(discounts) / len(discounts) if discounts else 0
    maxDiscount = max(discounts) if discounts else 0
    minDiscount = min(discounts) if discounts else 0
    hasDiscount = len(discounts) > 0
    
    priceData = []
    for h in req.priceHistory:
        discountInfo = ""
        if h.get('originalPrice') and h.get('finalPrice'):
            discount = ((h.get('originalPrice') - h.get('finalPrice')) / h.get('originalPrice')) * 100
            discountInfo = f", 优惠力度: {discount:.1f}%"
        priceData.append(f"日期: {h.get('date')}, 到手价: ¥{h.get('finalPrice', 0):.2f}" + 
                        (f", 页面价: ¥{h.get('originalPrice'):.2f}" if h.get('originalPrice') else "") + discountInfo)

    prompt = f"""你是一位专业的情趣用品行业价格分析师。请分析以下产品的价格走势数据：

产品名称：{req.productName}
当前价格：¥{req.currentPrice:.2f}

价格历史数据（共 {len(req.priceHistory)} 条记录）：
{chr(10).join(priceData)}

价格统计：
- 最低到手价：¥{minPrice:.2f}
- 最高到手价：¥{maxPrice:.2f}
- 平均到手价：¥{avgPrice:.2f}
- 价格波动幅度：{((maxPrice - minPrice) / minPrice * 100):.1f}%"""
    
    discountStats = ""
    if hasDiscount:
        discountStats = f"""
优惠力度统计：
- 平均优惠力度：{avgDiscount:.1f}%
- 最大优惠力度：{maxDiscount:.1f}%
- 最小优惠力度：{minDiscount:.1f}%
- 有优惠记录：{len(discounts)} 条（共 {len(req.priceHistory)} 条记录）"""
    
    prompt = prompt + discountStats + f"""

{"请结合中国情趣用品市场的实际情况，包括电商平台（淘宝、天猫、京东、小红书等）的定价策略。" if req.isDomestic else "请结合全球情趣用品市场的定价策略。"}

请输出 JSON 格式的价格走势分析报告，包含以下英文键名（但所有字符串值必须使用简体中文）：
1. trend: 价格趋势分析（200-300字，必须使用中文），包括：
   - 整体价格走势（上涨/下跌/波动）
   - 价格变化的时间节点和原因推测
   - 与市场平均价格的对比
2. priceRange: 价格区间分析（100-200字，必须使用中文），说明：
   - 产品的价格定位（低端/中端/高端）
   - 价格区间的合理性
3. fluctuation: 价格波动分析（100-200字，必须使用中文），分析：
   - 价格波动的频率和幅度
   - 可能的促销策略或市场因素
4. discountAnalysis: 优惠力度分析（150-250字，必须使用中文），分析：
   - 优惠力度的整体水平和变化趋势
   - 优惠策略的特点（如：是否经常打折、优惠幅度是否稳定等）
   - 优惠力度与价格走势的关系
   - 优惠策略对销量的可能影响
   {"注意：如果数据中没有页面价信息，请说明无法分析优惠力度。" if not hasDiscount else ""}
5. recommendations: 定价建议（Array of Strings，至少3条，每个字符串必须使用中文），包括：
   - 基于历史数据的定价建议
   - 促销时机建议
   - 价格优化建议
6. summary: 综合分析总结（200-300字，必须使用中文）

**重要：所有字符串值（trend, priceRange, fluctuation, discountAnalysis, recommendations数组中的每个元素, summary）都必须使用简体中文，不要使用英文。**
请确保分析专业、深入且具有实际参考价值。"""

    return await ask_ai(prompt, schema)

# AI 12. Brand Characteristics Analysis
class BrandCharacteristicsRequest(BaseModel):
    competitor: Dict
    isDomestic: bool = True

@app.post("/api/ai/brand-characteristics")
async def ai_brand_characteristics(req: BrandCharacteristicsRequest):
    schema = {
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
    }

    competitor = req.competitor
    brandName = competitor.get('name', '')
    philosophy = competitor.get('philosophy', [])
    products = competitor.get('products', [])
    ads = competitor.get('ads', [])
    focus = competitor.get('focus', '')
    isDomestic = req.isDomestic

    # 统计产品信息
    productCount = len(products)
    categories = {}
    priceRanges = []
    allTags = []
    genderDistribution = {'Male': 0, 'Female': 0, 'Unisex': 0}
    
    for product in products:
        # 统计类别
        category = product.get('category', '未分类')
        categories[category] = categories.get(category, 0) + 1
        
        # 统计价格
        price = product.get('price', 0)
        if price > 0:
            priceRanges.append(price)
        
        # 统计标签
        tags = product.get('tags', [])
        if isinstance(tags, list):
            allTags.extend(tags)
        
        # 统计性别分布
        gender = product.get('gender', 'Unisex')
        if gender in genderDistribution:
            genderDistribution[gender] += 1

    avgPrice = sum(priceRanges) / len(priceRanges) if priceRanges else 0
    minPrice = min(priceRanges) if priceRanges else 0
    maxPrice = max(priceRanges) if priceRanges else 0

    # 构建产品信息文本
    productInfo = f"共 {productCount} 款产品"
    if categories:
        categoryList = ", ".join([f"{k}({v}款)" for k, v in categories.items()])
        productInfo += f"，类别分布：{categoryList}"
    if priceRanges:
        productInfo += f"\n价格区间：¥{minPrice:.2f} - ¥{maxPrice:.2f}，平均价格：¥{avgPrice:.2f}"
    if allTags:
        # 统计最常见的标签
        from collections import Counter
        tagCounts = Counter(allTags)
        topTags = [tag for tag, _ in tagCounts.most_common(10)]
        productInfo += f"\n产品标签（前10）：{', '.join(topTags)}"
    
    genderInfo = ""
    if genderDistribution['Male'] > 0 or genderDistribution['Female'] > 0 or genderDistribution['Unisex'] > 0:
        genderInfo = f"产品性别分布：男用 {genderDistribution['Male']} 款，女用 {genderDistribution['Female']} 款，通用 {genderDistribution['Unisex']} 款"

    philosophyText = "\n".join([f"- {p}" for p in philosophy]) if philosophy else "暂无品牌理念"

    focusText = ""
    if focus == "Female":
        focusText = "专攻女用市场"
    elif focus == "Male":
        focusText = "专攻男用市场"
    else:
        focusText = "男女兼用市场"

    adsText = ""
    if ads:
        adsList = []
        for ad in ads:
            adInfo = f"- {ad.get('text', '')}"
            if ad.get('highlights'):
                adInfo += f" (卖点：{', '.join(ad.get('highlights'))})"
            adsList.append(adInfo)
        adsText = "\n".join(adsList)
    else:
        adsText = "暂无具体宣传文案信息"

    prompt = f"""你是一位专业的情趣用品行业品牌分析师。请基于以下信息，深入分析该品牌的特点：

品牌名称：{brandName}
品牌类型：{"国内品牌" if isDomestic else "国际知名品牌"}
品牌定位：{focusText}

品牌理念：
{philosophyText}

产品信息：
{productInfo}
{genderInfo if genderInfo else ""}

现有宣传语/广告创意：
{adsText}

{"请结合中国情趣用品市场的实际情况，包括消费者偏好、市场趋势、竞争格局等。" if isDomestic else "请结合全球情趣用品市场的实际情况，包括不同地区的消费者偏好、市场趋势、竞争格局等。"}

请输出 JSON 格式的品牌特点分析报告，包含以下英文键名（但所有字符串值必须使用简体中文）：
1. brandPositioning: 品牌定位分析（50-100字，必须使用中文），包括：
   - 品牌在市场中的定位（高端/中端/低端，专业/大众等）
   - 品牌理念如何体现在定位中
   - 与同类品牌的差异化定位
2. productCharacteristics: 产品特征分析（50-100字，必须使用中文），包括：
   - 产品线的整体特征（类别分布、功能特点等）
   - 产品标签和关键词反映的产品特色
   - 产品设计理念和功能定位
   - 产品创新点和独特卖点
3. priceStrategy: 价格策略分析（50-100字，必须使用中文），包括：
   - 价格区间定位和定价策略
   - 价格与产品定位的匹配度
   - 价格竞争力分析
   - 价格策略对品牌形象的影响
4. targetAudience: 目标受众分析（50-100字，必须使用中文），包括：
   - 基于产品性别分布和品牌定位的目标用户群体
   - 目标用户的消费能力和消费习惯
   - 品牌如何通过产品和理念吸引目标受众
5. competitiveAdvantages: 竞争优势（Array of Strings，至少4条，每个字符串必须使用中文），包括：
   - 基于品牌理念、产品特征、价格策略等方面的竞争优势
   - 每条优势要具体且有说服力
6. brandPersonality: 品牌个性（50-100字，必须使用中文），描述：
   - 品牌展现出的个性特征（如：专业、时尚、亲民、高端等）
   - 品牌个性如何通过理念和产品体现
   - 品牌个性对消费者的吸引力
7. sloganCreativity: 宣传语与创意分析（50-100字，必须使用中文），要求：
   - 深入分析上述提供的现有宣传语/广告创意（如果有），总结其核心诉求和风格
   - 品牌在营销创意上的独特之处（如：视觉风格、情感表达、社会议题等）
   - 宣传语如何契合品牌定位和产品特点
   - 结合现有文案，针对品牌的调性，提出更具冲击力和吸引力的创意宣传建议
8. summary: 综合分析总结（100-150字，必须使用中文），包括：
   - 品牌特点的综合概括
   - 品牌的核心竞争力
   - 品牌在市场中的定位和价值
   - 品牌发展的优势和潜在挑战
9. wordCloudKeywords: 词云关键词（Array of Objects，必须包含3-5个关键词，每个对象包含value和count字段），要求：
   - value: 关键词（2-4个中文字符，必须使用中文）
   - count: 词频权重（1-10之间的整数，数值越大表示该关键词越重要，最重要的关键词权重应该最高）
   - **必须严格过滤掉以下无用词：**
     * 停用词：的、了、在、是、我、有、和、就、不、人、都、一、一个、上、也、很、到、说、要、去、你、会、着、没有、看、好、自己、这
     * 连接词：为、与、及、等、或、而、但、以、从、对、向、在、于、由、被、让、给、把、用、因、由于、通过、按照、根据
     * 助动词：可以、能够、应该、需要、必须、可能、如果、那么、因为、所以
     * 代词：这个、那个、这些、那些、什么、怎么、如何、为什么
     * 连词：以及、并且、而且、同时、另外、此外、因此、所以、然而、但是、不过、虽然、尽管、即使、如果、假如、要是、只要、只有、除非
     * 介词：通过、根据、按照、依据、基于、针对、对于、关于、有关、涉及、包括、含有、具有、拥有、存在、出现、发生、产生、形成、建立
     * 动词：进行、开展、实施、执行、完成、实现、达到、获得、取得、得到、接受、采用、使用、利用、运用、应用、采取、选择、决定
     * 抽象名词：方面、领域、范围、区域、地区、地方、位置、地点、场所、空间、时间、时期、阶段、过程、步骤、方法、方式、手段、途径、渠道、功能、作用、效果、影响、结果、后果
     * 通用词：品牌、产品、市场、用户、消费者、价格、策略、定位、特点、分析
   - 关键词应该反映品牌的核心特点、产品特征、市场定位、竞争优势等有意义的词汇
   - 优先选择能够代表品牌独特性和核心竞争力的词汇
   - 只选择最重要的3-5个关键词，确保每个关键词都具有高度代表性
   - 词频权重应该根据关键词的重要性和代表性合理分配，最重要的关键词权重为10，次重要的依次递减

**重要：所有字符串值（brandPositioning, productCharacteristics, priceStrategy, targetAudience, competitiveAdvantages数组中的每个元素, brandPersonality, sloganCreativity, summary, wordCloudKeywords数组中的每个对象的value字段）都必须使用简体中文，不要使用英文。**
请确保分析专业、深入且具有实际参考价值，要结合品牌理念、产品特征和价格等因素进行综合分析。"""

    return await ask_ai(prompt, schema)

# AI 13. QA Analysis
class QAAnalysisRequest(BaseModel):
    text: str

@app.post("/api/ai/analyze-qa")
async def ai_analyze_qa(req: QAAnalysisRequest):
    schema = {
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
    }

    prompt = f"""你是一位专业的用户体验分析师。请分析以下用户问答/评论数据，提取用户的痛点和关心点，并给出针对性的改进建议：

用户数据：
{req.text[:15000]}  # 限制长度防止超长

注意：如果数据包含`[购买状态]`字段，且状态为`已购`或`回头客`：
- `已购`用户：重点关注其实际使用中的体验和痛点（Pain Points）。
- `回头客`用户：属于高价值忠实用户，重点关注其复购原因（满意点）以及对产品的进阶需求或深度不满（Concerns/Pain Points）。
- 其他/未知状态：更多关注其购买前的疑虑（Concerns）。

请输出 JSON 格式的分析报告：
1. painPoints: 用户痛点列表（至少10条），重点关注已购买用户和回头客反馈的实际困难、功能缺陷或使用不便。
2. concerns: 用户关心点列表（至少10条），重点关注未购买用户（或决策中）最在意的因素（如材质安全、隐私、噪音等）以及已购用户的期望偏差。
3. suggestions: 针对上述痛点和关心点的改进建议（至少10条）。建议应具体、可执行，例如从产品设计、功能优化、营销话术或服务流程等方面入手。
4. summary: 综合总结（150-200字），概括整体用户反馈的倾向和主要待解决问题。

**所有输出必须使用简体中文。**"""

    return await ask_ai(prompt, schema)

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=True)
