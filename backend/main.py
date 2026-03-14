"""this main.py consist of all the endpoints""" 
import uuid
from fastapi import FastAPI
from dotenv import load_dotenv
from app.scraper.people import main as scrape_people_main
from app.database.connection import session
from app.scraper.jobs import main as scrape_jobs_main
from app.agent.api_graph import score_workflow, notes_workflow
from app.agent.nodes import processing_human_approved_job,processing_note
from app.database.models import Job, Companies, People, outreach
from pydantic import BaseModel
load_dotenv()
app=FastAPI()

@app.get("/")
def root():
    return {"message":"AI Powered Career Outreach"}

@app.get("/health")
def health():
    return {"status":" 200 OK"}

#fetching jobs and sending it to user 
@app.get("/jobs")
def get_job():
    db=session
    jobs=db.query(Job,Companies).join(Companies).filter(Job.company_id==Companies.id).all()
    return[{"id":j.id,
            "role":j.role,
            "matching_score":j.matching_score,
            "matching_reason":j.match_reason,
            "status": j.status_i_approved,
            "company": c.name,
            "location":j.location}
        for j,c in jobs]


#before sending the approved data we need to check it the data is valid so we will ue pydantic for that
class JobApproval(BaseModel):
    decision:dict

@app.post("/approved_jobs")
def approved_job(body:BaseModel):
    processing_human_approved_job(body.decision)   #note that we are handling the approved job from the api end points only and not from graph 
    return {"message":"Job Updated"}

#scrapping job logic
@app.post("/scrap-jobs")
async def scrap_jobs():
    await scrape_jobs_main()  # we will replace this from redis+celery
    return {"message":"Scraping Started"}

#scoring the jobs
@app.post("/scoring_jobs")
def scoring_jobs():
    score_workflow.invoke({},config={"configurable":{"thread_id":str(uuid.uuid4())}})
    return {"message":"Scoring Complete"}

#scraping person
@app.post("/scrape-people")
async def scrape_people():
    await scrape_people_main()
    return {"message":"People Scrapped Succesfully"}

#generating notes
@app.post("/generate-notes")
def generate_notes():
    notes_workflow.invoke({},config={"configurable":{"thread_id":str(uuid.uuid4())}})
    return {"message": "Notes generated successfully"}

#getting the notes for reviewing
@app.get("/fetching-notes")
def fetching_notes():
    db=session
    outreach_notes=db.query(outreach, People, Job).join(People).join(Job).all()
    return{"outreach":[{"id":o.id,"job_id":j.job_id,"note":j.note,"status":j.status,"Human Approval":o.human_approval,"Edited Note":o.edited_note,"Name":p.name,"Position":p.position,"Job Role":j.role} for o,p,j in outreach_notes]}


    #noteApproval

class NoteApproval(BaseModel):
    note_decision:dict

@app.post("/approved-note-generation")
def approved_note(body:NoteApproval):
    processing_note(body.note_decision)
    return {"message":"Your Edited/Updated note is being stored succesfully"}

