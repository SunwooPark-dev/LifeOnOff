import asyncio
import os
from dotenv import load_dotenv

load_dotenv('C:/dev/Iflo/.env')

from src.adapters.openclaw import OpenClawClient
from src.adapters.openrouter_client import OpenRouterClient
from src.db.supabase_client import SupabaseDB
from src.adapters.google_sheets_client import GoogleSheetsClient

async def main():
    print("🚀 [Stage A] 뉴스 수집 및 구글 시트 업로드 시작...")
    
    claw = OpenClawClient()
    router = OpenRouterClient()
    db = SupabaseDB()
    g_sheets = GoogleSheetsClient()
    # 테스트를 위해 새로운 키워드로 강제 수집 (무료 API 한도를 위해 15 -> 10으로 줄임)
    articles = await claw.fetch_articles("AI Agent OR AI Startup", limit=10)
    print(f"📥 수집된 기사: {len(articles)}개")
    
    new_articles = []
    for a in articles:
        if not db.is_article_seen(a.id):
            new_articles.append(a)
            
    print(f"🔎 새로운 기사 (중복 필터링 후): {len(new_articles)}개")
    
    if not new_articles:
        print("✅ 처리할 새로운 기사가 없습니다.")
        return

    count = 0
    for idx, article in enumerate(new_articles):
        print(f"({idx+1}/{len(new_articles)}) 요약 및 시트 기록 중: {article.title[:50]}...")
        
        # OpenRouter 요약
        summary = await router.extract_facts(article.title, article.content)
        
        # OpenRouter 7가지 기준 평가 
        scores = await router.evaluate_article(article.title, summary)
        
        db.save_article(article)
        
        # KILL 판정 시 status를 killed로 바꿔 필터링하기 쉽게 저장
        status_val = "draft" if scores.get("decision") == "PROCEED" else "killed"
        db.update_article_status(article.id, status_val)
        
        row_data = [
            article.id, 
            str(article.published_at), 
            article.url, 
            article.title, 
            summary,
            status_val,
            "", # PRO_draft
            "", "", "", "", # PRO_x to PRO_facebook
            scores.get("d1", 0), scores.get("d2", 0), scores.get("d3", 0),
            scores.get("d4", 0), scores.get("d5", 0), scores.get("d6", 0), scores.get("d7", 0),
            scores.get("total", 0),
            scores.get("reason", "")
        ]
        
        # 구글 시트에 Row 추가
        g_sheets.append_draft(row_data)
        count += 1
        
        # OpenRouter 무료 티어 속도 제한(RPM: 분당 요청수) 방지를 위해 7초 대기
        print("  ⏳ [Rate Limit 방지] 다음 기사 처리 전 7초 대기 중...")
        await asyncio.sleep(7)
            
    print(f"🎉 성공! 구글 시트 'Pipeline_Drafts' 탭에 {count}개의 기사가 기록되었습니다.")

if __name__ == "__main__":
    asyncio.run(main())
