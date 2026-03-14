
"""here we are making a diff note except hitl as that will be handles by """

from langgraph.graph import StateGraph,START,END
from .nodes import resume_parser,matching_score,note_generator
from langgraph.checkpoint.memory import MemorySaver
from .state import AgentState
import uuid
match_scoring_graph=StateGraph(AgentState)


match_scoring_graph = StateGraph(AgentState)
match_scoring_graph.add_node("resume_parser", resume_parser)
match_scoring_graph.add_node("matching_score", matching_score)

match_scoring_graph.add_edge(START, "resume_parser")
match_scoring_graph.add_edge("resume_parser", "matching_score")
match_scoring_graph.add_edge("matching_score", END)
checkpointer=MemorySaver()
score_workflow=match_scoring_graph.compile(checkpointer=checkpointer)
config={"configurable":{"thread_id":str(uuid.uuid4())}}


#for note generation 
notes_graph = StateGraph(AgentState)
notes_graph.add_node("note_generator", note_generator)
notes_graph.add_edge(START, "note_generator")
notes_graph.add_edge("note_generator", END)
notes_workflow = notes_graph.compile(checkpointer=checkpointer)