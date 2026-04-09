"""
adapters/openai_client.py — OpenAI 통합 클라이언트
텍스트 요약, 플랫폼 포스트 생성, Moderation, DALL-E 이미지 생성을 담당합니다.
"""
import asyncio
import json
import re
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel
from typing import Optional
from src.config import settings


class PlatformTexts(BaseModel):
    x: str
    linkedin: str
    instagram: str
    facebook: str
    tiktok_script: str


class ModerationResult(BaseModel):
    passed: bool
    flags: list[str]


class ImageResult(BaseModel):
    url: str          # DALL-E 임시 URL (1시간 유효)
    prompt_used: str


class UsageRecord(BaseModel):
    model: str
    tokens_used: int
    cost_usd: float
    purpose: str


# 비용 테이블 ($/1K tokens)
COST_TABLE = {
    "gpt-3.5-turbo":   {"input": 0.0005, "output": 0.0015},
    "gpt-4o":          {"input": 0.005,  "output": 0.015},
    "gpt-4o-mini":     {"input": 0.00015,"output": 0.0006},
    "dall-e-3":        {"image": 0.04},   # per image (1024x1024)
}


def _calc_cost(model: str, prompt_tokens: int, completion_tokens: int = 0) -> float:
    rate = COST_TABLE.get(model, {"input": 0, "output": 0})
    if "image" in rate:
        return rate["image"]
    return (prompt_tokens / 1000 * rate["input"]) + (completion_tokens / 1000 * rate["output"])


PLATFORM_TEMPLATES = {
    "x": (
        "You are a copywriter for X (Twitter). "
        "Max 260 characters. Tone: witty, concise, data-driven. "
        "Include exactly 2-3 hashtags at the end. No emojis. "
        "End with a CTA like 'Read more →'. Return JSON: {\"text\": \"...\"}"
    ),
    "linkedin": (
        "You are a professional Tech/AI Analyst writing in Korean. "
        "Tone: Analytical, calm, fact-checking, professional ('~습니다', '~합니다'). "
        "Structure: 1) Core verified fact, 2) Data/Metrics, 3) Gaps/Unverified points (if any), 4) Final insight. "
        "Always separate verified facts from speculation. No emojis. "
        "End with a thought-provoking question for professionals. "
        "Return JSON: {\"text\": \"...\"}"
    ),
    "instagram": (
        "You are an insightful Tech Curator on Instagram writing in Korean. "
        "Tone: Friendly yet analytical, using polite forms ('~해요', '~입니다'). "
        "Structure: Use emojis to separate sections (e.g., 👀, 📌, ⚠️, 💬). "
        "Focus on 'What this means for the industry'. Clearly state if something is unverified. "
        "End with an engaging question asking for their thoughts: '여러분은 어떻게 보시나요? 생각 들려주세요 💬' "
        "Max 2200 characters. Return JSON: {\"text\": \"...\"}"
    ),
    "facebook": (
        "You are a thoughtful Tech Columnist on Facebook writing in Korean. "
        "Tone: Conversational but logically structured ('~습니다', '~합니다'). "
        "Structure: Narrative flow. Start with the core takeaway, dive into the numbers/evidence, and explicitly mention what is NOT verified. "
        "End with an open question to encourage community discussion. "
        "No hashtags. Return JSON: {\"text\": \"...\"}"
    ),
    "tiktok": (
        "You are a TikTok script writer. "
        "Total spoken text ≤ 150 characters (subtitle style). "
        "Hook in first 3 seconds. Energetic, emoji-light. "
        "End with 'Follow for more AI news'. Return JSON: {\"script\": \"...\"}"
    ),
}


class OpenAIClient:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # ── Step 1: 기사 요약 ─────────────────────────────────────────────────
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def summarize(self, title: str, content: str) -> tuple[str, UsageRecord]:
        """GPT-3.5-turbo로 빠른 2-3문장 요약"""
        resp = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.5,
            max_tokens=200,
            messages=[
                {"role": "system", "content": "Summarize the article in 2-3 sentences. Be factual and concise."},
                {"role": "user", "content": f"Title: {title}\n\nContent: {content[:3000]}"},
            ],
        )
        summary = resp.choices[0].message.content.strip()
        usage = UsageRecord(
            model="gpt-3.5-turbo",
            tokens_used=resp.usage.total_tokens,
            cost_usd=_calc_cost("gpt-3.5-turbo", resp.usage.prompt_tokens, resp.usage.completion_tokens),
            purpose="summary",
        )
        return summary, usage

    # ── Step 2: 플랫폼별 텍스트 동시 생성 ────────────────────────────────
    async def generate_all_platforms(
        self, summary: str, company: str
    ) -> tuple[PlatformTexts, list[UsageRecord]]:
        """5개 플랫폼 텍스트를 asyncio로 병렬 생성"""
        user_msg = f"Article summary: {summary}\nCompany: {company}"

        texts = {}
        usages = []

        for platform in PLATFORM_TEMPLATES:
            try:
                text, usage = await self._generate_platform(platform, user_msg)
                texts[platform] = text
                usages.append(usage)
            except Exception as e:
                texts[platform] = ""

        return PlatformTexts(
            x=texts.get("x", ""),
            linkedin=texts.get("linkedin", ""),
            instagram=texts.get("instagram", ""),
            facebook=texts.get("facebook", ""),
            tiktok_script=texts.get("tiktok", ""),
        ), usages

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def _generate_platform(
        self, platform: str, user_msg: str
    ) -> tuple[str, UsageRecord]:
        resp = await self.client.chat.completions.create(
            model="gpt-4o",
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=500,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": PLATFORM_TEMPLATES[platform]},
                {"role": "user", "content": user_msg},
            ],
        )
        raw = json.loads(resp.choices[0].message.content)
        text = raw.get("text") or raw.get("script", "")
        usage = UsageRecord(
            model="gpt-4o",
            tokens_used=resp.usage.total_tokens,
            cost_usd=_calc_cost("gpt-4o", resp.usage.prompt_tokens, resp.usage.completion_tokens),
            purpose=f"platform_text_{platform}",
        )
        return text, usage

    # ── Step 3: Moderation ────────────────────────────────────────────────
    async def moderate(self, texts: PlatformTexts) -> ModerationResult:
        """모든 플랫폼 텍스트를 합쳐서 Moderation API로 검사"""
        combined = " ".join([
            texts.x, texts.linkedin, texts.instagram,
            texts.facebook, texts.tiktok_script
        ])
        resp = await self.client.moderations.create(input=combined)
        result = resp.results[0]

        flags = []
        if result.flagged:
            cats = result.categories.model_dump()
            flags = [k for k, v in cats.items() if v]

        # 사내 블랙리스트 추가 검사
        blacklist = ["spam", "scam", "bet", "gamble", "kill"]
        for word in blacklist:
            if word in combined.lower():
                flags.append(f"blacklist:{word}")

        return ModerationResult(passed=len(flags) == 0, flags=flags)

    # ── Step 4: 이미지 생성 ───────────────────────────────────────────────
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=15))
    async def generate_image(
        self, company: str, summary: str
    ) -> tuple[ImageResult, UsageRecord]:
        """DALL-E 3으로 1024×1024 이미지 생성"""
        prompt = (
            f"Clean, professional tech illustration of {company}'s AI hardware. "
            f"Modern, minimal style, white background, no text. "
            f"Theme: {summary[:100]}"
        )
        resp = await self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = resp.data[0].url
        usage = UsageRecord(
            model="dall-e-3",
            tokens_used=0,
            cost_usd=0.04,
            purpose="image",
        )
        return ImageResult(url=image_url, prompt_used=prompt), usage
