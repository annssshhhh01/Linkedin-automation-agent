from models import Companies,Job,outreach,People
from connection import session

db=session()
company = Companies(name="Google", industry="Tech", linkedin_url="linkedin.com/google")
db.add(company)
db.commit()

job = Job(role="SDE", key_requirements="Python, FastAPI", matching_score=75, company_id=company.id)
db.add(job)
db.commit()
person = People(name="Ansh", position="HR", is_alumni=False, company_id=company.id)
db.add(person)
db.commit()
out = outreach(Person_id=person.id, job_id=job.id, note="Hey would love to connect")
db.add(out)
db.commit()