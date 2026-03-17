"use client";

import { useEffect, useRef, useState } from "react";

type LogLine = {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning" | "system";
};

export default function Terminal() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string, type: LogLine["type"] = "info") => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { time, message, type }]);
  };

  useEffect(() => {
    addLog("linkedout agent initialized", "success");
    addLog("attempting websocket connection...", "system");

    const connect = () => {
      try {
        const ws = new WebSocket("ws://localhost:8000/ws/terminal");
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          addLog("connected to backend", "success");
          addLog("ready. waiting for commands...", "system");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            addLog(data.message, data.type || "info");
          } catch {
            addLog(event.data, "info");
          }
        };

        ws.onerror = () => {
          addLog("websocket connection error", "error");
        };

        ws.onclose = () => {
          setConnected(false);
          addLog("connection closed. retrying in 5s...", "warning");
          setTimeout(connect, 5000);
        };
      } catch {
        addLog("failed to connect. retrying in 5s...", "error");
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getTagClass = (type: LogLine["type"]) => {
    switch (type) {
      case "success": return "dash-tag-ok";
      case "error": return "dash-tag-err";
      case "warning": return "dash-tag-warn";
      case "info": return "dash-tag-info";
      case "system": return "dash-tag-sys";
      default: return "dash-tag-info";
    }
  };

  const getTagLabel = (type: LogLine["type"]) => {
    switch (type) {
      case "success": return "[DONE]";
      case "error": return "[ERR] ";
      case "warning": return "[WAIT]";
      case "info": return "[INFO]";
      case "system": return "[SYS] ";
      default: return "[INFO]";
    }
  };

  return (
    <div className="dash-terminal">
      {/* Terminal header */}
      <div className="dash-term-topbar">
        <div className="lo-tdot" style={{ background: "#ff5f57", width: 10, height: 10, borderRadius: "50%" }} />
        <div className="lo-tdot" style={{ background: "#ffbd2e", width: 10, height: 10, borderRadius: "50%" }} />
        <div className="lo-tdot" style={{ background: "#28c840", width: 10, height: 10, borderRadius: "50%" }} />
        <div className="dash-term-title-text">
          LINKEDOUT — AGENT LOG
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <span
            className={`dash-sdot ${connected ? "on" : "off"}`}
          />
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: connected ? "var(--color-green-accent)" : "var(--color-text-muted)" }}>
            {connected ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>

      {/* Terminal scroll area */}
      <div className="dash-term-scroll">
        {logs.map((log, i) => (
          <div key={i} className="dash-tline">
            <span className="dash-t-time">{log.time}</span>
            <span className={`dash-t-tag ${getTagClass(log.type)}`}>
              {getTagLabel(log.type)}
            </span>
            <span className={log.type === "success" ? "dash-t-grn" : "dash-t-msg"}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />

        {/* Blinking cursor */}
        <div className="dash-tline" style={{ marginTop: 4 }}>
          <span className="dash-t-time" style={{ visibility: "hidden" }}>00:00:00</span>
          <span style={{ color: "var(--color-green-accent)", fontSize: 12 }}>❯</span>
          <span className="lo-blink" style={{ marginLeft: 4 }} />
        </div>
      </div>

      {/* Input row */}
      <div className="dash-term-input-row">
        <span className="dash-term-prompt">❯</span>
        <input className="dash-term-inp" placeholder="type a command..." readOnly />
      </div>
    </div>
  );
}
