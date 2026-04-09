-- ============================================================
-- Supabase PostgreSQL Schema
-- social-media-pipeline v1.0.0
-- SQL Editor에서 실행: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- ============================================================

-- 처리된 기사 (중복 방지)
CREATE TABLE IF NOT EXISTS articles (
    id              TEXT PRIMARY KEY,          -- OpenClaw article.id
    title           TEXT NOT NULL,
    source_url      TEXT NOT NULL,
    published_at    TIMESTAMPTZ,
    source_id       TEXT,
    priority_score  FLOAT DEFAULT 0,
    status          TEXT DEFAULT 'pending',    -- pending | processing | done | failed | skipped
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 플랫폼별 포스트
CREATE TABLE IF NOT EXISTS platform_posts (
    id              BIGSERIAL PRIMARY KEY,
    article_id      TEXT REFERENCES articles(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL,             -- X | LinkedIn | Instagram | Facebook | TikTok
    text            TEXT,
    script          TEXT,                      -- TikTok 스크립트
    hashtags        TEXT[],
    image_url       TEXT,
    video_url       TEXT,
    schedule_utc    TIMESTAMPTZ,
    buffer_post_id  TEXT,                      -- Buffer 등록 후 반환 ID
    moderation_pass BOOLEAN DEFAULT FALSE,
    moderation_flags TEXT[],
    char_count      INT,
    status          TEXT DEFAULT 'pending',    -- pending | scheduled | posted | failed
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- OpenAI 사용량 추적 (비용 관리)
CREATE TABLE IF NOT EXISTS openai_usage (
    id              BIGSERIAL PRIMARY KEY,
    article_id      TEXT REFERENCES articles(id),
    model           TEXT,
    tokens_used     INT,
    cost_usd        FLOAT,
    purpose         TEXT,                      -- summary | platform_text | moderation | image
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 파이프라인 실행 로그
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id              BIGSERIAL PRIMARY KEY,
    run_id          TEXT UNIQUE NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    articles_fetched INT DEFAULT 0,
    articles_new    INT DEFAULT 0,
    articles_processed INT DEFAULT 0,
    posts_created   INT DEFAULT 0,
    total_cost_usd  FLOAT DEFAULT 0,
    status          TEXT DEFAULT 'running',    -- running | done | failed
    error_message   TEXT
);

-- 성과 지표 (Buffer/Analytics에서 주기적으로 Pull)
CREATE TABLE IF NOT EXISTS post_analytics (
    id              BIGSERIAL PRIMARY KEY,
    platform_post_id BIGINT REFERENCES platform_posts(id),
    measured_at     TIMESTAMPTZ DEFAULT NOW(),
    impressions     INT DEFAULT 0,
    clicks          INT DEFAULT 0,
    likes           INT DEFAULT 0,
    comments        INT DEFAULT 0,
    shares          INT DEFAULT 0,
    engagement_rate FLOAT DEFAULT 0
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_posts_article ON platform_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_status ON platform_posts(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);

-- Row Level Security (기본 비활성화, 서버 사이드 전용)
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE openai_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics DISABLE ROW LEVEL SECURITY;
