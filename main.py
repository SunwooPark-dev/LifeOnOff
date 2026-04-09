"""
main.py — 진입점
--once   : 즉시 1회 실행 (로컬 테스트용)
--audit  : 환경변수 키 존재 여부만 확인 후 종료
--cron   : APScheduler로 주기 실행 (Render 배포용, 기본값)

환경변수 로드 우선순위:
  1. 시스템 os.environ
  2. ~/.openclaw/openclaw.json env 섹션  ← OpenClaw 자동 주입
  3. .env 파일
"""
import asyncio
import argparse
import structlog

# ── OpenClaw 환경변수 먼저 로드 ───────────────────────────────────────────
from src.adapters.env_loader import load_all_env, audit_missing_keys, REQUIRED_KEYS, OPTIONAL_KEYS
load_all_env()   # os.environ에 OpenClaw 크리덴셜 주입

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.pipeline.orchestrator import PipelineOrchestrator
from src.config import settings

log = structlog.get_logger()


async def run_once():
    orchestrator = PipelineOrchestrator()
    stats = await orchestrator.run()
    log.info("run.complete", **stats)
    return stats


def run_cron():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_once,
        "interval",
        hours=settings.PIPELINE_CRON_INTERVAL_HOURS,
        id="social_media_pipeline",
        max_instances=1,        # 중복 실행 방지
        coalesce=True,
    )
    scheduler.start()
    log.info(
        "scheduler.started",
        interval_hours=settings.PIPELINE_CRON_INTERVAL_HOURS,
    )

    loop = asyncio.get_event_loop()
    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        log.info("scheduler.stopped")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    args = parser.parse_args()

    if args.once:
        asyncio.run(run_once())
    else:
        run_cron()
