# 🦞 Project Handoff: Autonomous Social Media Content Pipeline

This document provides a comprehensive overview of the **Social Media Content Pipeline** project for seamless coordination between AI agents (CA, OC, OMX) and long-term maintenance.

## 🛠 Tech Stack & Infrastructure
- **Language**: Python 3.11+
- **Execution & Hosting**: [Render](https://render.com) (Cron Jobs)
- **Database**: [Supabase](https://supabase.com) (Article filtering, persistence)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (Reserved for future media/short-form assets)
- **Integration Layer**: 
  - **Google Sheets API**: Main human-in-the-loop (HITL) interface for content review.
  - **OpenRouter API**: News summarization, scoring, and multi-platform text refinement.
  - **Buffer API**: Multi-platform (X, LinkedIn, FB, Instagram) scheduling.
  - **Discord Webhook**: Real-time status reporting and action prompts.

## 🛰 Architecture & Workflow (Hybrid Automation)

### Phase 1: Morning Loop (Discovery)
1. **`stage_0_benchmark.py`**: Dynamically pings 20+ free OpenRouter models (Nvidia, Google, Meta, etc.) and picks the top 5 fastest/intelligent candidates for today's fallback list.
2. **`stage_a_collect.py`**: Fetches RSS feeds (Google News AI/Startup), filters duplicates via Supabase, scores quality (D1-D7), and pushes to **Google Sheets**.
3. **Discord Alert**: Sends a "Action Required" notification (Yellow) if there are new articles pending review.

### Phase 2: User Action (Quality Control)
1. **Human (ChatGPT PRO)**: User reviews the summary in Google Sheets, generates high-quality drafts using ChatGPT PRO, and pastes the raw output into the `PRO_draft` (G column).

### Phase 3: Evening Loop (Refinement & Publishing)
1. **`stage_b_refine.py`**: Reads `PRO_draft`, uses today's top-performing AI model to polish grammar, fix typos, and split the text into platform-specific posts (X, LinkedIn, etc.) in cols H-K.
2. **`stage_c_publish.py`**: Grabs polished text and pushes to **Buffer** for scheduled posting.
3. **Discord Alert**: Sends a "Successful Publish" notification (Green) with a preview of the content.

## 📁 Key Directories & Files
- `/src/adapters/`: API clients for Buffer, Discord, Google Sheets, OpenRouter.
- `/src/db/`: Supabase client and query logic.
- `cron_morning.py` & `cron_evening.py`: Entry points for Render scheduling.
- `.env`: Central secret management (Buffer, Supabase, R2, OpenRouter, Google, Discord).

## 🚀 Future Roadmap (TODO)
- **TikTok/Shorts Integration**: Fully activate TikTok token refresh and multi-part media uploads.
- **Image/Video Generation**: Link DALL-E 3 or Stable Diffusion to create platform-specific visuals based on the article content.
- **Advanced YouTube Analysis**: Extend the pipeline to analyze YouTube transcripts (work-in-progress).

---
**Status**: `Active & Operational`
**Last Updated**: 2026-04-08
**Maintainer Note**: Ensure `.env` is properly populated on any new environment. Access to Google Sheet "Pipeline_Drafts" is mandatory.
