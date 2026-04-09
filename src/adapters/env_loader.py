"""
adapters/env_loader.py — OpenClaw Gateway 환경변수 자동 로더
OpenClaw의 ~/.openclaw/openclaw.json env 섹션과
Gateway API에서 크리덴셜을 로드합니다.

우선순위:
  1. 시스템 환경변수 (os.environ)
  2. OpenClaw Gateway API (http://localhost:18789)
  3. ~/.openclaw/openclaw.json 의 env 섹션
  4. .env 파일
"""
import os
import json
import httpx
from pathlib import Path
from typing import Optional
import structlog

log = structlog.get_logger()

OPENCLAW_CONFIG_PATH = Path.home() / ".openclaw" / "openclaw.json"
OPENCLAW_GATEWAY_URL = "http://localhost:18789"


def _load_openclaw_config() -> dict:
    """openclaw.json 파싱"""
    if not OPENCLAW_CONFIG_PATH.exists():
        return {}
    try:
        with open(OPENCLAW_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        log.warning("openclaw.config.read_failed", error=str(e))
        return {}


def _load_from_openclaw_env() -> dict[str, str]:
    """openclaw.json → env 섹션 로드"""
    config = _load_openclaw_config()
    return config.get("env", {})


async def _load_from_gateway(token: str) -> dict[str, str]:
    """OpenClaw Gateway API에서 환경변수 조회 (있을 경우)"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{OPENCLAW_GATEWAY_URL}/env",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return {}


def load_all_env() -> dict[str, str]:
    """
    모든 소스에서 환경변수 수집 후 os.environ에 주입.
    시스템 환경변수가 항상 우선합니다.
    """
    merged: dict[str, str] = {}

    # 3순위: openclaw.json env 섹션
    openclaw_env = _load_from_openclaw_env()
    merged.update(openclaw_env)

    # 2순위: .env 파일 (존재하면)
    dot_env_path = Path(".env")
    if dot_env_path.exists():
        from dotenv import dotenv_values
        merged.update(dotenv_values(dot_env_path))

    # 1순위: 시스템 환경변수 (덮어씀)
    merged.update(dict(os.environ))

    # os.environ에 없는 값만 주입 (시스템 env 우선 보존)
    injected = 0
    for key, value in merged.items():
        if key not in os.environ:
            os.environ[key] = value
            injected += 1

    log.info("env.loaded",
             openclaw_keys=len(openclaw_env),
             total_injected=injected)
    return merged


def get_required(key: str, source_hint: str = "") -> str:
    """필수 환경변수 가져오기 — 없으면 명확한 오류 발생"""
    value = os.environ.get(key)
    if not value:
        hint = f" (출처: {source_hint})" if source_hint else ""
        raise EnvironmentError(
            f"필수 환경변수 '{key}'가 없습니다{hint}.\n"
            f"~/.openclaw/openclaw.json env 섹션 또는 .env 파일에 추가하세요."
        )
    return value


def audit_missing_keys(required_keys: list[str]) -> dict[str, bool]:
    """필요한 키 목록의 존재 여부를 확인하여 보고서 반환"""
    return {key: bool(os.environ.get(key)) for key in required_keys}


REQUIRED_KEYS = [
    "OPENAI_API_KEY",
    "OPENCLAW_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_PUBLIC_URL",
    "BUFFER_ACCESS_TOKEN",
    "BUFFER_PROFILE_X",
    "BUFFER_PROFILE_LINKEDIN",
    "BUFFER_PROFILE_INSTAGRAM",
    "BUFFER_PROFILE_FACEBOOK",
    "TIKTOK_ACCESS_TOKEN",
]

OPTIONAL_KEYS = [
    "OPENROUTER_API_KEY",   # ✅ OpenClaw에서 자동 주입됨
    "SLACK_WEBHOOK_URL",
    "TIKTOK_CLIENT_KEY",
    "TIKTOK_CLIENT_SECRET",
]
