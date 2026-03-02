import os
from dotenv import load_dotenv
import json
import random
import asyncio 
load_dotenv()
email=os.getenv("LINKEDIN_EMAIL")
password=os.getenv("LINKEDIN_PASSWORD")

async def human_delay():
    await asyncio.sleep(random.uniform(1.3,5))

async def login_and_save_cookies(page):
    await page.goto("https://www.linkedin.com/login")
    human_delay()
    await page.fill("#username", email)
    human_delay()
    await page.fill("#password", password)
    human_delay()
    await page.click('[type="submit"]')
    await page.wait_for_load_state("domcontentloaded")
    cookies=await page.context.cookies()
    with open("cookies.json","w") as f:
        json.dump(cookies,f)

async def load_cookies(page):
    if os.path.exists("cookies.json"):
        with open("cookies.json", "r") as f:
            cookies = json.load(f)
        await page.context.add_cookies(cookies)
        await page.goto("https://www.linkedin.com/feed")
    else:
        await login_and_save_cookies(page)

