from celery import Celery
import asyncio
from app.scraper.jobs import main as scrape_jobs_main
celery=Celery("worker",broker="redis://redis:6379/0",backend="redis://redis:6379/0")

@celery.task
def scrape_job():
    asyncio.run(scrape_jobs_main())
    




