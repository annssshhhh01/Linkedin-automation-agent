from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase,sessionmaker
import os
load_dotenv()
class Base(DeclarativeBase):
    pass
db_url=os.getenv("DATABASE_URL")
engine=create_engine(db_url,echo=True)
session=sessionmaker(bind=engine) #it creates sessions so a user can add delete or update things

