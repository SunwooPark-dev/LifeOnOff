import asyncio
from dotenv import load_dotenv
load_dotenv('C:/dev/Iflo/.env')
from src.adapters.openai_client import OpenAIClient
async def main():
    try:
        c = OpenAIClient()
        res = await c.client.chat.completions.create(model='gpt-3.5-turbo', messages=[{'role': 'user', 'content': 'hello'}])
        print("Success!", res.choices[0].message.content)
    except Exception as e:
        print("Error:", type(e).__name__, e)
asyncio.run(main())
