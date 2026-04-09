import asyncio
import json
import time
import os
import aiohttp
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('C:/dev/Iflo/.env')
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

DATA_DIR = Path("C:/Users/sunwo/.gemini/antigravity/scratch/social-media-pipeline/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
BEST_MODELS_PATH = DATA_DIR / "best_free_models.json"

async def test_model(session, model_id):
    start_time = time.time()
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://iflo.local",
            "X-Title": "Iflo Auto Pipeline",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": "Hello, say 'OK' if you read this."}],
            "max_tokens": 5,
            "temperature": 0.1
        }
        
        async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=5) as response:
            if response.status == 200:
                elapsed = time.time() - start_time
                data = await response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return {"model": model_id, "latency": elapsed, "status": "success"}
            return {"model": model_id, "latency": 999, "status": "failed"}
    except Exception:
        return {"model": model_id, "latency": 999, "status": "error"}

async def main():
    print("🤖 [Stage 0] 매일 아침 AI 모델 컨디션 벤치마크 시작...")
    
    # 1. OpenRouter에서 현재 사용 가능한 무료 모델 리스트 동적 수집
    print("📡 OpenRouter 무료 모델 카탈로그 조회 중...")
    async with aiohttp.ClientSession() as session:
        async with session.get("https://openrouter.ai/api/v1/models") as resp:
            try:
                models_data = await resp.json()
                
                # 'nano', 'mini', 1b~12b 등 가볍지만 멍청한(추론력 떨어지는) 모델은 제외 필터링
                bad_kwd = ["nano", "mini", "1.2b", "3b", "4b", "8b", "9b", "12b", "vision", "coder", "air"]
                
                free_models = []
                for m in models_data.get("data", []):
                    m_id = m["id"]
                    if m_id.endswith(":free") or "free" in m_id.lower():
                        if not any(k in m_id.lower() for k in bad_kwd):
                            free_models.append(m_id)
            except:
                # API 실패 대비 하드코딩 폴백
                free_models = [
                    "nvidia/nemotron-3-super-120b-a12b:free",
                    "nousresearch/hermes-3-llama-3.1-405b:free",
                    "meta-llama/llama-3.3-70b-instruct:free",
                    "google/gemma-4-31b-it:free",
                    "openai/gpt-oss-120b:free",
                    "deepseek/deepseek-r1:free"
                ]

    print("🎯 지능이 높은(20B 이상) 무료 모델 후보들을 찾았습니다. 일제히 핑 테스트(Ping Test)를 쏘겠습니다!")

    # 2. 모든 무료 모델에 비동기로 테스트 요청 날리기
    async with aiohttp.ClientSession() as session:
        tasks = [test_model(session, m_id) for m_id in free_models]
        results = await asyncio.gather(*tasks)

    # 3. 레이턴시(속도) 순으로 정렬하고 성공한 녀석만 필터링
    successful_models = [r for r in results if r["status"] == "success"]
    successful_models.sort(key=lambda x: x["latency"])

    if not successful_models:
        print("❌ 오늘 기분이 좋은 무료 모델이 한 개도 없습니다. (Rate Limit이거나 네트워크 에러)")
        return

    print("\n🏆 [오늘의 최상위 무료 모델 랭킹 (응답 속도 순)]")
    top_5 = successful_models[:5]
    top_5_ids = []
    for idx, best in enumerate(top_5, 1):
        print(f" {idx}위: {best['model']} ({best['latency']:.2f}초)")
        top_5_ids.append(best['model'])

    # 4. JSON 파일에 오늘의 베스트 라인업 저장 (OpenRouterClient가 이 파일을 읽음)
    with open(BEST_MODELS_PATH, "w") as f:
        json.dump(top_5_ids, f, indent=4)
        
    print(f"\n✅ 오늘의 모델 라인업이 성공적으로 갱신되었습니다! (저장 위치: {BEST_MODELS_PATH.name})")

if __name__ == "__main__":
    asyncio.run(main())
