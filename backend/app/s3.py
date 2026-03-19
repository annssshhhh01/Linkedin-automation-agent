import boto3
import os
from dotenv import load_dotenv
import io

s3_client=boto3.client("s3",aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),region_name=os.getenv("AWS_REGION"))
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
def upload_resume(file_bytes: bytes, user_id: int, filename: str) -> str:
    key = f"resumes/user_{user_id}/{filename}"
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType="application/pdf"
    )
    url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
    return url
def download_resume(resume_url: str) -> io.BytesIO:
    key = resume_url.split(".amazonaws.com/")[1]
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
    file_bytes = response["Body"].read()
    return io.BytesIO(file_bytes)