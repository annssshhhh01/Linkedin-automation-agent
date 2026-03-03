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
            await human_delay()
            job_cards=await page.query_selector_all('li[data-occludable-job-id]')
            print(f"Found {len(job_cards)} cards for role: {role}")


            for card in job_cards:
                    await card.scroll_into_view_if_needed() #these two lines are very important as linkedin use lazy loading thus it only loads first seven job so for the next jobs to be able to render we will use .sleep(2) or anything or it load the strong for every job
                    await asyncio.sleep(0.5)
                    job_id = await card.get_attribute("data-occludable-job-id")
                    
                    title_el = await card.query_selector("strong")
                    if not title_el:
                        print(f"SKIPPED card with job_id: {job_id}")
                        continue 
                        
                    title = await title_el.inner_text()
                    company_el = await card.query_selector(".artdeco-entity-lockup__subtitle")
                    if company_el:
                        company = (await company_el.inner_text()).strip()
                    
                    location = ""
                    location_el = await card.query_selector(".artdeco-entity-lockup__caption")
                    if location_el:
                        location = (await location_el.inner_text()).strip()
                    await human_delay()
                    #after clicking fetching the jd
                    await card.click()
                    await page.wait_for_url(f"**{job_id}**") 
                    await human_delay()
                    jd_el=await page.wait_for_selector("#job-details")
                    if jd_el:
                         jd=await jd_el.inner_text()
                    else:
                         jd="Discription not found"     
                    
                    print({
                        "job-id":job_id,
                        "title":title,
                        "company":company,
                        "location":location,
                        "jd":jd
                    })
if __name__ == "__main__":
    asyncio.run(main())            