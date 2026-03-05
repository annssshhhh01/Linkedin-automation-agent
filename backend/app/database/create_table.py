from .connection import Base,engine 
from . import models
# Base.metadata.drop_all(engine)  we will use this to drop all the table so new table or updated tables can be added
Base.metadata.create_all(bind=engine)  #this will actually start and create tables
print("tables are created")  