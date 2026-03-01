from typing import TypedDict,Optional,Annotated,List
import operator
class AgentState(TypedDict):
    jobs:Annotated[List[dict],operator.add]
    salary: Optional[int]
    resume:dict
    human_approval:bool
    is_alumni:bool
    matching_score: Optional[int]   
    generated_note: Optional[str]    
    people: Annotated[List[dict], operator.add]               
    linkedin_url: Optional[str]