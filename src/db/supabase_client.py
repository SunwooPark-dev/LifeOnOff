"""
db/supabase_client.py — Supabase PostgreSQL 클라이언트
중복 체크, 기사·포스트·비용 로그 기록을 담당합니다.
"""
from supabase import create_client, Client
from datetime import datetime, timezone
from typing import Optional
import uuid
from src.config import settings
from src.adapters.openclaw import Article
from src.adapters.openai_client import PlatformTexts, UsageRecord


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class SupabaseDB:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    # ── 기사 중복 체크 ────────────────────────────────────────────────────
    def is_article_seen(self, article_id: str) -> bool:
        result = (
            self.client.table("articles")
            .select("id")
            .eq("id", article_id)
            .execute()
        )
        return len(result.data) > 0

    def save_article(self, article: Article, priority: float = 0.0) -> None:
        self.client.table("articles").upsert({
            "id": article.id,
            "title": article.title,
            "source_url": article.url,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "source_id": article.source_id,
            "priority_score": priority,
            "status": "pending",
        }).execute()

    def update_article_status(self, article_id: str, status: str) -> None:
        self.client.table("articles").update({
            "status": status,
            "updated_at": _utcnow(),
        }).eq("id", article_id).execute()

    # ── 플랫폼 포스트 저장 ────────────────────────────────────────────────
    def save_platform_posts(
        self,
        article_id: str,
        texts: PlatformTexts,
        image_url: str,
        schedules: dict,
        moderation_passed: bool,
        moderation_flags: list[str],
    ) -> list[int]:
        """5개 플랫폼 포스트를 한 번에 저장. 생성된 ID 목록 반환."""
        rows = [
            {
                "article_id": article_id,
                "platform": "X",
                "text": texts.x,
                "hashtags": ["#AI", "#TechNews"],
                "image_url": image_url,
                "schedule_utc": schedules.get("x"),
                "moderation_pass": moderation_passed,
                "moderation_flags": moderation_flags,
                "char_count": len(texts.x),
                "status": "pending",
            },
            {
                "article_id": article_id,
                "platform": "LinkedIn",
                "text": texts.linkedin,
                "hashtags": [],
                "image_url": image_url,
                "schedule_utc": schedules.get("linkedin"),
                "moderation_pass": moderation_passed,
                "moderation_flags": moderation_flags,
                "char_count": len(texts.linkedin),
                "status": "pending",
            },
            {
                "article_id": article_id,
                "platform": "Instagram",
                "text": texts.instagram,
                "hashtags": ["#AI", "#TechTrends"],
                "image_url": image_url,
                "schedule_utc": schedules.get("instagram"),
                "moderation_pass": moderation_passed,
                "moderation_flags": moderation_flags,
                "char_count": len(texts.instagram),
                "status": "pending",
            },
            {
                "article_id": article_id,
                "platform": "Facebook",
                "text": texts.facebook,
                "hashtags": [],
                "image_url": image_url,
                "schedule_utc": schedules.get("facebook"),
                "moderation_pass": moderation_passed,
                "moderation_flags": moderation_flags,
                "char_count": len(texts.facebook),
                "status": "pending",
            },
            {
                "article_id": article_id,
                "platform": "TikTok",
                "script": texts.tiktok_script,
                "hashtags": [],
                "schedule_utc": schedules.get("tiktok"),
                "moderation_pass": moderation_passed,
                "moderation_flags": moderation_flags,
                "char_count": len(texts.tiktok_script),
                "status": "pending",
            },
        ]
        result = self.client.table("platform_posts").insert(rows).execute()
        return [r["id"] for r in result.data]

    def update_post_buffer_id(self, post_db_id: int, buffer_id: str, status: str = "scheduled") -> None:
        self.client.table("platform_posts").update({
            "buffer_post_id": buffer_id,
            "status": status,
        }).eq("id", post_db_id).execute()

    # ── 비용·사용량 로그 ──────────────────────────────────────────────────
    def log_usage(self, article_id: str, usages: list[UsageRecord]) -> None:
        rows = [
            {
                "article_id": article_id,
                "model": u.model,
                "tokens_used": u.tokens_used,
                "cost_usd": u.cost_usd,
                "purpose": u.purpose,
            }
            for u in usages
        ]
        if rows:
            self.client.table("openai_usage").insert(rows).execute()

    # ── 파이프라인 실행 로그 ──────────────────────────────────────────────
    def start_run(self) -> str:
        run_id = uuid.uuid4().hex
        self.client.table("pipeline_runs").insert({
            "run_id": run_id,
            "status": "running",
        }).execute()
        return run_id

    def finish_run(self, run_id: str, stats: dict) -> None:
        self.client.table("pipeline_runs").update({
            "finished_at": _utcnow(),
            "status": stats.get("status", "done"),
            **{k: v for k, v in stats.items() if k != "status"},
        }).eq("run_id", run_id).execute()
