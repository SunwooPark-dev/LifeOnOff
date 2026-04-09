import asyncio
import stage_b_refine
import stage_c_publish

if __name__ == "__main__":
    print("🌇 [Evening Cron] 정제 및 발행 프로세스 가동 시작...")
    
    # 1. 엑셀에 붙여넣어진 초안 텍스트를 각 SNS 서식으로 정제 (PRO_draft -> PRO_x 등)
    asyncio.run(stage_b_refine.main())
    
    # 2. 정제 완료된 텍스트들을 버퍼(Buffer)를 통해 예약 발행
    asyncio.run(stage_c_publish.main())
    
    print("🌇 [Evening Cron] 모든 작업이 성공적으로 마무리되었습니다.")
