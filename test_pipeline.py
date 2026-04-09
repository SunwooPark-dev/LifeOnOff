import asyncio
import os
from dotenv import load_dotenv

# 사용자 환경변수 로드
load_dotenv('C:/dev/Iflo/.env')

# 테스트를 위해 기사 1개만 처리하도록 설정 오버라이드
os.environ["PIPELINE_MAX_ARTICLES_PER_RUN"] = "1"

from src.pipeline.orchestrator import PipelineOrchestrator

async def main():
    print("🚀 Starting Pipeline E2E Test (1 Article)...")
    orchestrator = PipelineOrchestrator()
    
    try:
        stats = await orchestrator.run()
        print("\n✅ Pipeline Test Completed Successfully!")
        print("="*40)
        for k, v in stats.items():
            print(f"- {k}: {v}")
        print("="*40)
    except Exception as e:
        print(f"\n❌ Pipeline Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
