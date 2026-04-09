"""
adapters/openrouter_client.py — OpenRouter 기반 초벌번역/요약 클라이언트
구글 뉴스 수집 후, PRO로 넘기기 전 가벼운 팩트/요약 정리를 담당합니다.
"""
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from src.config import settings

class OpenRouterClient:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.fallback_models = [
            "nvidia/nemotron-3-super-120b-a12b:free",    # 1선발: NVIDIA의 최신 120B 괴물급 모델
            "nousresearch/hermes-3-llama-3.1-405b:free", # 2선발: Llama 3.1 405B 기반의 최고성능 완전체
            "openai/gpt-oss-120b:free",                  # 3선발: OpenAI 파운데이션 120B 오픈소스
            "meta-llama/llama-3.3-70b-instruct:free",    # 4선발: 든든한 국밥 Llama 3.3
            "google/gemma-4-31b-it:free"                 # 5선발: 가장 빠른 구글 Gemma 4
        ]
        
        # 만약 벤치마크 결과 파일이 있다면 (매일 아침 갱신됨), 해당 리스트로 완전 교체
        import json
        from pathlib import Path
        best_models_file = Path("C:/Users/sunwo/.gemini/antigravity/scratch/social-media-pipeline/data/best_free_models.json")
        if best_models_file.exists():
            try:
                with open(best_models_file, "r") as f:
                    dynamic_models = json.load(f)
                    if dynamic_models:
                        self.fallback_models = dynamic_models
            except Exception as e:
                print(f"⚠️ 벤치마크 데이터를 읽어오지 못했습니다. 기본 폴백 트리를 유지합니다. ({e})")

    async def _call_api_with_fallback(self, system_prompt: str, user_prompt: str) -> str:
        last_error = None
        for model in self.fallback_models:
            print(f"    🟢 [OpenRouter] '{model}' 모델로 요청 시도 중...")
            try:
                resp = await self.client.chat.completions.create(
                    model=model,
                    temperature=0.2,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    timeout=15.0 # 멍 때리는 무능한 모델은 15초 만에 컷!
                )
                return resp.choices[0].message.content.strip()
            except Exception as e:
                last_error = str(e)
                if "429" in last_error or "rate limit" in last_error.lower():
                    print(f"      ⚠️ {model} Rate Limit 발생, 다음 모델로 대체합니다.")
                else:
                    print(f"      ⚠️ {model} 에러 발생: {e}")
                
                # 다음 무료 모델 호출 전 짧은 대기
                import asyncio
                await asyncio.sleep(2)
                
        raise Exception(f"사용 가능한 모든 무료 모델이 응답하지 않습니다. 최종 에러: {last_error}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def extract_facts(self, title: str, content: str) -> str:
        """기사를 읽고 짧게 핵심 사실만 한국어로 요약합니다. (엑셀 기록용)"""
        if not settings.OPENROUTER_API_KEY:
            return "API_KEY_MISSING"
            
        system_prompt = (
            "You are a tech journalist. Summarize the key facts of the provided news article "
            "in 3 concise bullet points in KOREAN. Do not include your own opinions."
        )
        user_prompt = f"Title: {title}\n\nContent: {content[:3000]}"
        
        try:
            return await self._call_api_with_fallback(system_prompt, user_prompt)
        except Exception as e:
            return f"OpenRouter 추출 에러: {str(e)}"
            
    @retry(stop=stop_after_attempt(6), wait=wait_exponential(min=2, max=30))
    async def evaluate_article(self, title: str, content: str) -> dict:
        """기사를 7가지 기준(d1~d7)으로 채점하고 PROCEED/KILL을 결정합니다."""
        if not settings.OPENROUTER_API_KEY:
            return {"decision": "PROCEED", "reason": "API Key Missing", "total": 0}
            
        system_prompt = (
            "You are a strict, top-tier AI tech investment analyst. "
            "Evaluate the given news article on 7 criteria (D1 to D7), each scored 1 to 5 (5 is best, 1 is worst).\n"
            "D1: Factual Evidence (Is it verified fact or just rumor?)\n"
            "D2: Market Impact (Does it affect the industry significantly?)\n"
            "D3: Novelty (Is it breaking news or highly original?)\n"
            "D4: Actionability (Can investors or professionals act on this?)\n"
            "D5: Source Credibility (Is the source reliable?)\n"
            "D6: Data/Metrics (Are there concrete numbers/money mentioned?)\n"
            "D7: Trend Alignment (Does it perfectly align with current AI Agent/Startup trends?)\n\n"
            "Output valid JSON ONLY with exactly these keys: "
            "'d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7' (all integers 1-5). "
            "Do not include any other text."
        )
        user_prompt = f"Title: {title}\n\nContent: {content[:3000]}"
        
        try:
            raw_text = await self._call_api_with_fallback(system_prompt, user_prompt)
            import json
            # 마크다운 백틱 제거
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("```").removeprefix("json").strip()
                
            scores = json.loads(raw_text)
            
            d1, d2, d3 = scores.get("d1", 1), scores.get("d2", 1), scores.get("d3", 1)
            d4, d5, d6, d7 = scores.get("d4", 1), scores.get("d5", 1), scores.get("d6", 1), scores.get("d7", 1)
            
            total = d1 + d2 + d3 + d4 + d5 + d6 + d7
            decision = "PROCEED" if total >= 21 else "KILL"
            reason = f"{decision} {total}/35 | D1={d1} D2={d2} D3={d3} D4={d4} D5={d5} D6={d6} D7={d7}"
            
            return {
                "d1": d1, "d2": d2, "d3": d3, "d4": d4, "d5": d5, "d6": d6, "d7": d7,
                "total": total, "decision": decision, "reason": reason
            }
        except Exception as e:
            return {"decision": "PROCEED", "reason": f"Evaluation Error: {e}", "total": 0}
            
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(min=2, max=30))
    async def refine_draft_to_platforms(self, raw_draft: str) -> dict:
        """ChatGPT에서 얻은 지저분한 초안을 분석하여 각 플랫폼별 완성본으로 다듬고 분리합니다."""
        if not settings.OPENROUTER_API_KEY:
            return {}
            
        system_prompt = (
            "You are a Senior Social media Copywriter and IT Business Analyst. "
            "The user will provide a raw, unstructured draft (potentially with JSON leftovers). "
            "Your task is to refine this into high-quality, professional Korean social media posts for each platform.\n\n"
            "STRICT RULES:\n"
            "1. **LinkedIn**: Use a professional, authoritative, yet approachable analyst tone. "
            "Ensure clear line breaks for readability. Structure with: [Headline] -> [Body/Insights] -> [Key Takeaways] -> [Hashtags].\n"
            "2. **Instagram**: Use a friendly, engaging, and visual-first tone. Incorporate relevant emojis naturally. "
            "Keep paragraphs short and end with a block of 5-10 strategic Korean/English hashtags.\n"
            "3. **X (Twitter)**: Strictly follow the character limit (~280 chars). Use 1-2 punchy hashtags. "
            "Ensure the tone is sharp, news-oriented, and clicky. Bullet points are preferred if data is involved.\n"
            "4. **General**: Remove all metadata, JSON tags, or 'needs review' commentary. Fix all typos and naturalize the Korean translation.\n\n"
            "Output ONLY a valid JSON object with keys: 'x', 'linkedin', 'instagram', 'facebook'."
        )
        
        try:
            raw_text = await self._call_api_with_fallback(system_prompt, raw_draft[:5000])
            import json
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("```").removeprefix("json").strip()
            
            return json.loads(raw_text)
        except Exception as e:
            from structlog import get_logger
            get_logger().error("openrouter.refine_draft_failed", error=str(e))
            return {}
