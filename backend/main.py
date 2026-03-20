"""this main.py consist of all the endpoints"""

import uuid
import json
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.scraper.people import main as scrape_people_main
from app.database.connection import get_db
from app.scraper.jobs import main as scrape_jobs_main
from app.agent.api_graph import score_workflow, notes_workflow
from app.agent.nodes import processing_human_approved_job, processing_note
from app.database.models import Job, Companies, People, outreach, User
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.scraper.connections import main as connection_main
from app.auth import hash_password, verify_password, create_token, get_current_user
from app.s3 import upload_resume

# Global executor and future tracking for cancellable tasks
global_executor = ThreadPoolExecutor(max_workers=5)
active_tasks = {}
active_flags = {}

from app.scraper.connections import main as connection_main

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str, msg_type: str = "info"):
        data = json.dumps({"message": message, "type": msg_type})
        for connection in self.active_connections:
            try:
                await connection.send_text(data)
            except:
                pass


manager = ConnectionManager()
@app.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(
            json.dumps(
                {"message": "Welcome to CareerPilot Terminal v1.0", "type": "success"}
            )
        )
        await websocket.send_text(
            json.dumps(
                {
                    "message": "Backend connected. All systems operational.",
                    "type": "system",
                }
            )
        )
        while True:
            # Keep connection alive, listen for any client messages
            data = await websocket.receive_text()
            await websocket.send_text(
                json.dumps({"message": f"Received: {data}", "type": "info"})
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def root():
    return {"message": "AI Powered Career Outreach"}


@app.get("/health")
def health():
    return {"status": " 200 OK"}


class RegisterBody(BaseModel):
    email: str
    password: str


@app.post("/register")
def register(body: RegisterBody,db=Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}


@app.post("/login")
def login(body: RegisterBody,db=Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token(user.id), "token_type": "bearer"}

#we will take all the necessary info from the user like college id ,name,linkedin user,pass
class OnBoardingBody(BaseModel):
    college:str
    college_id:str
    linkedin_email:str
    linkedin_password:str

@app.post("/onboarding")
def onboarding(body:OnBoardingBody,current_user=Depends(get_current_user),db=Depends(get_db)):
    user=db.query(User).filter(User.id==current_user.id).first()
    user.college=body.college
    user.college_id=body.college_id
    user.linkedin_email=body.linkedin_email
    user.linkedin_password=body.linkedin_password
    db.commit()
    return {"Message":"Onboarding Complete"}
    
@app.post("/upload-resume")
async def upload_to_s3(file:UploadFile=File(...),db=Depends(get_db),current_user=Depends(get_current_user)): #File(...) is a way to say it is not optional and you have to insert the value
    byte=await file.read()  #.read() converts the file to raw bytes like number which is understood by computer
    name=file.filename #it tells us the name of that file
    url=upload_resume(file_bytes=byte,user_id=current_user.id,filename=name)
    user=db.query(User).filter(User.id==current_user.id).first()
    user.resume_path=url
    db.commit()
    return {"Success":"Document Uploaded Successfully"}    







# fetching jobs and sending it to user
@app.get("/jobs")
def get_job(db=Depends(get_db),current_user = Depends(get_current_user)): # Depends(oauth2_scheme) it will fetches all the token and return the user details of that token 
    jobs = (db.query(Job, Companies).join(Companies).filter(Job.company_id == Companies.id,Job.user_id==current_user.id).all()
    )
    answer = [
        {
            "id": j.id,
            "role": j.role,
            "matching_score": j.matching_score,
            "matching_reason": j.match_reason,
            "status": j.status_i_approved,
            "company": c.name,
            "location": j.location,
        }
        for j, c in jobs
    ]
    return {"jobs": answer}


# before sending the approved data we need to check it the data is valid so we will ue pydantic for that
class JobApproval(BaseModel):
    decisions: dict


@app.post("/approved_jobs")
# in swagger to test this it should be
#  #{
#   "decisions": {
#     "job_id": true
#   }
# }
def approved_job(body: JobApproval,current_user = Depends(get_current_user)):
    processing_human_approved_job(
        body.decisions
    )  # note that we are handling the approved job from the api end points only and not from graph
    return {"message": "Job Updated"}


@app.post("/cancel-action/{action_name}")
async def cancel_action(action_name: str,current_user = Depends(get_current_user)):
    if action_name in active_tasks:
        task = active_tasks[action_name]
        task.cancel()
        del active_tasks[action_name]
        await manager.broadcast(f"{action_name} was stopped by user", "warning")
        return {"message": f"{action_name} stopped"}
    return {"message": "No active task found"}


class ScrapeJobsBody(BaseModel):
    roles: List[str] = []
    locations: List[str] = []

# scrapping job logic
@app.post("/scrape-jobs")  # celery+redis
async def scrap_jobs(body: ScrapeJobsBody, current_user=Depends(get_current_user)): #we are using current user so fastapi knows if user is valid or invalid and if invalid it will through an error 
    await manager.broadcast("starting job scraper...", "info")
    user_id = current_user.id
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(
        global_executor, lambda: asyncio.run(scrape_jobs_main(manager=manager, user_id=user_id, roles=body.roles, locations=body.locations))
    )
    active_tasks["scrape"] = task
    try:
        await task
        await manager.broadcast("scraping jobs complete", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("scrape", None)
    return {"message": "Scraping Started"}


# scoring the jobs
@app.post("/scoring_jobs")
async def scoring_jobs(current_user = Depends(get_current_user)):
    await manager.broadcast("scoring jobs...", "info")
    
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(
        global_executor,
        lambda: score_workflow.invoke(
            {"user_id": current_user.id}, config={"configurable": {"thread_id": str(uuid.uuid4())}}
        ),
    )
    active_tasks["score"] = task
    try:
        await task
        await manager.broadcast("scoring complete", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("score", None)
    return {"message": "Scoring Complete"}


# scraping person
@app.post("/scrape-people")
async def scrape_people(current_user = Depends(get_current_user)):
    await manager.broadcast("scraping people...", "info")
    user_id = current_user.id
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(
        global_executor, lambda: asyncio.run(scrape_people_main(user_id))
    )
    active_tasks["people"] = task
    try:
        await task
        await manager.broadcast("people scraped successfully", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("people", None)
    return {"message": "People Scrapped Succesfully"}


# generating notes
@app.post("/generate-notes")
async def generate_notes(current_user = Depends(get_current_user)):
    await manager.broadcast("generating custom notes...", "info")
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(
        global_executor,
        lambda: notes_workflow.invoke(
            {"user_id": current_user.id}, config={"configurable": {"thread_id": str(uuid.uuid4())}}
        ),
    )
    active_tasks["notes"] = task
    try:
        await task
        await manager.broadcast("notes generated", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("notes", None)
    return {"message": "Notes generated successfully"}


# getting the notes for reviewing
@app.get("/fetching-notes")
def fetching_notes(db=Depends(get_db),current_user = Depends(get_current_user)):
    outreach_notes = db.query(outreach, People, Job).join(People).join(Job).filter(outreach.user_id==current_user.id).all()
    result = [
        {
            "id": o.id,
            "job_id": j.job_id,
            "note": o.note,
            "status": o.status,
            "Human Approval": o.human_approved,
            "Edited Note": o.edited_note,
            "Name": p.name,
            "Position": p.position,
            "Job Role": j.role,
        }
        for o, p, j in outreach_notes
    ]
    return {"outreach": result}

    # noteApproval


class NoteApproval(BaseModel):
    note_decision: dict


@app.post("/approved-note-generation")
def approved_note(body: NoteApproval,current_user = Depends(get_current_user)):
    processing_note(body.note_decision)
    return {"message": "Your Edited/Approved note is being stored succesfully"}


# sending connections to the person selected or approved


@app.post("/send-connection")
async def send_connection(current_user = Depends(get_current_user)):
    
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        await loop.run_in_executor(pool, lambda: asyncio.run(connection_main(user_id=current_user.id)))
    return {"message": "Connections sent"}
