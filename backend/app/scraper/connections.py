from playwright_stealth import Stealth
from scraper.auth import human_delay, load_cookies
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from app.database.connection import session
from app.database.models import People,outreach
from sqlalchemy import select
from .auth import human_delay

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=False)
        page=await browser.new_page()
        stealth=Stealth()
        await stealth.apply_stealth_async(page)
        db=session
        #fetching the linkedin url of people from people
        approved=db.query(outreach,People).join(People).filter(outreach.human_approved=="Approved",outreach.status == "Pending").all()
        for outreach_record,people in approved:
            await page.goto(people.linkedin_url)




        
