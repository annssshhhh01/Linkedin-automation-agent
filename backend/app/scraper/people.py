import sys
sys.path.append("C:/Users/Ansh/Desktop/Linkedin_agent/backend/app")
from database.connection import session
from database.models import People, Job, Companies
from config import BAD_POSITIONS, ALUMNI_TECH_PRIORITY,HR_KEYWORDS
from playwright_stealth import Stealth
from auth import human_delay, load_cookies
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from urllib.parse import quote #it handles all special character and instead of space insert %20 so it matches with the url
import asyncio
import os

load_dotenv()

college_id = os.getenv("COLLEGE_ID")

async def find_hr(page,company_name,company_id,db):
    company_slug=company_name.lower().replace(" ","-").replace("&","")   #.replace(old,new)
    for keyword in HR_KEYWORDS:
        url=f"https://www.linkedin.com/company/{company_slug}/people/?keywords={quote(keyword)}"
        await human_delay()
        await page.goto(url)
        await human_delay()
        good_people=[]
        for _ in range(5):
            await page.evaluate("window.scrollBy(0,1000)") 
            await asyncio.sleep(2)    #we use asynio as we it pauses without freezing our code
        current_batch=await page.query_selector_all("li.org-people-profile-card__profile-card-spacing")
        for card in current_batch:
            await card.scroll_into_view_if_needed()  
            await asyncio.sleep(1)
            name_el = await card.query_selector(".artdeco-entity-lockup__title")
            name = await name_el.inner_text() if name_el else ""
            position_el = await card.query_selector(".artdeco-entity-lockup__subtitle")
            position = await position_el.inner_text() if position_el else ""
            link_anchor_tag_el = await card.query_selector("a")
            link = await link_anchor_tag_el.get_attribute("href") if link_anchor_tag_el else ""
            if any(bad.lower() in position.lower() for bad in BAD_POSITIONS):
                continue

            for i,priority in enumerate(HR_KEYWORDS):
                if priority.lower() in position.lower():
                    good_people.append({
                        "name":name,
                        "position":position,
                        "linkedin_url":link,
                        "score":len(HR_KEYWORDS)-i
                    }) 
                    break
        good_people=sorted(good_people,key=lambda x:x["score"] ,reverse=True)[:3]
        if len(good_people)>0:
            #inserting all these in my db
            for people in good_people:
                existing_db=db.query(People).filter(People.linkedin_url==people["linkedin_url"]).first()
                if not existing_db:
                    inserting_data=People(name=people["name"],linkedin_url=people["linkedin_url"],is_alumni=False,position=people["position"],company_id=company_id)
                    db.add(inserting_data)
                    db.commit()   
            break          
        if len(good_people)==0:
            print(f"There is No data available for {company_name}")
    

#this is mainly for alumni 
async def find_people(page, company_name, company_id):
    db = session
    company_slug = company_name.lower().replace(" ", "").replace("&", "")
    url = f"https://www.linkedin.com/company/{company_slug}/people/?facetSchool={college_id}"
    await human_delay()
    await page.goto(url)
    await human_delay()

    good_people = []
    processed_link=set()
    for _ in range(5):
        await page.evaluate("window.scrollBy(0, 1000)")
        await asyncio.sleep(2)

    people_card = await page.query_selector_all(
        "li.org-people-profile-card__profile-card-spacing"
    )
    for card in people_card:
        link_anchor_tag_el = await card.query_selector("a")
        link = await link_anchor_tag_el.get_attribute("href") if link_anchor_tag_el else ""  # we use get-attribute when we want to read the value which is inside the html of that particiular element ex <a href="abc.ssii" /a>
        if link in processed_link:  #it will stop and jump to next card immediately
            continue
        processed_link.add(link)
        name_el = await card.query_selector(".artdeco-entity-lockup__title")
        await card.scroll_into_view_if_needed()  # these two lines are very important as linkedin use lazy loading thus it only loads first seven job so for the next jobs to be able to render we will use .sleep(2) or anything or it load the strong for every job
        await asyncio.sleep(1)
        name = await name_el.inner_text() if name_el else ""
        position_el = await card.query_selector(".artdeco-entity-lockup__subtitle")
        position = await position_el.inner_text() if position_el else ""
        # ----NOW WE WILL STORE ONLY THOSE WHO HAVE HIGHER POSITION PRIORITY AND IF NO ALUMNI THEN FIND THE RECRUITER
        if any(bad.lower() in position.lower() for bad in BAD_POSITIONS):
            continue
        for i, priority in enumerate(
            ALUMNI_TECH_PRIORITY
        ):  # enumerate will store both index and value
            if priority.lower() in position.lower():
                good_people.append(
                    {
                        "name": name,
                        "position": position,
                        "linkedin_url": link,
                        "score": len(ALUMNI_TECH_PRIORITY)- i,  # lower index will have higher score so at last we can add only top scorer to our db
                    }
                )
                break
    good_people = sorted(good_people, key=lambda x: x["score"], reverse=True)[:2]  # sorting based on key which on our case is score

    if len(good_people) == 0:  # run if no alumni is present
        print(f"No alumni found for {company_name},searching HR..")
        await find_hr(page, company_name, company_id, db)
        return

    # -----NOW WE WILL STORE THESE DATA IN OUR PEOPLES TABLE IN DB------
    for person in good_people:
        existing_person = (
            db.query(People)
            .filter(People.linkedin_url == person["linkedin_url"])
            .first()
        )
        if not existing_person:
            inserting_data = People(
                name=person["name"],
                linkedin_url=person["linkedin_url"],
                position=person["position"],
                company_id=company_id,
                is_alumni=True,
            )  # since we are on our college id facetschool url so everyone on this will be our alumni
            db.add(inserting_data)
            db.commit()
            await human_delay()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        stealth = Stealth()
        await stealth.apply_stealth_async(page)
        await load_cookies(page)
        db = session
        # 1-at first what we need to to make a list of all the companies which user has approved so for that we will query in the db the normal query could be SELECT * from jobs / join companies on Jobs.companies.id=companies.id/ where job.status=="approved"

        # since we are using sqlachemy so what dont need any kind of query or foreign key to specifiy it sqlachemy auto uses foreign key to join
        approved_jobs = (db.query(Job, Companies).join(Companies).filter(Job.status_i_approved == "Approved").all())
        for (job,company) in (approved_jobs):  # approved_jobs look like Job(id=1, title="Software Engineer", company_id=1, status_i_approved="Approved"),Companies(id=1, name="Google", location="USA")
            await find_people(page, company.name, job.company_id)
            await human_delay()
        db.close()    
asyncio.run(main())
