from langchain_groq import ChatGroq
from ..database.models import Job,People,Companies
from langgraph.types import interrupt
from ..database.connection import session
from sqlalchemy import select # it is used to fetch the db
from .prompts import resume_parser_prompt,matching_score_prompt,alumni_note_prompt,hr_note_prompt,employee_note_prompt
from .state import AgentState
from pypdf import PdfReader
from rag.retriever import retrieved_data
from dotenv import load_dotenv
import json
import os
load_dotenv()
pdf_path=os.getenv("RESUME_PATH")
model=ChatGroq(model="llama-3.1-8b-instant")

def safe_parse_json(content):
    content = content.strip()
    if "```" in content:
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()
    
    # find just the first JSON object
    start = content.find("{")
    end = content.rfind("}") + 1
    content = content[start:end]
    
    return json.loads(content)

# it will take the resume and write it in json format so it becomes easier to match a score
def resume_parser(state:AgentState):
    reader=PdfReader(pdf_path)
    resume_text=""
    for page in reader.pages:
        resume_text+=page.extract_text()
    prompt = resume_parser_prompt.format(resume_text=resume_text)
    result = model.invoke(prompt)
    parsed_resume = safe_parse_json(result.content)  
    return{"resume":parsed_resume} 

#it will take resume and givr you a matching score
def matching_score(state:AgentState):
    pointing_the_data=select(Job.job_id,Job.key_requirements)  # it will prepare the query but not execute it the query would be "Select key_requirements from JOB"
    resume=state["resume"]
    db=session
    result=session.execute(pointing_the_data)
    fetched_jd=result.all() # this line will give us all the rows corresponding to that column and store it in a list 
    for job_id,jd in fetched_jd:
        prompt=matching_score_prompt.format(resume=resume,jd=jd)
        llm_output=model.invoke(prompt)
        parsed_score=safe_parse_json(llm_output.content)
        job_record=db.query(Job).filter(Job.job_id==job_id).first()
        score=parsed_score["score"]
        reason=parsed_score["reason"]
        #updating result in db
        job_record.matching_score=score
        job_record.match_reason=reason
        db.commit()
    matched_score=db.query(Job).filter(Job.matching_score>=60).all()  #storing only those which have score >60
    db.close()    
    return {"jobs":[{"id":j.id,"role":j.role,"score":j.matching_score} for j in matched_score]} # storing only those with score higher than 60

#now human in the loop will come which will ask the user if it approves or not
def job_hitl(state:AgentState):
    db=session
    matched_score=db.query(Job).filter(Job.matching_score>=60).all()
    jobs_data=[{"id":j.job_id,"role": j.role, "score": j.matching_score,"reason": j.match_reason,"company_id":j.company_id} for j in matched_score]
    return interrupt({
        "type":"job_selection",
        "jobs":jobs_data,
        "message":"Do You Want to approve this or not? (Y/N)"
    })

#this node will process and update the db when user approved the job_hitl

def processing_human_approved_job(state:AgentState):
    decision=state["human_approval"] # it contain job id and approved/not_approved
    db=session
    for job_id,approved in decision.items():# we use .items() as in dict we have 2 key value so if we dont use this then we conly fetch first one which is id:job_id and cant approve:true false
        job=db.query(Job).filter(Job.job_id==job_id).first()
        if not job:
            print(f"Job {job_id} not found in DB")
            continue
        if approved:
            job.status_i_approved="Approved"
        else:
            job.status_i_approved="Rejected"
        db.commit()
    db.close()
    return state            

def note_generator(state:AgentState):
    db=session
    approved_job=state["jobs"]
    for job in approved_job: #job consist of id,role score
        job_id=job["id"]
        people=db.query(People).filter(People.company_id==job["company_id"]).all()
        company=db.query(Companies).filter(Companies.id==job["company_id"]).first()
        for person in people:
            data_retrieved=retrieved_data(job_id)
            if person.is_alumni==True:
                prompt=alumni_note_prompt.format(
                    name=People.name,
                    college=os.getenv("COLLEGE"),
                    job_role=job["role"],
                    company=company.name,
                    skills=data_retrieved,
                )
            else:
                position_lower = person.position.lower()
                if any(i in position_lower for i in ["recruiter", "hr", "talent", "hiring"]):
                    prompt = hr_note_prompt.format(
                        name=person.name,
                        job_role=job["role"],
                        company=company.name,
                        skills=data_retrieved
                    )
                else:
                    prompt = employee_note_prompt.format(
                        name=person.name,
                        job_role=job["role"],
                        company=company.name,
                        skills=data_retrieved
                    )   
             





    

    
