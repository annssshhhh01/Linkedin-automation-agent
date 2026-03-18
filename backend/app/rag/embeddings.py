from app.agent.state import AgentState
from app.database.models import resume_embeding
from app.database.connection import sessionlocal
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()
pdf_path=os.getenv("RESUME_PATH")

def embeded_resume():

    loader=PyPDFLoader(pdf_path)
    documents=loader.load()

    splitter=RecursiveCharacterTextSplitter(chunk_size=500,chunk_overlap=50)
    chunks=splitter.split_documents(documents)

    embedding=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db=sessionlocal()
    for chunk in chunks:
        vector=embedding.embed_query(chunk.page_content)
        record=resume_embeding(content=chunk.page_content,embedding=vector)
        db.add(record)
    db.commit()
    db.close()
    print(f"stored {len(chunks)} chunks into our vector db which is pgvector in postgres")


if __name__ == "__main__":
    embeded_resume()