"""it consist of all the endpoints""" 

import sys
import os
from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.getenv("MAIN_PATH"))
from database.connection import session
from agent.nodes import resume_parser,matching_score,job_hitl,processing_human_approved_job,note_generator,note_hitl
from database.models import Job, Companies, People, outreach
from pydantic import BaseModel
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
    processing_human_approved_job(body.decision)
    return {"message":"Job Updated"}




