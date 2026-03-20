"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Terminal from "@/components/Terminal";
import AutocompleteInput from "@/components/AutocompleteInput";
import {
  getJobs,
  approveJob,
  getNotes,
  approveNote,
  scrapeJobs,
  scoreJobs,
  scrapePeople,
  generateNotes,
  sendConnections,
  cancelAction,
  uploadResume,
} from "@/lib/api";
import { indianColleges } from "@/lib/indianColleges";

type Job = {
  id: number;
  role: string;
  company: string;
  location: string;
  matching_score: number;
  matching_reason?: string;
  status?: string;
};

type Note = {
  id: number;
  note: string;
  status: string;
  "Human Approval"?: string;
  "Edited Note"?: string;
  Name: string;
  Position?: string;
  "Job Role"?: string;
};

type TabKey = "jobs" | "people" | "notes";

export default function Dashboard() {
  const router = useRouter();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");

  // Config state
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locInput, setLocInput] = useState("");
  const [college, setCollege] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [maxConn, setMaxConn] = useState("15");
  const [resumeName, setResumeNameState] = useState<string | null>(null);

  // Suggestions state
  const roleSuggestions = [
    "AI Engineer", "Android Developer", "API Developer", "Application Engineer",
    "Backend Engineer", "Blockchain Developer", "Business Analyst", "Business Intelligence Developer",
    "Cloud Architect", "Cloud Engineer", "Compiler Engineer", "Computer Vision Engineer",
    "Cybersecurity Analyst", "Data Analyst", "Data Engineer", "Data Scientist",
    "Database Administrator", "Deep Learning Engineer", "DevOps Engineer", "DevSecOps Engineer",
    "Embedded Systems Engineer", "Engineering Manager", "ETL Developer",
    "Frontend Developer", "Full Stack Developer", "Game Developer",
    "Graphics Engineer", "Hardware Engineer", "Infrastructure Engineer",
    "iOS Developer", "IT Support Engineer",
    "Java Developer", "Machine Learning Engineer", "MLOps Engineer", "Mobile Developer",
    "Natural Language Processing Engineer", "Network Engineer", "Node.js Developer",
    "Platform Engineer", "Product Manager", "Python Developer",
    "QA Engineer", "Quality Assurance Analyst", "React Developer",
    "Robotics Engineer", "Ruby Developer", "Rust Developer",
    "Salesforce Developer", "Scrum Master", "Security Engineer",
    "Site Reliability Engineer", "Software Architect", "Software Developer",
    "Software Engineer", "Solutions Architect", "Systems Engineer",
    "Technical Lead", "Technical Program Manager", "Technical Writer",
    "Test Automation Engineer", "UI Designer", "UI/UX Designer",
    "Unity Developer", "UX Researcher", "VP of Engineering", "Web Developer",
  ];
  
  const indianLocations = [
    // Major Tech Hubs & Cities
    "Bangalore", "Gurgaon", "Pune", "Hyderabad", "Noida", "Mumbai", 
    "Chennai", "Kolkata", "Ahmedabad", "Chandigarh", "Delhi NCR", "Indore",
    "Jaipur", "Kochi", "Surat", "Bhubaneswar", "Trivandrum", "Coimbatore",
    // States
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
    "India"
  ];
  const [colSuggestions, setColSuggestions] = useState<string[]>([]);

  // Pipeline state
  const [runningAction, setRunningAction] = useState<string | null>(null);

  // Note editing
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Backend connection status
  const [apiUp, setApiUp] = useState(false);

  useEffect(() => {
    // ✅ Check for JWT token instead of LinkedIn credentials
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/onboarding");
      return;
    }

    // Read user preferences from localStorage
    const savedRoles = localStorage.getItem("linkedOutRoles");
    const savedLocation = localStorage.getItem("linkedOutLocation");
    const savedCollege = localStorage.getItem("linkedOutCollege");
    const savedCollegeId = localStorage.getItem("linkedOutCollegeId");

    if (savedRoles) {
      try {
        setRoles(JSON.parse(savedRoles));
      } catch {
        // Handle legacy string format
        if (savedRoles.trim() !== "") setRoles([savedRoles]);
      }
    }
    if (savedLocation) {
      try {
        setLocations(JSON.parse(savedLocation));
      } catch {
        if (savedLocation.trim() !== "") setLocations([savedLocation]);
      }
    }
    if (savedCollege) setCollege(savedCollege);
    if (savedCollegeId) setCollegeId(savedCollegeId);

    fetchJobs();
    checkHealth();
  }, [router]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("linkedOutRoles", JSON.stringify(roles));
    localStorage.setItem("linkedOutLocation", JSON.stringify(locations));
    localStorage.setItem("linkedOutCollege", college);
    localStorage.setItem("linkedOutCollegeId", collegeId);
  }, [roles, locations, college, collegeId]);

  // Dynamic College Suggestions (using static list for accurate LinkedIn matching)
  useEffect(() => {
    if (college.trim().length < 2) {
      setColSuggestions([]);
      return;
    }
    const filterTerm = college.toLowerCase();
    const matches = indianColleges.filter(c => c.toLowerCase().includes(filterTerm));
    setColSuggestions(matches.slice(0, 15));
  }, [college]);

  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:8000/health");
      if (res.ok) setApiUp(true);
    } catch {
      setApiUp(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();
      setJobs(res.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.outreach || []);
    } catch {
      setNotes([]);
    }
  };

  const handleApprove = async (jobId: number) => {
    try {
      const pld = { decisions: { [jobId]: true } };
      await approveJob(pld);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "approved" } : j))
      );
      toast.success("Job approved!");
    } catch {
      toast.error("Failed to approve job");
    }
  };

  const handleReject = (jobId: number) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "rejected" } : j))
    );
    toast.success("Job rejected", { icon: "✕" });
  };

  const handleNoteApprove = async (noteId: number) => {
    try {
      await approveNote({ note_decision: { id: noteId, status: "approved" } });
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, "Human Approval": "approved" } : n))
      );
      toast.success("Note approved!");
    } catch {
      toast.error("Failed to approve note");
    }
  };

  const runPipelineAction = async (name: string, fn: () => Promise<unknown>) => {
    if (runningAction === name) {
      try {
        await cancelAction(name);
        toast.success(`Cancelled ${name}`);
      } catch (err) {
        console.error("Failed to cancel action", err);
        toast.error(`Failed to cancel ${name}`);
      }
      setRunningAction(null);
      return;
    }

    setRunningAction(name);
    const tId = toast.loading(`Running action: ${name}...`);
    try {
      await fn();
      if (name === "scrape" || name === "score") await fetchJobs();
      if (name === "notes") await fetchNotes();
      toast.success(`${name} completed successfully!`, { id: tId });
    } catch {
      toast.error(`${name} failed or was cancelled`, { id: tId });
      // Aborts will throw unhandled rejections if we don't catch them
    } finally {
      setRunningAction(null);
    }
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "notes" && notes.length === 0) {
      fetchNotes();
    }
  };

  // ✅ Actually uploads to S3 via backend
  const handleFileUpload = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf";
    inp.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) {
        const tId = toast.loading("Uploading resume...");
        try {
          await uploadResume(f);
          setResumeNameState(f.name);
          toast.success("Resume uploaded successfully!", { id: tId });
        } catch {
          console.error("Resume upload failed");
          toast.error("Failed to upload resume", { id: tId });
        }
      }
    };
    inp.click();
  };

  // ✅ Logout — clears token and redirects to onboarding
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("linkedOutRoles");
    localStorage.removeItem("linkedOutLocation");
    localStorage.removeItem("linkedOutCollege");
    localStorage.removeItem("linkedOutCollegeId");
    router.push("/onboarding");
  };

  const getScoreClass = (score: number) => {
    if (score >= 70) return "dash-score-high";
    if (score >= 50) return "dash-score-mid";
    return "dash-score-low";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;

      // 3D Parallax for cards
      const px = mx / window.innerWidth;
      const py = my / window.innerHeight;
      const rxDeg = (py - 0.5) * -10;
      const ryDeg = (px - 0.5) * 10;
      document.documentElement.style.setProperty('--rot-x', `${rxDeg}deg`);
      document.documentElement.style.setProperty('--rot-y', `${ryDeg}deg`);
    };

    document.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(() => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
    }, 16);

    const interactives = document.querySelectorAll(
      "button, input, .dash-upload-zone, .dash-job-card, .dash-note-card, .dash-abtn"
    );
    const onEnter = () => {
      ring.style.transform = "translate(-50%,-50%) scale(1.8)";
    };
    const onLeave = () => {
      ring.style.transform = "translate(-50%,-50%) scale(1)";
    };
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [jobs, notes, activeTab]);

  const approvedCount = jobs.filter((j) => j.status === "approved").length;
  const pendingNotes = notes.filter((n) => n["Human Approval"] !== "approved").length;

  return (
    <div style={{ cursor: "none", background: "var(--color-bg-dashboard)", height: "100vh", overflow: "hidden" }}>
      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed", width: 10, height: 10,
          background: "var(--color-green-accent)", borderRadius: "50%",
          pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed", width: 28, height: 28,
          border: "1px solid rgba(0,255,135,0.4)", borderRadius: "50%",
          pointerEvents: "none", zIndex: 9998,
          transform: "translate(-50%, -50%)",
          transition: "all 0.1s ease",
        }}
      />

      {/* BG effects */}
      <div className="dash-bg-mesh" />
      <div className="dash-grid-overlay" />

      {/* App shell */}
      <div style={{ position: "relative", zIndex: 1, height: "100vh", display: "grid", gridTemplateRows: "48px 1fr" }}>
        {/* ═══ TOP BAR ═══ */}
        <div className="dash-topbar">
          <button
            className="dash-topbar-logo"
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            Linked<span className="logo-accent">Out</span>
          </button>

          <div className="dash-topbar-nav">
            {(["jobs", "people", "notes"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                className={`dash-tnav-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="dash-topbar-status">
            <span>
              <span className={`dash-sdot ${apiUp ? "on" : "off"}`} />
              api
            </span>
            <span>
              <span className={`dash-sdot ${apiUp ? "on" : "off"}`} />
              db
            </span>
            {/* ✅ Logout button */}
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171",
                fontFamily: "monospace",
                fontSize: 11,
                padding: "2px 10px",
                borderRadius: 4,
                cursor: "pointer",
                marginLeft: 8,
              }}
            >
              logout
            </button>
          </div>
        </div>

        {/* ═══ 3 PANELS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 340px", height: "100%", overflow: "hidden" }}>

          {/* ══════ LEFT PANEL ══════ */}
          <div
            style={{
              borderRight: "1px solid var(--color-green-border)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
              background: "rgba(10,10,18,0.6)",
            }}
          >
            {/* Resume upload */}
            <div className="dash-panel-section">
              <div className="dash-plabel">resume</div>
              <div className="dash-upload-zone" onClick={handleFileUpload}>
                <div className="dash-upload-icon-box">↑</div>
                {resumeName ? (
                  <div className="dash-upload-file-name">📄 {resumeName}</div>
                ) : (
                  <div className="dash-upload-text">
                    <strong>drop your resume</strong><br />PDF · max 5MB
                  </div>
                )}
              </div>
            </div>

            {/* Config */}
            <div className="dash-panel-section">
              <div className="dash-plabel">config</div>
              
              {/* Roles - Tag Input with Autocomplete */}
              <div className="dash-config-row">
                <div className="dash-config-label">target roles</div>
                <div className="dash-tags-container" style={{
                  display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px",
                  padding: roles.length > 0 ? "4px 0" : "0"
                }}>
                  {roles.map(role => (
                    <span key={role} className="dash-tag" style={{
                      background: "rgba(74, 222, 128, 0.15)",
                      color: "var(--color-green-accent)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {role}
                      <button 
                        onClick={() => setRoles(r => r.filter(x => x !== role))}
                        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "12px", padding: 0 }}
                      >×</button>
                    </span>
                  ))}
                </div>
                <AutocompleteInput
                  suggestions={roleSuggestions.filter(s => !roles.includes(s))}
                  value={roleInput}
                  onChange={setRoleInput}
                  onSelect={(val) => {
                    if (!roles.includes(val)) setRoles([...roles, val]);
                    setRoleInput("");
                  }}
                  placeholder="Type a role (e.g. Backend)..."
                />
              </div>
              <div className="dash-config-row">
                <div className="dash-config-label">location</div>
                <div className="dash-tags-container" style={{
                  display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px",
                  padding: locations.length > 0 ? "4px 0" : "0"
                }}>
                  {locations.map(loc => (
                    <span key={loc} className="dash-tag" style={{
                      background: "rgba(6, 182, 212, 0.15)",
                      color: "var(--color-cyan-accent)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {loc}
                      <button 
                        onClick={() => setLocations(l => l.filter(x => x !== loc))}
                        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "12px", padding: 0 }}
                      >×</button>
                    </span>
                  ))}
                </div>
                <AutocompleteInput
                  suggestions={indianLocations.filter(s => !locations.includes(s))}
                  value={locInput}
                  onChange={setLocInput}
                  onSelect={(val) => {
                    if (!locations.includes(val)) setLocations([...locations, val]);
                    setLocInput("");
                  }}
                  placeholder="Type a state or city (e.g. Bangalore)..."
                />
              </div>
              <div className="dash-config-row">
                <div className="dash-config-label" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textTransform: 'none' }}>
                  <span style={{ textTransform: 'uppercase' }}>college name</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                    *If not listed, type exactly as on LinkedIn
                  </span>
                </div>
                <AutocompleteInput
                  suggestions={colSuggestions}
                  value={college}
                  onChange={setCollege}
                  onSelect={setCollege}
                  placeholder="Type to search colleges..."
                />
              </div>
              <div className="dash-config-row">
                <div className="dash-config-label">linkedin college id</div>
                <input
                  className="dash-config-input"
                  placeholder="e.g. 13565"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                />
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  Find in the URL of your college's LinkedIn page (e.g. linkedin.com/school/<strong>13565</strong>)
                </div>
              </div>
              <div className="dash-config-row">
                <div className="dash-config-label">max connections/day</div>
                <input
                  className="dash-config-input"
                  value={maxConn}
                  onChange={(e) => setMaxConn(e.target.value)}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="dash-panel-section">
              <div className="dash-plabel">stats</div>
              <div className="dash-stat-grid">
                <div className="dash-scard">
                  <div className="dash-snum">{jobs.length}</div>
                  <div className="dash-slabel">jobs scraped</div>
                </div>
                <div className="dash-scard">
                  <div className="dash-snum" style={{ color: "var(--color-cyan-accent)", textShadow: "0 0 12px var(--color-cyan-glow)" }}>{approvedCount}</div>
                  <div className="dash-slabel">approved</div>
                </div>
                <div className="dash-scard">
                  <div className="dash-snum" style={{ color: "var(--color-violet-accent)", textShadow: "0 0 12px var(--color-violet-glow)" }}>{notes.length}</div>
                  <div className="dash-slabel">people found</div>
                </div>
                <div className="dash-scard">
                  <div className="dash-snum" style={{ color: "var(--color-amber-accent)", textShadow: "0 0 12px rgba(251,191,36,0.3)" }}>{pendingNotes}</div>
                  <div className="dash-slabel">notes pending</div>
                </div>
              </div>
            </div>

            {/* Pipeline actions */}
            <div className="dash-panel-section">
              <div className="dash-plabel">pipeline</div>
              <div className="dash-action-list">
                {[
                  { key: "scrape", label: "scrape jobs", fn: () => scrapeJobs(roles, locations) },
                  { key: "score", label: "score & match", fn: () => scoreJobs() },
                  { key: "people", label: "find people", fn: () => scrapePeople() },
                  { key: "notes", label: "generate notes", fn: () => generateNotes() },
                  { key: "send", label: "send connections", fn: () => sendConnections() },
                ].map((action) => {
                  const isRunning = runningAction === action.key;
                  const isOtherRunning = runningAction !== null && !isRunning;

                  return (
                    <button
                      key={action.key}
                      className={`dash-abtn ${action.key === "scrape" ? "primary" : ""}`}
                      disabled={isOtherRunning}
                      onClick={() => runPipelineAction(action.key, action.fn)}
                      style={
                        isOtherRunning
                          ? { opacity: 0.5 }
                          : isRunning
                            ? { background: "#3f1c1c", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }
                            : {}
                      }
                    >
                      {isRunning ? (
                        <>
                          <span className="dash-spinner" style={{ borderTopColor: "#f87171" }} />
                          <span style={{ marginLeft: 6 }}>stop / abort</span>
                        </>
                      ) : (
                        <>
                          {action.key === "scrape" ? "▶ " : ""}{action.label}
                          <span className="dash-abtn-arrow">→</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══════ MIDDLE PANEL ══════ */}
          <div
            style={{
              display: "flex", flexDirection: "column", overflow: "hidden",
              borderRight: "1px solid var(--color-green-border)",
            }}
          >
            {/* Tabs */}
            <div className="dash-middle-tabs">
              {([
                { key: "jobs" as TabKey, label: `jobs (${jobs.length})` },
                { key: "people" as TabKey, label: `people` },
                { key: "notes" as TabKey, label: `notes (${notes.length})` },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  className={`dash-mtab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {/* ── JOBS TAB ── */}
              {activeTab === "jobs" && (
                <>
                  {loading ? (
                    <div className="dash-empty-state">
                      <div className="dash-spinner" style={{ width: 24, height: 24 }} />
                      <span style={{ marginTop: 12 }}>loading jobs...</span>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="dash-empty-state">
                      <div className="dash-empty-icon">◎</div>
                      no jobs yet. click &quot;scrape jobs&quot; to start.
                    </div>
                  ) : (
                    jobs.map((job) => {
                      const isApproved = job.status === "approved";
                      const isRejected = job.status === "rejected";
                      return (
                        <div
                          key={job.id}
                          className={`dash-job-card ${isApproved ? "approved" : ""} ${isRejected ? "rejected" : ""}`}
                        >
                          <div className="dash-job-header">
                            <div>
                              <div className="dash-job-role">{job.role}</div>
                              <div className="dash-job-company">{job.company} · {job.location}</div>
                            </div>
                            <div className={`dash-score-badge ${getScoreClass(job.matching_score || 0)}`}>
                              {job.matching_score || "—"}
                            </div>
                          </div>

                          {job.matching_reason && (
                            <div className="dash-job-reason">{job.matching_reason}</div>
                          )}

                          <div className="dash-job-meta">
                            <span className="dash-meta-tag">full-time</span>
                            {job.location && <span className="dash-meta-tag">{job.location}</span>}
                          </div>

                          {!isApproved && !isRejected && (
                            <div className="dash-job-actions">
                              <button
                                className="dash-jbtn dash-jbtn-approve"
                                onClick={() => handleApprove(job.id)}
                              >
                                ✓ approve
                              </button>
                              <button
                                className="dash-jbtn dash-jbtn-reject"
                                onClick={() => handleReject(job.id)}
                              >
                                ✕ reject
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <div style={{ fontSize: 10, color: "var(--color-green-accent)", fontFamily: "var(--font-mono)" }}>
                              ✓ approved
                            </div>
                          )}
                          {isRejected && (
                            <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "var(--font-mono)" }}>
                              ✕ rejected
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ── PEOPLE TAB ── */}
              {activeTab === "people" && (
                <div className="dash-empty-state">
                  <div className="dash-empty-icon">◎</div>
                  run people scraper to find alumni and hr contacts
                </div>
              )}

              {/* ── NOTES TAB ── */}
              {activeTab === "notes" && (
                <>
                  {notes.length === 0 ? (
                    <div className="dash-empty-state">
                      <div className="dash-empty-icon">◎</div>
                      no notes yet. generate notes after approving jobs.
                    </div>
                  ) : (
                    notes.map((n) => {
                      const isEditing = editingNote === n.id;
                      return (
                        <div key={n.id} className="dash-note-card">
                          <div className="dash-note-person">
                            <div className="dash-person-avatar">{getInitials(n.Name)}</div>
                            <div>
                              <div className="dash-person-name">{n.Name}</div>
                              <div className="dash-person-role">
                                {n.Position || "Contact"} · {n["Job Role"] || "—"}
                              </div>
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              className="dash-note-edit"
                              rows={3}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{ display: "block" }}
                              autoFocus
                            />
                          ) : (
                            <div className="dash-note-text">
                              {n["Edited Note"] || n.note}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 6 }}>
                            {n["Human Approval"] !== "approved" && (
                              <>
                                <button
                                  className="dash-jbtn dash-jbtn-approve"
                                  onClick={() => handleNoteApprove(n.id)}
                                >
                                  ✓ approve
                                </button>
                                <button
                                  className="dash-jbtn"
                                  style={{
                                    borderColor: "rgba(0,255,135,0.2)",
                                    color: "var(--color-text-muted2)",
                                  }}
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingNote(null);
                                    } else {
                                      setEditingNote(n.id);
                                      setEditValue(n.note);
                                    }
                                  }}
                                >
                                  {isEditing ? "✓ done" : "✎ edit"}
                                </button>
                                <button className="dash-jbtn dash-jbtn-reject">✕ reject</button>
                              </>
                            )}
                            {n["Human Approval"] === "approved" && (
                              <span style={{ fontSize: 10, color: "var(--color-green-accent)", fontFamily: "var(--font-mono)" }}>
                                ✓ approved
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>

          {/* ══════ RIGHT PANEL — TERMINAL ══════ */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Terminal />
          </div>
        </div>
      </div>
    </div>
  );
}