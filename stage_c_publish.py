import asyncio
from dotenv import load_dotenv

load_dotenv('C:/dev/Iflo/.env')

from src.adapters.buffer_client import BufferClient
from src.db.supabase_client import SupabaseDB
from src.adapters.google_sheets_client import GoogleSheetsClient
from src.adapters.discord_client import DiscordClient

async def main():
    print("🚀 [Stage C] 버퍼 예약 (구글 시트 연동) 시작...")
    
    buffer = BufferClient()
    db = SupabaseDB()
    g_sheets = GoogleSheetsClient()
    
    records = g_sheets.get_all_records()
    if not records:
        print("✅ 시트에 데이터가 없습니다.")
        return
        
    published_count = 0
    for row in records:
        article_id = str(row.get("id", "")).strip()
        status = str(row.get("status", "")).strip()
        
        # 이미 완료되었거나 아이디가 없는 행 무시
        if not article_id or status == "published":
            continue
            
        platforms_to_post = {}
        for plat in ["x", "linkedin", "instagram", "facebook"]:
            # PRO_{plat} 열 데이터 존재 여부 검사
            col_name = f"PRO_{plat}"
            content = str(row.get(col_name, "")).strip()
            if content:
                platforms_to_post[plat] = content
        
        if not platforms_to_post:
            continue
            
        print(f"⏳ 업로드 중 [ID: {article_id[:8]}...] (대상 플랫폼: {list(platforms_to_post.keys())})")
        
        # 버퍼 예약 실행 (텍스트 기반)
        try:
            results = await buffer.schedule_all(platforms_to_post, image_url=None)
            
            error_happened = False
            for res in results:
                if res.success:
                    print(f"  ✅ {res.platform} 예약 완료 (Idea ID: {res.buffer_id})")
                else:
                    print(f"  ❌ {res.platform} 예약 오류: {res.error}")
                    error_happened = True
                    
            if not error_happened:
                # 성공 시 DB와 엑셀 시트 모두 상태를 'published'로 업데이트
                db.update_article_status(article_id, "completed")
                g_sheets.update_status_by_id(article_id, "published")
                published_count += 1
                
                # 디스코드 발행 성공 알림!
                discord = DiscordClient()
                title = "🚀 SNS 자동 발행 완료!"
                preview = list(platforms_to_post.values())[0][:150].replace('\n', ' ') + "..."
                desc = f"**{', '.join(platforms_to_post.keys())}** 채널에 포스팅을 성공적으로 예약/발행했습니다!\n\n📝 **미리보기:**\n> {preview}"
                await discord.send_alert(title, desc, 5763719) # Green
                
        except Exception as e:
            print(f"  ❌ 치명적 오류 발생: {e}")

    if published_count > 0:
        print(f"\n🎉 총 {published_count}개의 기사 그룹이 성공적으로 Buffer에 예약 완료되었습니다!")
    else:
        print("\n✅ 새로 발행할 준비가 된 (PRO 작성된) 기사가 없습니다.")

if __name__ == "__main__":
    asyncio.run(main())
