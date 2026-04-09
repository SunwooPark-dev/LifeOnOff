"""
pipeline/orchestrator.py — 메인 파이프라인 조율
10단계 파이프라인을 순서대로 실행하며 각 단계의 오류를 격리합니다.
"""
import asyncio
import structlog
from datetime import datetime, timezone
from src.config import settings
from src.adapters.openclaw import OpenClawClient
from src.adapters.openai_client import OpenAIClient, UsageRecord
from src.adapters.buffer_client import BufferClient
from src.storage.r2_client import R2Client
from src.db.supabase_client import SupabaseDB
from src.pipeline.validator import TextValidator

log = structlog.get_logger()


async def _notify_slack(message: str) -> None:
    """Slack 알림 전송 (선택)"""
    if not settings.SLACK_WEBHOOK_URL:
        return
    import httpx
    async with httpx.AsyncClient() as client:
        await client.post(settings.SLACK_WEBHOOK_URL, json={"text": message})


class PipelineOrchestrator:
    def __init__(self):
        self.openclaw = OpenClawClient()
        self.openai   = OpenAIClient()
        self.buffer   = BufferClient()
        self.r2       = R2Client()
        self.db       = SupabaseDB()
        self.validator = TextValidator()

    async def run(self) -> dict:
        """파이프라인 1회 실행 — 통계 딕셔너리 반환"""
        run_id = self.db.start_run()
        stats = {
            "articles_fetched": 0,
            "articles_new": 0,
            "articles_processed": 0,
            "posts_created": 0,
            "total_cost_usd": 0.0,
        }

        try:
            # ── Step 1: 뉴스 수집 ─────────────────────────────────────
            log.info("step.1.fetch_articles")
            articles = await self.openclaw.fetch_articles(
                topic="ai", limit=20
            )
            stats["articles_fetched"] = len(articles)

            # ── Step 2: 중복 필터 + 우선순위 ──────────────────────────
            new_articles = [
                a for a in articles
                if not self.db.is_article_seen(a.id)
            ]
            stats["articles_new"] = len(new_articles)
            log.info("step.2.dedup", new=len(new_articles), skipped=len(articles)-len(new_articles))

            # 우선순위 점수 (최신 순)
            new_articles.sort(
                key=lambda a: a.published_at or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True
            )
            new_articles = new_articles[:settings.PIPELINE_MAX_ARTICLES_PER_RUN]

            # ── Step 3~10: 기사별 처리 ────────────────────────────────
            for article in new_articles:
                self.db.save_article(article)
                result = await self._process_article(article)
                if result["success"]:
                    stats["articles_processed"] += 1
                    stats["posts_created"] += result["posts_created"]
                    stats["total_cost_usd"] += result["cost_usd"]

            self.db.finish_run(run_id, {**stats, "status": "done"})
            await _notify_slack(
                f"✅ Pipeline done | articles:{stats['articles_processed']} "
                f"posts:{stats['posts_created']} "
                f"cost:${stats['total_cost_usd']:.4f}"
            )

        except Exception as e:
            log.error("pipeline.failed", error=str(e))
            self.db.finish_run(run_id, {"status": "failed", "error_message": str(e)})
            await _notify_slack(f"🔴 Pipeline FAILED: {e}")
            raise

        return stats

    async def _process_article(self, article) -> dict:
        """단일 기사 처리 (Step 3~10)"""
        usages: list[UsageRecord] = []
        log.info("article.start", id=article.id, title=article.title[:50])

        try:
            self.db.update_article_status(article.id, "processing")

            # Step 3a: GPT-3.5 빠른 요약
            summary, usage_sum = await self.openai.summarize(article.title, article.content)
            usages.append(usage_sum)

            # Step 3b: 5개 플랫폼 텍스트 병렬 생성
            texts, usage_plats = await self.openai.generate_all_platforms(
                summary, article.company or "AI"
            )
            usages.extend(usage_plats)

            # Step 4: Moderation 검증
            mod = await self.openai.moderate(texts)
            if not mod.passed:
                log.warning("moderation.failed", flags=mod.flags, article_id=article.id)
                self.db.update_article_status(article.id, "failed")
                await _notify_slack(f"⚠️ Moderation blocked: {article.title[:60]} | flags: {mod.flags}")
                return {"success": False, "posts_created": 0, "cost_usd": 0}

            # Step 4b: 문자수 검증
            validated = self.validator.validate_and_fix(texts)

            # Step 5: DALL-E 이미지 생성
            img_result, usage_img = await self.openai.generate_image(
                article.company or "AI", summary
            )
            usages.append(usage_img)

            # Step 6: Cloudflare R2 업로드 → 영구 공개 URL
            public_image_url = await self.r2.upload_from_url(img_result.url)
            log.info("image.uploaded", url=public_image_url)

            # Step 7: 플랫폼별 스케줄 시각 결정 (Buffer 내부에서 계산)
            # Step 8: Buffer 스케줄 등록 (병렬)
            buffer_results = await self.buffer.schedule_all(
                texts={
                    "X":         validated.x,
                    "LinkedIn":  validated.linkedin,
                    "Instagram": validated.instagram,
                    "Facebook":  validated.facebook,
                },
                image_url=public_image_url,
            )

            # Step 9: DB 기록
            self.db.log_usage(article.id, usages)
            post_ids = self.db.save_platform_posts(
                article_id=article.id,
                texts=validated,
                image_url=public_image_url,
                schedules={r.platform: r.scheduled_at for r in buffer_results},
                moderation_passed=mod.passed,
                moderation_flags=mod.flags,
            )
            for i, r in enumerate(buffer_results):
                if r.success and i < len(post_ids):
                    self.db.update_post_buffer_id(post_ids[i], r.buffer_id)

            self.db.update_article_status(article.id, "done")
            total_cost = sum(u.cost_usd for u in usages)
            log.info("article.done", id=article.id, cost=total_cost)
            return {"success": True, "posts_created": len(buffer_results), "cost_usd": total_cost}

        except Exception as e:
            log.error("article.failed", id=article.id, error=str(e))
            self.db.update_article_status(article.id, "failed")
            return {"success": False, "posts_created": 0, "cost_usd": 0}
