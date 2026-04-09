"""
adapters/buffer_client.py — Buffer API GraphQL 어댑터 (C항)
최신 Buffer GraphQL API(https://api.buffer.com)를 연동합니다.
이전 v1 REST API 대신, 최신 Organization 기반 CreateIdea Mutation을 수행합니다.
문서 참고: https://developers.buffer.com/guides/getting-started.html
"""
import httpx
from datetime import datetime, timezone, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel
from typing import Optional, Dict
from src.config import settings
import os

class BufferPostResult(BaseModel):
    platform: str
    buffer_id: str
    scheduled_at: str
    success: bool
    error: Optional[str] = None


class BufferClient:
    # 가장 최신 GraphQL 엔드포인트 URL입니다.
    BASE_URL = "https://api.buffer.com"
    # 확인된 Organization ID
    ORG_ID = "69d59e41442d53c0af817744"

    def __init__(self):
        # IFLO_ 프리픽스 환경변수를 우선 탐색하고, 없으면 settings 사용
        self.token = os.environ.get("IFLO_BUFFER_API_KEY") or getattr(settings, "BUFFER_ACCESS_TOKEN", "")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
    async def get_channels(self) -> Dict[str, str]:
        """조직에 연결된 모든 채널의 서비스명과 ID를 가져옵니다."""
        query = """
        query GetChannels {
          account {
            organizations {
              channels {
                id
                service
                name
              }
            }
          }
        }
        """
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.BASE_URL, headers=self.headers, json={"query": query})
            if resp.status_code == 200:
                data = resp.json()
                channels = data.get("data", {}).get("account", {}).get("organizations", [{}])[0].get("channels", [])
                # service: id 매핑 (예: 'twitter': '12345')
                return {c["service"].lower(): c["id"] for c in channels}
            return {}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
    async def create_post(self, channel_id: str, text: str, service: str) -> BufferPostResult:
        """지정된 채널의 대기열(Queue)에 '최적의 시간'으로 직접 포스팅을 예약합니다."""
        query = """
        mutation CreateAutoPost($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post {
                id
                dueAt
              }
            }
            ... on MutationError {
              message
            }
          }
        }
        """
        
        variables = {
            "input": {
                "channelId": channel_id,
                "text": text,
                "schedulingType": "automatic",
                "mode": "addToQueue" # Buffer의 최적 스케줄링 알고리즘 사용!
            }
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                self.BASE_URL,
                headers=self.headers,
                json={"query": query, "variables": variables}
            )

        if resp.status_code == 200:
            data = resp.json()
            result = data.get("data", {}).get("createPost", {})
            
            if "message" in result: # MutationError 발생 시
                return BufferPostResult(
                    platform=service, buffer_id="", scheduled_at="FAILED",
                    success=False, error=result["message"]
                )
            
            post_id = result.get("post", {}).get("id", "")
            due_at = result.get("post", {}).get("dueAt", "Pending")
            return BufferPostResult(
                platform=service,
                buffer_id=post_id,
                scheduled_at=due_at,
                success=True
            )
        else:
            return BufferPostResult(
                platform=service, buffer_id="", scheduled_at="ERROR",
                success=False, error=f"HTTP {resp.status_code}"
            )

    async def schedule_all(self, content_map: Dict[str, str], image_url: Optional[str] = None) -> list[BufferPostResult]:
        """자동 매핑된 모든 채널에 '최적 시간'으로 동시 사격"""
        import asyncio
        
        # 1. 현재 대시보드에 연결된 채널 정보 싱크
        active_channels = await self.get_channels()
        print(f"📡 Buffer 채널 동기화 완료: {list(active_channels.keys())}")

        tasks = []
        # 플랫폼 이름 매핑 (코드 내부 명칭 -> Buffer 서비스 명칭)
        platform_mapping = {
            "x": "twitter",
            "linkedin": "linkedin",
            "instagram": "instagram",
            "facebook": "facebook"
        }

        for internal_name, text in content_map.items():
            service_name = platform_mapping.get(internal_name, internal_name)
            channel_id = active_channels.get(service_name)
            
            if channel_id:
                print(f"  🎯 {internal_name} 사격 목표 확인: {channel_id}")
                tasks.append(self.create_post(channel_id, text, internal_name))
            else:
                print(f"  ⚠️ {internal_name} 채널이 Buffer에 연결되지 않았습니다. 스킵합니다.")

        if not tasks:
            return []
            
        return await asyncio.gather(*tasks)
