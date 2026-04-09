import asyncio
from dotenv import load_dotenv

load_dotenv('C:/dev/Iflo/.env')

from src.adapters.openrouter_client import OpenRouterClient
from src.adapters.google_sheets_client import GoogleSheetsClient

async def main():
    print("🚀 [Stage B] AI 검수 및 서식 자동 변환 시작...")
    
    router = OpenRouterClient()
    g_sheets = GoogleSheetsClient()
    
    records = g_sheets.get_all_records()
    if not records:
        print("✅ 시트에 데이터가 없습니다.")
        return
        
    refined_count = 0
    for row in records:
        article_id = str(row.get("id", "")).strip()
        status = str(row.get("status", "")).strip()
        pro_draft = str(row.get("PRO_draft", "")).strip()
        
        # PRO_x (H열)이 비어있지 않다면 이미 처리된 것으로 간주
        pro_x = str(row.get("PRO_x", "")).strip()
        
        if not article_id or status != "draft":
            continue
            
        if not pro_draft or pro_x:
            # 초안이 없거나 이미 변환된 경우 무시
            continue
            
        print(f"⏳ 다듬기 중 [ID: {article_id[:8]}...] (입력된 초안 분석 중)")
        
        refined_data = await router.refine_draft_to_platforms(pro_draft)
        if refined_data:
            x_text = refined_data.get("x", "")
            linkedin_text = refined_data.get("linkedin", "")
            instagram_text = refined_data.get("instagram", "")
            facebook_text = refined_data.get("facebook", "")
            
            # 구글 시트에 업데이트 (H, I, J, K열을 각각 덮어씌움)
            try:
                g_sheets.update_platform_contents(
                    article_id, 
                    x_text, 
                    linkedin_text, 
                    instagram_text, 
                    facebook_text
                )
                print(f"  ✅ 변환 성공 및 시트 업데이트 완료!")
                refined_count += 1
            except Exception as e:
                print(f"  ❌ 시트 업데이트 실패: {e}")
        else:
            print("  ❌ 텍스트 정제 실패 (결과값을 얻지 못함)")
            
        print("  ⏳ [Rate Limit 방지] 다음 기사 처리 전 8초 대기 중...")
        await asyncio.sleep(8.5)

    if refined_count > 0:
        print(f"\n🎉 총 {refined_count}개의 기사 초안이 완벽한 포스팅 서식으로 정제되어 시트에 저장되었습니다!")
        print("이제 엑셀에서 확인해 보시고, 마음에 드시면 `python stage_c_publish.py`를 실행해 발행하세요.")
    else:
        print("\n✅ 현재 PRO_draft 열에 처리할 새로운 초안이 없습니다.")

if __name__ == "__main__":
    asyncio.run(main())
