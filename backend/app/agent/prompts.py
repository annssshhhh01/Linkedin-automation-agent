from langchain_core.prompts import PromptTemplate

resume_parser_prompt = """
You are a resume parser. Extract the following from this resume text:
-Education
- skills
- projects
- experience
- university
-achievements

Output only valid JSON. Do not include backticks, markdown, or any text before or after the JSON object
example for reference-Return strictly in this JSON format:
{{
    "name": "...",
    "skills": [],
    "experience": "..."
}} give output like this only dont add anything like ``` or any kind of text you have to return in {{"name":"John", "age":30, "car":null}} this format only 
recheck and scan whole text before actually giving the output so no important things get replaced
Resume:
{resume_text}
"""
# matching_score_prompt="""
# you are a ai who will match the JD or key requirements of the company with the resume you have to check for the following:
# -skills required
# -experience (focus on this specifically)

# based on that you have to return a score out of 100 wheher the overall resume content alligned with the jd provided recheck yourself before giving the output
# resume:{resume}
# JD:{jd}
# """                           this was my trial

matching_score_prompt = """
You are a strict resume evaluator. Compare the resume with the job description.

Scoring rules:
- Skills match (40 points): How many required skills does the candidate have?
- Experience match (40 points): 
  * If job requires 3+ years and candidate has less → maximum 15/40
  * If job requires specific domain (ML, DevOps etc) and candidate lacks it → maximum 10/40
- Overall fit (20 points): General alignment with the role

Be strict. Do not give high scores if experience requirements are clearly not met.

Resume:
{resume}

Job Description:
{jd}

Return ONLY this JSON, nothing else:
{{
    "score": <number between 0-100>,
    "reason": "<one line explanation>"
}}
"""
