import os
from dotenv import load_dotenv
import json
import random
import asyncio 
from app.database.models import User
from app.database.connection import sessionlocal
load_dotenv()
async def human_delay():
    await asyncio.sleep(random.uniform(1.3,5))

async def login_and_save_cookies(page,user_id):
    try:
        db=sessionlocal()
        user=db.query(User).filter(User.id==user_id).first()
        email=user.linkedin_email
        password=user.linkedin_password
    finally:
        db.close()
    await page.goto("https://www.linkedin.com/login")
    await human_delay()
    await page.fill("#username", email)
    await human_delay()
    await page.fill("#password", password)
    await human_delay()
    await page.click('[type="submit"]')
    await page.wait_for_load_state("domcontentloaded")
    cookies=await page.context.cookies()
    cookie_path = f"cookies/user_{user_id}"
    os.makedirs(cookie_path, exist_ok=True)  #make a directory cookie path whose parent is also possible 
    with open(f"{cookie_path}/cookies.json", "w") as f:
        json.dump(cookies, f)

async def load_cookies(page,user_id):
    cookie_path = f"cookies/user_{user_id}/cookies.json"
    if os.path.exists(cookie_path):
        with open(cookie_path, "r") as f:
            cookies = json.load(f)
        await page.context.add_cookies(cookies)
        await page.goto("https://www.linkedin.com/feed")
    else:
        await login_and_save_cookies(page,user_id)

