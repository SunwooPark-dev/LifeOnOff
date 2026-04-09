"""
adapters/openclaw.py — RSS 기반 최신 IT 뉴스 수집기 (개조판)
기존의 유효하지 않은 API 주소 대신, 구글 뉴스 RSS 등 실시간 피드를 
크롤링하여 기사 형식으로 파싱합니다. 외부 의존성 없이 즉시 작동합니다.
"""
import httpx
import xml.etree.ElementTree as ET
import uuid
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional
from pydantic import BaseModel
from structlog import get_logger

log = get_logger()

class Article(BaseModel):
    id: str
    title: str
    url: str
    content: str
    published_at: Optional[datetime] = None
    source_id: Optional[str] = None
    company: Optional[str] = "AI Tech" 


class OpenClawClient:
    def __init__(self):
        pass

    def _strip_html(self, text: str) -> str:
        """HTML 태그 제거"""
        if not text:
            return ""
        return re.sub(r'<[^>]+>', '', text).strip()

    async def fetch_articles(
        self,
        topic: str = "ai",
        limit: int = 20,
        language: str = "en",
    ) -> list[Article]:
        """웹에서 RSS 피드를 다운로드하여 정규화된 Article 배열로 변환합니다."""
        import urllib.parse
        articles = []
        
        encoded_query = urllib.parse.quote(topic)
        source_url = f"https://news.google.com/rss/search?q={encoded_query}+when:1d&hl=en-US&gl=US&ceid=US:en"
        
        async with httpx.AsyncClient(timeout=30) as client:
            log.info("openclaw.fetch_rss", url=source_url)
            try:
                resp = await client.get(source_url)
                resp.raise_for_status()
                
                root = ET.fromstring(resp.text)
                items = root.findall(".//item")
                
                for item in items[:limit]:
                    title = item.findtext("title") or ""
                    link = item.findtext("link") or ""
                    pub_date_str = item.findtext("pubDate")
                    description = item.findtext("description") or title
                    
                    clean_title = title.split(" - ")[0] if " - " in title else title
                    company_match = title.split(" - ")[-1] if " - " in title else "AI Tech"
                    
                    published_at = None
                    if pub_date_str:
                        try:
                            published_at = parsedate_to_datetime(pub_date_str)
                        except Exception:
                            pass
                    
                    a = Article(
                        id=uuid.uuid5(uuid.NAMESPACE_URL, link).hex,
                        title=clean_title,
                        url=link,
                        content=self._strip_html(description),
                        published_at=published_at,
                        source_id="google_news_rss",
                        company=company_match
                    )
                    articles.append(a)
            except Exception as e:
                log.error("openclaw.rss_fetch.failed", source=source_url, error=str(e))
                    
        # 최신 발행일 순 정렬
        articles.sort(
            key=lambda x: x.published_at.timestamp() if x.published_at else 0, 
            reverse=True
        )
        return articles[:limit]

    async def fetch_article_content(self, article_id: str) -> str:
        """기사 전문이 필요할 때 호출되는 함수 (여기서는 RSS 요약본으로 대체하므로 빈 문자열)"""
        return ""
