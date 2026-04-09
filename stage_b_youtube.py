import argparse
import asyncio
import datetime
import urllib.parse as urlparse
import uuid
from youtube_transcript_api import YouTubeTranscriptApi
from src.adapters.openrouter_client import OpenRouterClient
from src.adapters.google_sheets_client import GoogleSheetsClient

def extract_video_id(url: str) -> str:
    """유튜브 URL에서 비디오 ID를 안전하게 추출합니다."""
    parsed_url = urlparse.urlparse(url)
    if parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:]
    if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
        if parsed_url.path == '/watch':
            p = urlparse.parse_qs(parsed_url.query)
            return p['v'][0]
        if parsed_url.path.startswith('/embed/'):
            return parsed_url.path.split('/')[2]
        if parsed_url.path.startswith('/v/'):
            return parsed_url.path.split('/')[2]
    raise ValueError(f"Could not extract video ID from URL: {url}")

def get_transcript(video_id: str) -> str:
    """유튜브 비디오에서 자막을 추출합니다 (한국어 최우선, 없으면 영어)."""
    client = YouTubeTranscriptApi()
    transcripts = client.fetch(video_id, languages=['ko', 'en'])
    # In v1.2.4 fetch returns a list of FetchedTranscriptSnippet objects
    text = " ".join([t.text for t in transcripts])
    return text

async def summarize_transcript(client: OpenRouterClient, text: str) -> str:
    """자막 텍스트를 바탕으로 핵심 인사이트 3가지를 요약합니다."""
    system_prompt = (
        "You are an expert analyst. Read the following youtube video transcript and "
        "provide 3 clear, actionable, and insightful bullet points in Korean. "
        "Focus on the main arguments, unique ideas, and conclusions."
    )
    user_prompt = f"Transcript:\n{text}"
    
    # max_tokens 제한에 걸릴 수 있으므로 앞 15000자만 보냅니다
    user_prompt = user_prompt[:15000]
    
    resp = await client.client.chat.completions.create(
        model=client.fallback_models[0],
        temperature=0.3,
        max_tokens=500,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content.strip()

async def main():
    parser = argparse.ArgumentParser(description="YouTube to Notebook (Google Sheets)")
    parser.add_argument("url", help="YouTube video URL")
    args = parser.parse_args()

    url = args.url
    print(f"🚀 [Stage B - YouTube] 비디오 분석 시작: {url}")
    
    try:
        video_id = extract_video_id(url)
        print(f"✅ 비디오 ID 추출 완료: {video_id}")
    except Exception as e:
        print(f"❌ URL 파싱 실패: {e}")
        return

    try:
        print("📡 유튜브 자막 추출 중...")
        text = get_transcript(video_id)
        print(f"✅ 자막을 성공적으로 가져왔습니다 (길이: {len(text)}자)")
    except Exception as e:
        print(f"❌ 자막 추출 실패 (자막이 없는 영상일 수 있습니다): {e}")
        return

    print("🧠 AI(OpenRouter)를 통해 핵심 인사이트 분석 중...")
    ai_client = OpenRouterClient()
    insights = await summarize_transcript(ai_client, text)
    print("✅ 인사이트 분석 완료!\n")
    print("-" * 40)
    print(insights)
    print("-" * 40)

    print("\n📊 구글 스프레드시트에 저장 중...")
    sheets_client = GoogleSheetsClient()
    
    # 탭 이름은 YouTube_Notebook으로 지정, 헤더가 없으면 자동 생성
    sheet_name = "YouTube_Notebook"
    headers = ["ID", "날짜", "유튜브 URL", "추출된 인사이트", "원본 자막(일부)"]
    
    # GoogleSheetsClient 객체 내부의 get_or_create_worksheet 헬퍼를 사용 (우리가 방금 추가함)
    sheets_client.get_or_create_worksheet(sheet_name, headers=headers)
    
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    row_data = [
        str(uuid.uuid4())[:8],
        now_str,
        url,
        insights,
        text[:1000] + "..." # 엑셀 셀 크기를 고려해 1000자만 저장
    ]
    
    sheets_client.append_to_sheet(sheet_name, row_data)
    print("🎉 성공! 구글 스프레드시트 'YouTube_Notebook' 탭에 저장이 완료되었습니다.")

if __name__ == "__main__":
    asyncio.run(main())
