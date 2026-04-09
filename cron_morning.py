import asyncio
import stage_0_benchmark
import stage_a_collect

if __name__ == "__main__":
    print("🌅 [Morning Cron] 아침 파이프라인 가동 시작...")
    
    # 0. 벤치마크 수행 (그날 최고의 모델 라인업 갱신)
    asyncio.run(stage_0_benchmark.main())
    
    # 1. 수집 프로세스 가동
    print("\n🌅 [Morning Cron] 수집 프로세스 가동 시작...")
    asyncio.run(stage_a_collect.main())
    
    # 2. 디스코드 알림 (수동 액션 요청)
    from src.adapters.google_sheets_client import GoogleSheetsClient
    from src.adapters.discord_client import DiscordClient
    
    g_sheets = GoogleSheetsClient()
    records = g_sheets.get_all_records()
    pending_count = sum(1 for r in records if str(r.get("status", "")).strip() == "draft" and not str(r.get("PRO_draft", "")).strip())
    
    if pending_count > 0:
        discord = DiscordClient()
        title = "⏳ [액션 요망] ChatGPT PRO 검수 대기"
        desc = f"선생님, 오늘 갓 수집한 핵심 뉴스 **{pending_count}개**가 엑셀에서 선생님의 ChatGPT PRO 마법을 기다리고 있습니다! 엑셀 G열(`PRO_draft`)에 초안을 복붙해 주시면 저녁 발행 봇이 알아서 처리합니다."
        asyncio.run(discord.send_alert(title, desc, 16766720)) # Yellow
        print(f"디스코드 알림 전송: 대기 항목 {pending_count}개")
        
    print("🌅 [Morning Cron] 완료되었습니다. 시트를 확인해주세요.")
