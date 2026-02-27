from connection import Base,engine 
import models
Base.metadata.create_all(bind=engine)  #this will actually start and create tables
print("tables are created")  