import asyncio
import httpx
import os
import sys

# 상위 폴더의 src.adapters.env_loader 등을 가져오기 위해 path 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def get_buffer_profiles():
    # .env 파일 로드 시도
    from dotenv import load_dotenv
    load_dotenv()
    
    # 환경 변수에서 토큰 가져오기 (IFLO_ 프리픽스 우선)
    token = os.environ.get("IFLO_BUFFER_API_KEY") or os.environ.get("BUFFER_ACCESS_TOKEN")
    
    if not token:
        print("❌ 오류: IFLO_BUFFER_API_KEY (또는 BUFFER_ACCESS_TOKEN) 환경 변수가 설정되지 않았습니다.")
        print("   Bitwarden 세팅을 통해 .env 파일에 토큰을 먼저 설정해 주세요.")
        return

    print("🔍 Buffer API에 연결하여 프로필 목록을 조회합니다...")
    
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.bufferapp.com/1/profiles.json"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            profiles = response.json()
            
            print("\n✅ 연결된 채널(프로필) ID 목록:")
            print("-" * 50)
            
            for profile in profiles:
                service = profile.get("service")
                formatted_service = profile.get("formatted_service")
                profile_id = profile.get("id")
                username = profile.get("formatted_username")
                
                print(f"[{formatted_service}]")
                print(f"  - 계정명: {username}")
                print(f"  - Profile ID: {profile_id}")
                print(f"  - Bitwarden 연동 키: IFLO_BUFFER_PROFILE_{service.upper()}")
                print("-" * 50)
                
            print("\n📌 위 Profile ID 값들을 Bitwarden의 'Buffer Profile IDs' 항목의 커스텀 필드(X, LinkedIn, Instagram, Facebook)에 각각 입력해 주세요.")
            
        except httpx.HTTPStatusError as e:
            print(f"❌ API 오류: {e.response.status_code}")
            print(e.response.text)
        except Exception as e:
            print(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    asyncio.run(get_buffer_profiles())
