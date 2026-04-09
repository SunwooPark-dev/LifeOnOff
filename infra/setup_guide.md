# 인프라 세팅 가이드 (완전 무료)
**Render + Supabase + Cloudflare R2**

---

## 1단계 — Supabase (PostgreSQL DB)

1. [supabase.com](https://supabase.com) 회원가입 → **New Project** 생성
2. **SQL Editor** 탭 클릭
3. `infra/supabase_schema.sql` 전체 내용 붙여넣기 → **Run** 클릭
4. **Settings → API** 에서 복사:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키 → `SUPABASE_KEY`

> 무료 한도: 500MB 저장, 무제한 행, 2개 프로젝트

---

## 2단계 — Cloudflare R2 (이미지 저장)

1. [dash.cloudflare.com](https://dash.cloudflare.com) 로그인 → **R2** 메뉴
2. **Create Bucket** → 이름: `social-media-assets`
3. **Settings → Public Access** → **Allow Access** 활성화
4. **Manage R2 API Tokens** → **Create API Token**:
   - Permission: `Object Read & Write`
   - 생성 후 복사:
     - `Access Key ID` → `R2_ACCESS_KEY_ID`
     - `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
5. **Account ID** (대시보드 우측) → `R2_ACCOUNT_ID`
6. Public URL 형식: `https://pub-{hash}.r2.dev` → `R2_PUBLIC_URL`

> 무료 한도: 10GB 저장/월, 100만 요청/월

---

## 3단계 — Buffer (소셜 스케줄링)

1. [buffer.com](https://buffer.com) 가입 → X, LinkedIn, Instagram, Facebook 연결
2. [buffer.com/developers/apps](https://buffer.com/developers/apps) → **Create App**
3. **Token** 발급 → `BUFFER_ACCESS_TOKEN`
4. Profile ID 확인:
   ```bash
   curl "https://api.bufferapp.com/1/profiles.json?access_token=YOUR_TOKEN"
   ```
   - 각 플랫폼 `id` 값 → `BUFFER_PROFILE_X`, `BUFFER_PROFILE_LINKEDIN` 등

---

## 4단계 — Render.com (Worker 실행)

1. [render.com](https://render.com) 가입 → GitHub 연결
2. **New → Background Worker**
3. GitHub 레포 선택 (이 프로젝트 업로드 후)
4. 설정:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
   - **Plan:** Free
5. **Environment Variables** 탭 → `.env.example` 의 모든 키 값 입력
6. **Deploy** 클릭

> 무료 한도: 750시간/월 (= 한 달 내내 실행 가능), 512MB RAM

---

## 5단계 — 로컬 테스트

```bash
# 의존성 설치
pip install -r requirements.txt

# .env 설정
cp .env.example .env
# .env 파일에 실제 키 값 입력

# 1회 실행 테스트
python main.py --once

# 예상 출력 (structlog JSON)
# {"event": "step.1.fetch_articles", ...}
# {"event": "step.2.dedup", new=3, skipped=17, ...}
# {"event": "image.uploaded", url="https://pub-xxx.r2.dev/images/abc.png", ...}
# {"event": "article.done", id="xxx", cost=0.083, ...}
# {"event": "run.complete", articles_processed=3, posts_created=12, total_cost_usd=0.25, ...}
```

---

## 비용 예상 (기사 5개/회, 1회/시간 기준)

| 항목 | 단가 | 일 사용량 | 일 비용 |
|---|---|---|---|
| GPT-3.5-turbo (요약) | $0.002/1K | ~5K tokens | $0.01 |
| GPT-4o (플랫폼 텍스트) | $0.015/1K | ~25K tokens | $0.375 |
| DALL-E 3 (이미지) | $0.04/장 | 5장 | $0.20 |
| **일 합계** | | | **~$0.585** |
| **월 합계** | | | **~$17.5** |

> Cloudflare R2, Supabase, Render는 무료 한도 내 처리 가능

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|---|---|---|
| `SUPABASE_KEY` 권한 오류 | `anon` 키 사용 | `service_role` 키 사용 |
| R2 업로드 실패 | RLS or 퍼블릭 설정 미완 | Bucket Public Access 확인 |
| Buffer 403 | Token 만료 | 새 Token 발급 |
| Render Worker 재시작 | 메모리 초과 | `MAX_ARTICLES_PER_RUN=3` 으로 줄이기 |
| OpenClaw 404 | API URL 오류 | `OPENCLAW_BASE_URL` 확인 |
