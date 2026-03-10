from ..database.models import Job,Companies,resume_embeding
from sqlalchemy import select
from ..database.connection import session
from langchain_huggingface import HuggingFaceEmbeddings

embedding=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
def retrieved_data(job_id,top_k=3):
    db=session
    job,company=db.query(Job,Companies).join(Companies).filter(Job.id==job_id).first()   # it iwll join approved data tables
    query= f"experience and skill relevant to {job.role} at company {company.name}"
    embeded_query=embedding.embed_query(query)
    result=db.query(resume_embeding).order_by(resume_embeding.embedding.cosine_distance(embeded_query)).limit(top_k).all()
    db.close()
    return "\n\n".join([r.content for r in result])



