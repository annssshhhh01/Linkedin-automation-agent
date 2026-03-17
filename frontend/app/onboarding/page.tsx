"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cookies, setCookies] = useState("");
  const [loading, setLoading] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = `${mx - 6}px`;
      cursor.style.top = `${my - 6}px`;
    };

    document.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(() => {
      tx += (mx - tx) * 0.12;
      ty += (my - ty) * 0.12;
      trail.style.left = `${tx - 16}px`;
      trail.style.top = `${ty - 16}px`;
    }, 16);

    const interactives = document.querySelectorAll("input, button, a");
    const onEnter = () => { if (cursor) cursor.style.transform = "scale(2.5)"; };
    const onLeave = () => { if (cursor) cursor.style.transform = "scale(1)"; };
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
  }, []);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!email || !password) && !cookies) return;

    setLoading(true);

    if (cookies) {
      localStorage.setItem("linkedOutCookies", cookies);
    } else {
      // Store credentials for the backend to use
      localStorage.setItem(
        "linkedOutCredentials",
        JSON.stringify({ email, password })
      );
    }

    // Simulate brief loading then redirect
    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="onboard-page" style={{ cursor: "none" }}>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={trailRef} className="custom-cursor-trail" />

      {/* Background */}
      <div className="sliding-grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Login Card */}
      <div className="onboard-card wide">
        <div className="onboard-logo">
          Linked<span className="logo-accent">Out</span>
        </div>
        <div className="onboard-sub">
          {"// sign in to launch the agent"}
        </div>

        <form onSubmit={handleLaunch}>
          <div className="onboard-layout">
            <div className="onboard-col">
              <div className="onboard-field">
                <label className="onboard-label">linkedin email</label>
                <input
                  className="onboard-input"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!cookies}
                  autoFocus
                />
              </div>

              <div className="onboard-field">
                <label className="onboard-label">linkedin password</label>
                <input
                  className="onboard-input"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!cookies}
                />
              </div>
            </div>

            <div className="onboard-divider">
              <span className="onboard-divider-text">OR</span>
            </div>

            <div className="onboard-col">
              <div className="onboard-field" style={{ height: "100%", marginBottom: 0 }}>
                <label className="onboard-label">session cookies (json)</label>
                <textarea
                  className="onboard-textarea"
                  placeholder={'[{"name": "li_at", "value": "..."}]'}
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                  disabled={!!(email || password)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="onboard-btn"
            disabled={loading || ((!email || !password) && !cookies)}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span className="dash-spinner" style={{ width: 16, height: 16, borderColor: "rgba(0,0,0,0.2)", borderTopColor: "var(--color-bg)" }} />
                initializing agent...
              </span>
            ) : (
              "Launch Agent →"
            )}
          </button>
        </form>

        <div className="onboard-warn">
          🔒 your credentials are stored locally and used only
          for browser automation via Playwright.
        </div>

        <div className="onboard-note">
          <a href="/" style={{ fontSize: 12 }}>← back to home</a>
        </div>
      </div>
    </div>
  );
}
