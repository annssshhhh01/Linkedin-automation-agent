from langchain_groq import ChatGroq
from ..database.models import Job,People,Companies,outreach
from langgraph.types import interrupt
from ..database.connection import session
from sqlalchemy import select # it is used to fetch the db
from .prompts import resume_parser_prompt,matching_score_prompt,alumni_note_prompt,hr_note_prompt,employee_note_prompt
from .state import AgentState
from pypdf import PdfReader
from ..rag.retriever import retrieved_data
from dotenv import load_dotenv
import json
import os
load_dotenv()
pdf_path=os.getenv("RESUME_PATH")
model=ChatGroq(model="llama-3.1-8b-instant")

import re
import json

def safe_parse_json(content: str):

    # 1️⃣ Handle empty or None output
    if not content or not content.strip():
        print("Warning: LLM returned empty response")
        return {"score": 0, "reason": "Empty response"}

    try:
        return json.loads(content)

    except json.JSONDecodeError:

        # 2️⃣ Extract JSON from messy text
        match = re.search(r"\{.*?\}", content, re.DOTALL)

        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # 3️⃣ Fallback
        print(f"Warning: Failed to parse LLM output: {content}")
        return {"score": 0, "reason": "Parsing failed"}

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
    return {"jobs":[{"id":j.id,"role":j.role,"score":j.matching_score,"company_id":j.company_id} for j in matched_score]} # storing only those with score higher than 60

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

def processing_human_approved_job(decision:dict):
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

def note_generator(state:AgentState): #we are using mainly people db in this
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
                    name=person.name,
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
                response=model.invoke(prompt)
                generated_note=response.content
                exisiting_db=db.query(outreach).filter(outreach.job_id==job_id,outreach.Person_id == person.id).first()
                if not exisiting_db:
                    inserting_data=outreach(job_id=job_id,Person_id=person.id,note=generated_note)
                    db.add(inserting_data)
        db.commit()
    all_outreach = db.query(outreach).all()
    db.close()
    
    return{"outreach":[{"id":j.id,"job_id":j.job_id,"note":j.note,"status":j.status} for j in all_outreach]}

#REVIEWING AND APPROVING THE note generated

def note_hitl(state:AgentState):
    db=session
    outreach_data=state["outreach"]
    human_decision=interrupt({                                #so what so ever human decision will be it will become the output of human_decision and most prolly it eill look like {"1":{"approved":true,"note":xyz}
        "Instruction":"Edit or Review This Note",
        "content":outreach_data
    })

    #processing the note of which the human has approved and edit
    for outreach_id,decision in human_decision.items():
        record=db.query(outreach).filter(outreach.id==int(outreach_id)).first()
        if not record:
            print(f"outreach id {outreach_id} not found")
            continue
        if decision["approved"]:
            record.human_approved="Approved"
            if decision.get("edited_note"): # we use get as it is possible that edited_note key doesnt exist so in that key to prevent our code from cratching we use .get as it will simple check if this key ecist then return its value and if not then it simply return none intead of crashing
                record.edited_note=decision["edited_note"]
        else:
            record.human_approved="Rejected"
    db.commit()
    db.close()
    return state               


             





    

    
