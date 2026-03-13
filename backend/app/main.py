"""it consist of all the endpoints""" 
import sys
sys.path.append("C:/Users/Ansh/Desktop/Linkedin_agent/backend/app")
from fastapi import FastAPI
from database.connection import session
from database.models import Job, Companies, People, outreach
from dotenv import load_dotenv
load_dotenv()
app=FastAPI()

@app.get("/")
def root():
    return {"message":"AI Powered Career Outreach"}

@app.get("/health")
def health():
    return {"status":"ok"}

#fetching jobs and sending it to user

@app.get("/job")
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


