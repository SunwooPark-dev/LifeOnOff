# AI Book Publishing / Life AB Test MVP

이 저장소는 원래 AI 출판 프로젝트 워크스페이스였고, 현재는 그 위에 **Life AB Test** 로컬 MVP가 추가되어 있습니다.

## Life AB Test 한 줄 정의
사용자가 두 가지 선택지 A/B를 입력하면, 동일 baseline과 공통 노이즈 위에서 미래 경로를 시뮬레이션해 비교 리포트를 보여주는 인생 AB 테스트 시뮬레이션 앱.

## 현재 포함된 MVP 기능
- A/B 선택지 입력 폼
- 기본값 기반 입력 정규화
- 동일 baseline / 공통 노이즈 기반 공정 비교
- 옵션별 optimistic / base / pessimistic 3경로 생성
- 차원별 점수, 총점, 리스크, 후회, confidence 계산
- Topline verdict / 비교표 / 타임라인 / 리스크 카드 UI
- JSON appendix 출력
- merged master markdown 생성
- PDF-ready export guide 생성
- 로컬 저장 기반 최근 실행 이력

## 실행 방법
```bash
npm run start
```
브라우저에서 `http://localhost:3000` 접속

## 검증 명령
```bash
npm run build
npm run test
npm run generate
```

## 주요 경로
- `public/index.html` - 앱 엔트리
- `public/styles.css` - MVP 스타일
- `src/core/normalize.js` - 입력 정규화
- `src/core/simulator.js` - 시뮬레이션 엔진
- `src/core/report.js` - 리포트 / JSON appendix / merged markdown
- `src/core/storage.js` - 로컬 저장
- `src/ui/app.js` - UI 로직
- `scripts/run-tests.mjs` - 테스트 러너
- `scripts/generate-sample-run.mjs` - 샘플 산출물 생성
- `generated/` - 샘플 merged markdown / JSON appendix / PDF-ready guide

## 기존 출판 프로젝트 문서
- `docs/`
- `manuscript/`
- `marketing/`
- `research/`

기존 문서는 유지되며, Life AB Test MVP 설계/출간용 참고 자료로 함께 활용할 수 있습니다.
