import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// This runs before EVERY request automatically
// Reads token from localStorage and adds it to header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const register = (email: string, password: string) =>
  API.post("/register", { email, password });

export const login = async (email: string, password: string) => {
  const res = await API.post("/login", { email, password });
  localStorage.setItem("token", res.data.access_token); // save token
  return res.data;
};

export const onboard = (data: {
  college: string;
  college_id: string;
  linkedin_email: string;
  linkedin_password: string;
}) => API.post("/onboarding", data);

export const uploadResume = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return API.post("/upload-resume", form);
};

// JOBS
export const getJobs = async () => {
  const res = await API.get("/jobs");
  return res.data;
};

export const approveJob = async (data: {
  decisions: { [key: number | string]: boolean };
}) => {
  return API.post("/approved_jobs", data);
};

// NOTES
export const getNotes = async () => {
  const res = await API.get("/fetching-notes");
  return res.data;
};

export const approveNote = async (data: {
  note_decision: { id: number; status: string; edited?: string };
}) => {
  return API.post("/approved-note-generation", data);
};

// AUTOMATION
export const scrapeJobs = (roles: string[], locations: string[]) => 
  API.post("/scrape-jobs", { roles, locations });
export const scoreJobs = () => API.post("/scoring_jobs");
export const scrapePeople = () => API.post("/scrape-people");
export const generateNotes = () => API.post("/generate-notes");
export const sendConnections = () => API.post("/send-connection");
export const cancelAction = (actionName: string) =>
  API.post(`/cancel-action/${actionName}`);

// WEBSOCKET
export const createTerminalWebSocket = (): WebSocket => {
  return new WebSocket("ws://localhost:8000/ws/terminal");
};