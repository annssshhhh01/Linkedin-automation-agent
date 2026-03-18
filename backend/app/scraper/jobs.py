from playwright_stealth import Stealth
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import os
import asyncio
from .auth import load_cookies,human_delay

load_dotenv()

import sys
sys.path.append("C:/Users/Ansh/Desktop/Linkedin_agent/backend/app")
from database.connection import sessionlocal
from database.models import Job, Companies

async def main(manager=None):
    async with async_playwright() as p:
        browser= await p.chromium.launch(headless=False) # headless=false means the browser ui will show and we can see each step 
        page=await browser.new_page()
        stealth=Stealth()
        await stealth.apply_stealth_async(page)
        await load_cookies(page)
        roles=os.getenv("JOB_ROLES").split(",")
        location=os.getenv("Location")
        
        for role in roles:
            if manager:
                await manager.broadcast(f"scraping {role}...", "info")
            url = f"https://www.linkedin.com/jobs/search/?keywords={role}&location={location}&f_TPR=r86400"
            await page.goto(url)
            await human_delay()
            job_cards=await page.query_selector_all('li[data-occludable-job-id]')
            if manager:
                await manager.broadcast(f"found {len(job_cards)} cards for {role}", "success")
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
                    # now we will store all the data in postgre
                    db=sessionlocal()
                    existing_company=db.query(Companies).filter(Companies.name==company).first() #we use first so wheneverit found out the company name then it stop it is like limits in db
                    if not existing_company: 
                         company_record=Companies(name=company)
                         db.add(company_record)
                         db.commit()
                         db.refresh(company_record) # we need to use refresh as postgre will insert the ele but python wont know so  we use refresh so python knows the assigned value
                    else:
                         company_record=existing_company
                    #for jobs
                    existing_job=db.query(Job).filter(Job.job_id==job_id).first()
                    if not existing_job:
                         job_record=Job(job_id=job_id,
                                    company_id=company_record.id,
                                    key_requirements=jd,
                                    location=location,
                                    role=title)
                         db.add(job_record)
                         db.commit()

                    db.close()     
                    if manager:
                        await manager.broadcast(f"stored: {title} at {company}", "info")
                    
                    print({
                        "job-id":job_id,
                        "title":title,
                        "company":company,
                        "location":location,
                    })
# if __name__ == "__main__":
#     asyncio.run(main())            