from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from .connection import Base
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

class User(Base):     #we need this as we are dealing with multiple users so we need cred per user
    __tablename__="users"
    id=Column(Integer,primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    linkedin_email = Column(String, nullable=True)
    linkedin_password = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    college = Column(String, nullable=True) 
    college_id = Column(String, nullable=True)   

class Companies(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    industry = Column(String)
    linkedin_url = Column(String)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    job_id = Column(String, unique=True)
    role = Column(String)
    key_requirements = Column(String)
    matching_score = Column(Integer)
    match_reason = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    status_i_approved = Column(String, default="Rejected")
    location = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    scraped_time = Column(DateTime(timezone=True), server_default=func.now())




class People(Base):
    __tablename__ = "peoples"
    id = Column(Integer, primary_key=True, index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    name = Column(String)
    is_alumni = Column(Boolean, default=False)

    linkedin_url = Column(String)
    position = Column(String)
    email = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"))


class outreach(Base):
    __tablename__ = "outreach"
    id = Column(Integer, primary_key=True, index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    Person_id = Column(Integer, ForeignKey("peoples.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    status = Column(String, default="Pending")
    note = Column(String)
    applied_time = Column(DateTime(timezone=True), server_default=func.now())
    human_approved = Column(String, default="Pending")
    edited_note = Column(String, nullable=True)


class resume_embeding(Base):
    __tablename__ = "resume_embedding"
    id = Column(Integer, primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    content = Column(String)
    embedding = Column(Vector(384))
