import asyncio
from src.adapters.discord_client import DiscordClient

async def main():
    discord = DiscordClient()
    title = "🎉 디스코드 연동 성공!"
    desc = "선생님, 파이프라인 디스코드 봇이 정상적으로 연결되었습니다! 이제부터 이곳으로 아침/저녁 보고를 올리겠습니다. 🫡"
    await discord.send_alert(title, desc, 3447003)
    print("✅ 테스트 알림 전송 완료!")

if __name__ == "__main__":
    asyncio.run(main())
