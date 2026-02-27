from connection import Base,engine 
import models
Base.metadata.create_all(bind=engine)
print("tables are created")