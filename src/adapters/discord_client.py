import os
import aiohttp
from dotenv import load_dotenv

load_dotenv('C:/dev/Iflo/.env')

class DiscordClient:
    def __init__(self):
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    async def send_alert(self, title: str, description: str, color: int = 3447003):
        """디스코드 Webhook으로 예쁜 임베드 메시지 전송"""
        if not self.webhook_url:
            print("  ⚠️ [Discord] DISCORD_WEBHOOK_URL이 설정되지 않아 알림을 스킵합니다.")
            return
            
        embed = {
            "title": title,
            "description": description,
            "color": color
        }
        
        payload = {"embeds": [embed]}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload, timeout=5) as resp:
                    if resp.status not in (200, 204):
                        print(f"  ❌ [Discord] 전송 실패: {resp.status}")
        except Exception as e:
            print(f"  ❌ [Discord] 전송 에러: {e}")
