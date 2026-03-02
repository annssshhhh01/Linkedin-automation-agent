from playwright_stealth import Stealth
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import os
import asyncio
from auth import load_cookies,human_delay
load_dotenv()
async def main():
    async with async_playwright() as p:
        browser= await p.chromium.launch(headless=False)
        page=await browser.new_page()
        stealth=Stealth()
        await stealth.apply_stealth_async(page)
        await load_cookies(page)
        roles=os.getenv("JOB_ROLES").split(",")
        location=os.getenv("Location")
        
        for role in roles:
            url = f"https://www.linkedin.com/jobs/search/?keywords={role}&location={location}&f_TPR=r86400"
            await page.goto(url)
            human_delay()
if __name__ == "__main__":
    asyncio.run(main())            