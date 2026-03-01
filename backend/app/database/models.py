from sqlalchemy import Column,Integer,String,DateTime,ForeignKey,Boolean
from connection import Base
from sqlalchemy.sql import func
class Companies(Base):
    __tablename__="companies"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String)
    industry=Column(String)
    linkedin_url=Column(String)
class Job(Base):
    __tablename__="jobs"
    id=Column(Integer,primary_key=True,index=True)
    role=Column(String)
    key_requirements=Column(String)
    matching_score=Column(Integer)
    salary_range = Column(String, nullable=True)
    status_i_approved=Column(String,default="rejected")
    company_id=Column(Integer,ForeignKey("companies.id"))
    applied_time=Column(DateTime(timezone=True),server_default=func.now())

class People(Base):
    __tablename__="peoples"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String)
    is_alumni=Column(Boolean,default=False)
    linkedin_url=Column(String)
    position=Column(String)
    email=Column(String,nullable=True)
    company_id=Column(Integer,ForeignKey("companies.id"))

class outreach(Base):
    __tablename__="outreach"
    id=Column(Integer,primary_key=True,index=True)
    Person_id=Column(Integer,ForeignKey("peoples.id"))
    job_id=Column(Integer,ForeignKey("jobs.id"))
    status=Column(String,default="pending")
    note=Column(String)
    applied_time=Column(DateTime(timezone=True),server_default=func.now())

    



