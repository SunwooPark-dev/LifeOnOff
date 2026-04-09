"""
pipeline/validator.py — 플랫폼별 텍스트 검증·보정
문자수 초과 시 자동으로 잘라냅니다.
"""
from src.adapters.openai_client import PlatformTexts

LIMITS = {
    "x":        260,
    "linkedin": 1300,
    "instagram": 2200,
    "facebook": 63000,
    "tiktok":   150,
}


class TextValidator:
    def validate_and_fix(self, texts: PlatformTexts) -> PlatformTexts:
        """문자수 초과 시 말줄임표 처리"""
        return PlatformTexts(
            x=self._cap(texts.x, LIMITS["x"]),
            linkedin=self._cap(texts.linkedin, LIMITS["linkedin"]),
            instagram=self._cap(texts.instagram, LIMITS["instagram"]),
            facebook=self._cap(texts.facebook, LIMITS["facebook"]),
            tiktok_script=self._cap(texts.tiktok_script, LIMITS["tiktok"]),
        )

    def _cap(self, text: str, limit: int) -> str:
        if len(text) <= limit:
            return text
        return text[:limit - 3] + "..."

    def check(self, texts: PlatformTexts) -> dict[str, bool]:
        return {
            "x":        len(texts.x) <= LIMITS["x"],
            "linkedin": len(texts.linkedin) <= LIMITS["linkedin"],
            "instagram":len(texts.instagram) <= LIMITS["instagram"],
            "facebook": len(texts.facebook) <= LIMITS["facebook"],
            "tiktok":   len(texts.tiktok_script) <= LIMITS["tiktok"],
        }
