from langchain_groq import ChatGroq
from prompts import resume_parser_prompt
from state import AgentState
from pypdf import PdfReader
from dotenv import load_dotenv
import os
load_dotenv()
pdf_path=os.getenv("RESUME_PATH")
model=ChatGroq(model="llama-3.1-8b-instant")
def resume_parser(state:AgentState):
    reader=PdfReader(pdf_path)
    resume_text=""
    for page in reader.pages:
        resume_text+=page.extract_text()
    prompt = resume_parser_prompt.format(resume_text=resume_text)
    result = model.invoke(prompt)
    print(result.content)
    return{"resume":result.content} 
   
def scrapper(state:AgentState):
    
