from langchain_core.prompts import PromptTemplate

resume_parser_prompt = """
You are a resume parser. Extract the following from this resume text:
-Education
- skills
- projects
- experience
- university
-achievements

Return as JSON only with proper spacing . No extra text.
recheck and scan whole text before actually giving the output so no important things get replaced
Resume:
{resume_text}
"""
