from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

load_dotenv()

db_url = os.getenv("DATABASE_URL")


class Base(DeclarativeBase):
    pass

engine = create_engine(db_url,echo=True)
sessionlocal = sessionmaker( bind=engine)  # it creates sessions so a user can add delete or update thing
session=sessionlocal()
