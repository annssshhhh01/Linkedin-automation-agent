"""this main.py consist of all the endpoints""" 
import uuid
import json
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.scraper.people import main as scrape_people_main
from app.database.connection import session
from app.scraper.jobs import main as scrape_jobs_main
from app.agent.api_graph import score_workflow, notes_workflow
from app.agent.nodes import processing_human_approved_job,processing_note
from app.database.models import Job, Companies, People, outreach
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.scraper.connections import main as connection_main

# Global executor and future tracking for cancellable tasks
global_executor = ThreadPoolExecutor(max_workers=5)
active_tasks = {}
active_flags = {}

from app.scraper.connections import main as connection_main
load_dotenv()
app=FastAPI()

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== WebSocket Connection Manager =====
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
        await websocket.send_text(json.dumps({
            "message": "Welcome to CareerPilot Terminal v1.0",
            "type": "success"
        }))
        await websocket.send_text(json.dumps({
            "message": "Backend connected. All systems operational.",
            "type": "system"
        }))
        while True:
            # Keep connection alive, listen for any client messages
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({
                "message": f"Received: {data}",
                "type": "info"
            }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
    answer=[{"id":j.id,
            "role":j.role,
            "matching_score":j.matching_score,
            "matching_reason":j.match_reason,
            "status": j.status_i_approved,
            "company": c.name,
            "location":j.location}
        for j,c in jobs]
    db.close()
    return {"jobs":answer}


#before sending the approved data we need to check it the data is valid so we will ue pydantic for that
class JobApproval(BaseModel):
    decisions:dict

@app.post("/approved_jobs") 
#in swagger to test this it should be
#  #{
#   "decisions": {
#     "job_id": true
#   }
# }
def approved_job(body:JobApproval):
    processing_human_approved_job(body.decisions)   #note that we are handling the approved job from the api end points only and not from graph 
    return {"message":"Job Updated"}

#scrapping job logic
@app.post("/cancel-action/{action_name}")
async def cancel_action(action_name: str):
    if action_name in active_tasks:
        task = active_tasks[action_name]
        task.cancel()
        del active_tasks[action_name]
        await manager.broadcast(f"{action_name} was stopped by user", "warning")
        return {"message": f"{action_name} stopped"}
    return {"message": "No active task found"}

@app.post("/scrape-jobs")
async def scrap_jobs():
    await manager.broadcast("starting job scraper...", "info")
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(global_executor, lambda: asyncio.run(scrape_jobs_main(manager=manager)))
    active_tasks["scrape"] = task
    try:
        await task
        await manager.broadcast("scraping jobs complete", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("scrape", None)
    return {"message":"Scraping Started"}

#scoring the jobs
@app.post("/scoring_jobs")
async def scoring_jobs():
    await manager.broadcast("scoring jobs...", "info")
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(global_executor, lambda: score_workflow.invoke({},config={"configurable":{"thread_id":str(uuid.uuid4())}}))
    active_tasks["score"] = task
    try:
        await task
        await manager.broadcast("scoring complete", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("score", None)
    return {"message":"Scoring Complete"}

#scraping person
@app.post("/scrape-people")
async def scrape_people():
    await manager.broadcast("scraping people...", "info")
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(global_executor, lambda: asyncio.run(scrape_people_main()))
    active_tasks["people"] = task
    try:
        await task
        await manager.broadcast("people scraped successfully", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("people", None)
    return {"message":"People Scrapped Succesfully"}

#generating notes
@app.post("/generate-notes")
async def generate_notes():
    await manager.broadcast("generating custom notes...", "info")
    loop = asyncio.get_event_loop()
    task = loop.run_in_executor(global_executor, lambda: notes_workflow.invoke({},config={"configurable":{"thread_id":str(uuid.uuid4())}}))
    active_tasks["notes"] = task
    try:
        await task
        await manager.broadcast("notes generated", "success")
    except asyncio.CancelledError:
        pass
    finally:
        active_tasks.pop("notes", None)
    return {"message": "Notes generated successfully"}

#getting the notes for reviewing
@app.get("/fetching-notes")
def fetching_notes():
    db=session
    outreach_notes=db.query(outreach, People, Job).join(People).join(Job).all()
    result=[{"id":o.id,"job_id":j.job_id,"note":o.note,"status":o.status,"Human Approval":o.human_approved,"Edited Note":o.edited_note,"Name":p.name,"Position":p.position,"Job Role":j.role} for o,p,j in outreach_notes]
    db.close()
    return{"outreach":result}


    #noteApproval

class NoteApproval(BaseModel):
    note_decision:dict

@app.post("/approved-note-generation")
def approved_note(body:NoteApproval):
    processing_note(body.note_decision)
    return {"message":"Your Edited/Approved note is being stored succesfully"}
 # sending connections to the person selected or approved

@app.post("/send-connection")
async def send_connection():
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        await loop.run_in_executor(pool, lambda: asyncio.run(connection_main()))
    return {"message": "Connections sent"}