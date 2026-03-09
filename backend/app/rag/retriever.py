from ..database.models import Job,Companies,resume_embeding
from sqlalchemy import select
from ..database.connection import session

def retrieved_data(job_id,embedding,top_k=3):
    db=session
    job,company=db.query(Job,Companies).join(Companies).filter(Job.id==job_id).first()  
    query= f"experience relevant to {job.role} at company {company.name}"
    embeded_query=embedding.embed_query(query)
    result=db.query(resume_embeding).order_by(resume_embeding.embedding.cosine_distance(embeded_query)).limit(top_k).all()
    db.close()
    return "\n\n".join([r.content for r in result])



