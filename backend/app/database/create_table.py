from .connection import Base,engine 
from . import models
# Base.metadata.drop_all(engine)  
Base.metadata.create_all(bind=engine)  #this will actually start and create tables
print("tables are created")  