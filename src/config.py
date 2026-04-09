"""
config.py — 환경 변수 중앙 관리
IFLO_ 프리픽스 통일 (keybox bootstrap-env.ps1과 정합)
우선순위: 시스템 env > keybox .env > openclaw.json env 섹션
"""
import os
from dotenv import load_dotenv

load_dotenv()   # keybox가 생성한 .env 로드


class Config:
    # OpenAI & OpenRouter
    OPENAI_API_KEY: str = os.environ.get("IFLO_OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.environ.get("IFLO_OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY", "")
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))

    # OpenClaw
    OPENCLAW_API_KEY: str = os.getenv("IFLO_OPENCLAW_API_KEY") or os.getenv("OPENCLAW_API_KEY", "")
    OPENCLAW_BASE_URL: str = os.getenv("OPENCLAW_BASE_URL", "https://api.openclaw.io/v1")

    # Supabase (IFLO_SUPABASE_* → keybox: "IFLO Supabase")
    SUPABASE_URL: str = os.environ.get("IFLO_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.environ.get("IFLO_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY", "")

    # Cloudflare R2 (IFLO_R2_* → keybox: "Cloudflare R2")
    R2_ACCOUNT_ID: str = os.getenv("IFLO_R2_ACCOUNT_ID") or os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("IFLO_R2_ACCESS_KEY_ID") or os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("IFLO_R2_SECRET_ACCESS_KEY") or os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("IFLO_R2_BUCKET_NAME") or os.getenv("R2_BUCKET_NAME", "social-media-assets")
    R2_PUBLIC_URL: str = os.getenv("IFLO_R2_PUBLIC_URL") or os.getenv("R2_PUBLIC_URL", "")

    # Buffer (IFLO_BUFFER_* → keybox: "Buffer API Key", "Buffer Profile IDs")
    BUFFER_ACCESS_TOKEN: str = os.getenv("IFLO_BUFFER_API_KEY") or os.getenv("BUFFER_ACCESS_TOKEN", "")
    BUFFER_PROFILE_X: str = os.getenv("IFLO_BUFFER_PROFILE_X") or os.getenv("BUFFER_PROFILE_X", "")
    BUFFER_PROFILE_LINKEDIN: str = os.getenv("IFLO_BUFFER_PROFILE_LINKEDIN") or os.getenv("BUFFER_PROFILE_LINKEDIN", "")
    BUFFER_PROFILE_INSTAGRAM: str = os.getenv("IFLO_BUFFER_PROFILE_INSTAGRAM") or os.getenv("BUFFER_PROFILE_INSTAGRAM", "")
    BUFFER_PROFILE_FACEBOOK: str = os.getenv("IFLO_BUFFER_PROFILE_FACEBOOK") or os.getenv("BUFFER_PROFILE_FACEBOOK", "")

    # TikTok (IFLO_TIKTOK_* → keybox: "TikTok Access Token", "TikTok Developer App")
    TIKTOK_ACCESS_TOKEN: str = os.getenv("IFLO_TIKTOK_ACCESS_TOKEN") or os.getenv("TIKTOK_ACCESS_TOKEN", "")
    TIKTOK_CLIENT_KEY: str = os.getenv("IFLO_TIKTOK_CLIENT_KEY") or os.getenv("TIKTOK_CLIENT_KEY", "")
    TIKTOK_CLIENT_SECRET: str = os.getenv("IFLO_TIKTOK_CLIENT_SECRET") or os.getenv("TIKTOK_CLIENT_SECRET", "")

    # Slack (선택)
    SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")

    # Google Sheets
    GOOGLE_CREDENTIALS_PATH: str = os.getenv("IFLO_GOOGLE_CREDENTIALS_PATH", r"C:\Users\sunwo\Downloads\iflo-sheets-bot-52d3237ac4cc.json")
    GOOGLE_CREDENTIALS_JSON: str = os.getenv("IFLO_GOOGLE_CREDENTIALS_JSON", "")
    SPREADSHEET_ID: str = os.getenv("IFLO_SPREADSHEET_ID", "1tepp3i4NbkEccQXYsPkPjrGZnzu1PQS2GtL_NpgWNrA")

    # Pipeline
    PIPELINE_CRON_INTERVAL_HOURS: int = int(os.getenv("PIPELINE_CRON_INTERVAL_HOURS", "1"))
    PIPELINE_MAX_ARTICLES_PER_RUN: int = int(os.getenv("PIPELINE_MAX_ARTICLES_PER_RUN", "5"))
    PIPELINE_RETRY_MAX: int = int(os.getenv("PIPELINE_RETRY_MAX", "3"))


settings = Config()
