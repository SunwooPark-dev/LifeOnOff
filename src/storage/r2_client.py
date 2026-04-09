"""
storage/r2_client.py — Cloudflare R2 이미지 업로드
boto3 S3 호환 API를 사용합니다 (R2는 S3 API를 그대로 지원).
"""
import boto3
import httpx
import uuid
import aiofiles
import asyncio
from pathlib import Path
from botocore.config import Config as BotoConfig
from src.config import settings


class R2Client:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=BotoConfig(signature_version="s3v4"),
            region_name="auto",
        )
        self.bucket = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL.rstrip("/")

    async def upload_from_url(self, image_url: str, prefix: str = "images") -> str:
        """DALL-E URL에서 이미지를 다운로드해 R2에 업로드. 공개 URL 반환."""
        # 1. 이미지 다운로드
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            content_type = resp.headers.get("content-type", "image/png")

        # 2. R2 업로드 (동기 boto3을 스레드풀에서 실행)
        key = f"{prefix}/{uuid.uuid4().hex}.png"
        await asyncio.to_thread(
            self.s3.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=image_bytes,
            ContentType=content_type,
        )

        return f"{self.public_url}/{key}"

    async def upload_bytes(self, data: bytes, key: str, content_type: str = "image/png") -> str:
        """바이트 데이터를 직접 R2에 업로드."""
        await asyncio.to_thread(
            self.s3.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{self.public_url}/{key}"

    def get_public_url(self, key: str) -> str:
        return f"{self.public_url}/{key}"
