"""
adapters/tiktok_client.py — TikTok Content Posting API v2 어댑터
TikTok Developer: https://developers.tiktok.com/doc/content-posting-api-get-started
"""
import httpx
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel
from typing import Optional
from src.config import settings


class TikTokPostResult(BaseModel):
    success: bool
    publish_id: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None


class TikTokClient:
    """
    TikTok Content Posting API v2
    - Direct Post: 영상을 즉시 게시
    - 필요 권한: video.publish, video.upload
    """
    BASE_URL = "https://open.tiktokapis.com/v2"

    def __init__(self):
        self.access_token = settings.TIKTOK_ACCESS_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
    async def post_video_from_url(
        self,
        video_url: str,
        caption: str,
        disable_comment: bool = False,
        disable_duet: bool = False,
        disable_stitch: bool = False,
    ) -> TikTokPostResult:
        """
        외부 URL에서 영상 가져와 TikTok에 게시 (Pull 방식)
        video_url은 공개 HTTPS URL이어야 합니다.
        """
        # Step 1: 게시 초기화
        init_payload = {
            "post_info": {
                "title": caption[:150],           # TikTok 제목 150자 제한
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "disable_comment": disable_comment,
                "disable_duet": disable_duet,
                "disable_stitch": disable_stitch,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": video_url,
            },
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.BASE_URL}/post/publish/video/init/",
                headers=self.headers,
                json=init_payload,
            )

        if resp.status_code not in (200, 201):
            return TikTokPostResult(
                success=False,
                error=f"Init failed: HTTP {resp.status_code} — {resp.text[:300]}"
            )

        data = resp.json().get("data", {})
        publish_id = data.get("publish_id")

        if not publish_id:
            return TikTokPostResult(
                success=False,
                error=f"No publish_id returned: {resp.text[:200]}"
            )

        # Step 2: 상태 폴링 (최대 60초)
        for _ in range(12):
            await asyncio.sleep(5)
            status = await self._check_status(publish_id)
            if status in ("PUBLISH_COMPLETE", "PUBLISHED"):
                return TikTokPostResult(
                    success=True,
                    publish_id=publish_id,
                    status=status,
                )
            if status in ("FAILED", "PUBLISH_FAILED"):
                return TikTokPostResult(
                    success=False,
                    publish_id=publish_id,
                    status=status,
                    error="TikTok publishing failed (server-side)"
                )

        return TikTokPostResult(
            success=True,   # 타임아웃은 실패가 아님, 백그라운드 처리 중
            publish_id=publish_id,
            status="PROCESSING",
        )

    async def _check_status(self, publish_id: str) -> str:
        """게시 상태 조회"""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.BASE_URL}/post/publish/status/fetch/",
                headers=self.headers,
                json={"publish_id": publish_id},
            )
        if resp.status_code == 200:
            return resp.json().get("data", {}).get("status", "UNKNOWN")
        return "UNKNOWN"

    async def get_creator_info(self) -> dict:
        """크리에이터 정보 조회 (토큰 유효성 확인용)"""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.BASE_URL}/post/publish/creator_info/query/",
                headers=self.headers,
                json={},
            )
        if resp.status_code == 200:
            return resp.json().get("data", {})
        return {"error": resp.text}
