# Social Media Automation Pipeline
# Render.com (Worker) + Supabase (PostgreSQL) + Cloudflare R2

## 기술 스택
- **실행 환경:** Render.com Background Worker (무료)
- **데이터베이스:** Supabase PostgreSQL (무료 500MB)
- **파일 저장:** Cloudflare R2 (무료 10GB/월)
- **LLM:** OpenAI GPT-4o + DALL-E 3
- **소셜:** Buffer API + TikTok API
- **뉴스 소스:** OpenClaw API

## 디렉토리 구조
```
social-media-pipeline/
├── src/
│   ├── adapters/
│   │   ├── openclaw.py       # OpenClaw API 클라이언트
│   │   ├── openai_client.py  # OpenAI (텍스트 + 이미지 + Moderation)
│   │   └── buffer_client.py  # Buffer API (X, LinkedIn, IG, FB)
│   ├── platforms/
│   │   ├── x_twitter.py      # X 텍스트 생성
│   │   ├── linkedin.py       # LinkedIn 텍스트 생성
│   │   ├── instagram.py      # Instagram 텍스트 생성
│   │   ├── facebook.py       # Facebook 텍스트 생성
│   │   └── tiktok.py         # TikTok 스크립트 생성
│   ├── storage/
│   │   └── r2_client.py      # Cloudflare R2 업로드
│   ├── db/
│   │   └── supabase_client.py# Supabase PostgreSQL
│   ├── pipeline/
│   │   ├── orchestrator.py   # 메인 파이프라인 조율
│   │   ├── validator.py      # 정책·문자수 검증
│   │   └── scheduler.py      # APScheduler (Cron)
│   └── config.py             # 환경 변수 관리
├── infra/
│   ├── render.yaml           # Render 배포 설정
│   ├── supabase_schema.sql   # DB 스키마
│   └── setup_guide.md        # 인프라 세팅 가이드
├── requirements.txt
├── .env.example
└── main.py                   # 진입점
```

## 빠른 시작
```bash
# 1. 의존성 설치
pip install -r requirements.txt

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 키 값 입력

# 3. DB 스키마 적용
# Supabase SQL Editor에서 infra/supabase_schema.sql 실행

# 4. 로컬 테스트
python main.py --once

# 5. Render 배포
# Render Dashboard → New Background Worker → GitHub 연결
```
