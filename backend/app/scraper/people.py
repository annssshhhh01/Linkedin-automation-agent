import sys
sys.path.append("C:/Users/Ansh/Desktop/Linkedin_agent/backend/app")
from database.connection import session
from database.models import People, Job, Companies
from playwright_stealth import Stealth
from auth import human_delay,load_cookies
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import asyncio
import os
load_dotenv()

college_id=os.getenv("COLLEGE_ID")
async def find_people(page, company_name,company_id ):
        db=session
        url=f"https://www.linkedin.com/company/{company_name}/people/?facetSchool={college_id}"
        await human_delay()
        await page.goto(url)
        await human_delay() 

        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(2) 

        people_card=await page.query_selector_all('li.org-people-profile-card__profile-card-spacing')

        for card in people_card:
            name_el=await card.query_selector(".artdeco-entity-lockup__title")
            await card.scroll_into_view_if_needed() #these two lines are very important as linkedin use lazy loading thus it only loads first seven job so for the next jobs to be able to render we will use .sleep(2) or anything or it load the strong for every job
            await asyncio.sleep(1)
            name=await name_el.inner_text() if name_el else ""
            position_el=await card.query_selector(".artdeco-entity-lockup__subtitle")
            position=await position_el.inner_text() if position_el else ""
            link_anchor_tag_el=await card.query_selector("a")
            link=await link_anchor_tag_el.get_attribute("href") if link_anchor_tag_el else "" # we use get-attribute when we want to read the value which is inside the html of that particiular element ex <a href="abc.ssii" /a>

        #-----NOW WE WILL STORE THESE DATA IN OUR PEOPLES TABLE IN DB------

            existing_person=db.query(People).filter(People.linkedin_url==link).first()
            if not existing_person:
                 inserting_data=People(name=name,linkedin_url=link,position=position,company_id=company_id,is_alumni=True) #since we are on our college id facetschool url so everyone on this will be our alumni
                 db.add(inserting_data)
                 db.commit()
                 await human_delay()
                           
        db.close()         



async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=False)
        page=await browser.new_page()
        stealth=Stealth()
        await stealth.apply_stealth_async(page)
        await load_cookies(page)
        db=session
    #1-at first what we need to to make a list of all the companies which user has approved so for that we will query in the db the normal query could be SELECT * from jobs / join companies on Jobs.companies.id=companies.id/ where job.status=="approved"

    #since we are using sqlachemy so what dont need any kind of query or foreign key to specifiy it sqlachemy auto uses foreign key to join
        approved_jobs=db.query(Job,Companies).join(Companies).filter(Job.status_i_approved=="Approved").all()
        for job,company in approved_jobs: # approved_jobs look like Job(id=1, title="Software Engineer", company_id=1, status_i_approved="Approved"),Companies(id=1, name="Google", location="USA")
            await find_people(page,company.name,job.company_id)
            await human_delay()
asyncio.run(main())            






