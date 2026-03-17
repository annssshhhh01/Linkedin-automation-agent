import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// JOBS
export const getJobs = async () => {
  const res = await API.get("/jobs");
  return res.data;
};

export const approveJob = async (data: {
  decision: { job_id: number; status: string };
}) => {
  return API.post("/approved_jobs", data);
};

// NOTES
export const getNotes = async () => {
  const res = await API.get("/fetching-notes");
  return res.data;
};

export const approveNote = async (data: {
  note_decision: { id: number; status: string };
}) => {
  return API.post("/approved-note-generation", data);
};

// AUTOMATION
export const scrapeJobs = () => API.post("/scrape-jobs");
export const scoreJobs = () => API.post("/scoring_jobs");
export const scrapePeople = () => API.post("/scrape-people");
export const generateNotes = () => API.post("/generate-notes");
export const sendConnections = () => API.post("/send-connection");

// WEBSOCKET
export const createTerminalWebSocket = (): WebSocket => {
  return new WebSocket("ws://localhost:8000/ws/terminal");
};