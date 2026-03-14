from playwright_stealth import Stealth
from scraper.auth import human_delay, load_cookies
from playwright.async_api import async_playwright
from app.database.connection import session
from app.database.models import People,outreach

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=False)
        page=await browser.new_page()
        await load_cookies(page)
        stealth=Stealth()
        await stealth.apply_stealth_async(page)
        db=session
        #fetching the linkedin url of people from people
        approved=db.query(outreach,People).join(People).filter(outreach.human_approved=="Approved",outreach.status == "Pending").all()
        for outreach_record,people in approved:
            note=outreach_record.edited_note if outreach_record.edited_note else outreach_record.note
            await page.goto(people.linkedin_url)
            await human_delay()
            connect_btn = await page.query_selector('a[aria-label*="Invite" i]')  #it at any point it will find invite in aria label it will slect it even id it is in mid sentence starting or at last
            if not connect_btn:
                more_btn = await page.query_selector('button:has-text("More")')
                if more_btn:
                    await more_btn.click()
                    await human_delay()
                    connect_btn = await page.query_selector('div[aria-label*="Invite" i]')
            if connect_btn:
                await connect_btn.click()
                await human_delay()
                add_note_btn = await page.query_selector('button[aria-label="Add a note"]')
                if add_note_btn:
                    await add_note_btn.click()
                    await human_delay()
                    text=await page.query_selector('textarea[name="message"]')
                    if text:
                        await text.fill(note)
                        await human_delay()
                    send_btn=await page.query_selector('button[aria-label="Send invitation"]')  
                    if send_btn:
                        await send_btn.click()
                        await human_delay()
                        outreach_record.status="Sent"
                        db.commit()





        
