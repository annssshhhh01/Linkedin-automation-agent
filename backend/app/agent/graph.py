from langgraph.graph import StateGraph,START,END
from langgraph.types import Command,interrupt
from .nodes import resume_parser,matching_score,job_hitl,processing_human_approved_job
from langgraph.checkpoint.memory import MemorySaver
from .state import AgentState
import uuid
graph=StateGraph(AgentState)

graph.add_node("resume_parser",resume_parser)
graph.add_node("matching_score",matching_score)
graph.add_node("human_decision",job_hitl)
graph.add_node("updating_status_of_db",processing_human_approved_job)

graph.add_edge(START,"resume_parser")
graph.add_edge("resume_parser","matching_score")
graph.add_edge("matching_score","human_decision")
graph.add_edge("human_decision","updating_status_of_db")
graph.add_edge("updating_status_of_db",END)

checkpointer=MemorySaver()
workflow=graph.compile(checkpointer=checkpointer)
config={"configurable":{"thread_id":str(uuid.uuid4())}}

if __name__ == "__main__":
    result = workflow.invoke({}, config=config)
    
    # show jobs clearly
    interrupted = result["__interrupt__"][0].value
    jobs = interrupted["jobs"]
    
    print("\n=== JOBS FOR REVIEW ===")
    decisions = {}
    for job in jobs:
        print(f"\nJob ID: {job['id']}")
        print(f"Role: {job['role']}")
        print(f"Score: {job['score']}")
        print(f"Reason: {job['reason']}")
        answer = input("Approve? (y/n): ").strip().lower()
        decisions[str(job['id'])] = True if answer == "y" else False
    
    # resume with decisions
    result = workflow.invoke(
        Command(resume={"human_approval": decisions}),
        config=config
    )
    print("\n✅ Done! DB updated.")    