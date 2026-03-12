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


alumni_note_prompt = """
You are writing a LinkedIn connection request note to an alumni.
STRICT 200 character limit. Return ONLY the note, nothing else.

Use this template:
"Hi {name}, fellow {college} alum here! I'm currently applying for the {job_role} role at {company}. With experience in {skills}, I'd love to hear your thoughts on the team. Would be happy to share my resume if you'd be open to referring a fellow alum. Thank you!"

Inputs:
Name: {name}
College: {college}
Job role: {job_role}
Company: {company}
Skills: {skills}
"""
hr_note_prompt = """
You are writing a LinkedIn connection request note to a recruiter or HR professional.
STRICT 200 character limit. Return ONLY the note, nothing else.

Use this template:
"Hi {name}, I'm applying for the {job_role} role at {company}. With experience in {skills}, I believe I'd be a strong fit. Would be happy to share my resume Would love any guidance on the application process. Thank you!
Inputs:
Name: {name}
Job role: {job_role}
Company: {company}
Skills: {skills}
"""
employee_note_prompt = """
You are writing a LinkedIn connection request note to an employee.
STRICT 200 character limit. Return ONLY the note, nothing else.

Use this template:
Hi [Name], I'm applying for the [Job Role] role at [Company] and have a strong background in [Stack]. I've been following [Company]'s work and would love to hear your thoughts on the team. I'm happy to share my resume if you'd be open to a referral! Thank you!
Inputs:
Name: {name}
Job role: {job_role}
Company: {company}
Skills: {skills}
"""