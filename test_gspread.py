import asyncio
from src.adapters.google_sheets_client import GoogleSheetsClient

async def main():
    print("🚀 구글 시트 연동 테스트 시작...")
    try:
        g_sheets = GoogleSheetsClient()
        row_data = [
            "test_id_123", 
            "2026-04-08 10:00:00", 
            "https://test.com", 
            "이것은 봇이 성공적으로 연결되었나 테스트하는 제목입니다 🎉", 
            "테스트 팩트 요약입니다.",
            "draft",
            "", "", "", ""
        ]
        g_sheets.append_draft(row_data)
        print("✅ 성공적으로 1tepp3i4NbkEccQXYsPkPjrGZnzu1PQS2GtL_NpgWNrA 엑셀에 [Pipeline_Drafts] 탭을 만들고 데이터를 꽂아넣었습니다!")
    except Exception as e:
        print(f"❌ 실패: {e}")

if __name__ == "__main__":
    asyncio.run(main())
