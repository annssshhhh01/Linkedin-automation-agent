"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

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

    // Hover scale on interactives
    const interactives = document.querySelectorAll("a, button, .lo-feat-card, .lo-flow-step");
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

  return (
    <div style={{ cursor: "none" }}>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={trailRef} className="custom-cursor-trail" />

      {/* Background */}
      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ── Navbar ── */}
      <nav className="lo-nav">
        <div className="lo-nav-logo">Linked<span className="logo-accent">Out</span></div>
        <ul className="lo-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#flow">How it works</a></li>
          <li><a href="#stats">Results</a></li>
        </ul>
        <button
          className="lo-nav-cta"
          onClick={() => router.push("/onboarding")}
        >
          Launch App →
        </button>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="lo-hero">
        <div className="lo-hero-badge">
          <div className="lo-badge-dot" />
          AI-Powered LinkedIn Outreach Agent
        </div>

        <h1 className="lo-hero-title">
          Get<br />
          <span className="line2">Referred.</span>
          <span className="line3">{"// stop applying cold. start getting referrals."}</span>
        </h1>

        <p className="lo-hero-sub">
          LinkedOut scrapes jobs, finds alumni and HR contacts, generates personalized
          connection notes using RAG, and sends requests automatically — all while you sleep.
        </p>

        <div className="lo-hero-btns">
          <button className="lo-btn-main" onClick={() => router.push("/onboarding")}>
            Start the agent →
          </button>
          <a href="#flow" className="lo-btn-ghost">
            See how it works
          </a>
        </div>

        {/* ── Terminal Preview ── */}
        <div className="lo-terminal-wrap">
          <div className="lo-term-bar">
            <div className="lo-tdot" style={{ background: "#ff5f57" }} />
            <div className="lo-tdot" style={{ background: "#ffbd2e" }} />
            <div className="lo-tdot" style={{ background: "#28c840" }} />
            <div className="lo-term-title">LINKEDOUT — AGENT SESSION</div>
          </div>
          <div className="lo-term-body">
            <div className="lo-tl">
              <span className="lo-tp">agent@linkedout</span>
              <span className="lo-tc">~ $</span>
              <span className="lo-th">linkedout run --roles &quot;AI Engineer,Backend Engineer&quot; --location India</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ti">→</span>
              <span className="lo-th"> parsing resume · 7 chunks embedded into pgvector</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ti">→</span>
              <span className="lo-th"> scraping linkedin jobs · found 24 matches in 3 roles</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ts">✓</span>
              <span className="lo-th"> scored 24 jobs against your resume via llm</span>
            </div>
            <div className="lo-tl">
              <span className="lo-tw">!</span>
              <span className="lo-th"> awaiting approval for 8 high-score jobs (≥60)</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ts">✓</span>
              <span className="lo-th"> 5 approved · finding alumni at BayOne, Honeywell, Capco...</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ts">✓</span>
              <span className="lo-th"> found 3 alumni (NIT Jalandhar) · 2 HR contacts</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ts">✓</span>
              <span className="lo-th"> notes generated · rag context injected</span>
            </div>
            <div className="lo-tl">
              <span className="lo-ts">✓</span>
              <span className="lo-th"> 5 connection requests queued · sending over 6 hours</span>
            </div>
            <div className="lo-tl">
              <span className="lo-tp">agent@linkedout</span>
              <span className="lo-tc">~ $</span>
              <span className="lo-blink" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="lo-features" id="features">
        <div className="lo-section-tag">{"// WHAT IT DOES"}</div>
        <h2 className="lo-section-title">
          Every step.<br />Automated.
        </h2>
        <div className="lo-feat-grid">
          {[
            {
              num: "01",
              name: "Job Scraper",
              desc: "Scrapes LinkedIn jobs matching your roles and location. Filters and deduplicates in real time. Stores everything in PostgreSQL.",
            },
            {
              num: "02",
              name: "AI Resume Matcher",
              desc: "LLM scores each job against your resume. Skills, experience, domain fit — scored 0–100. You only see jobs worth applying to.",
            },
            {
              num: "03",
              name: "Alumni Finder",
              desc: "Finds people from your college working at target companies. Prioritizes SWEs, senior engineers, and engineering managers.",
            },
            {
              num: "04",
              name: "RAG Note Generator",
              desc: "Uses vector search on your resume to pull relevant context. Generates personalized 200-char connection notes per person type.",
            },
            {
              num: "05",
              name: "Human-in-the-Loop",
              desc: "You approve jobs and review notes before anything is sent. Edit notes inline. Full control without the manual work.",
            },
            {
              num: "06",
              name: "Safe Sending",
              desc: "Connections sent via Celery+Redis queue with human-like delays spread over the day. Max 15/day. Never triggers LinkedIn limits.",
            },
          ].map((feat) => (
            <div key={feat.num} className="lo-feat-card">
              <div className="lo-feat-num">{feat.num}</div>
              <div className="lo-feat-name">{feat.name}</div>
              <div className="lo-feat-desc">{feat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FLOW ═══════ */}
      <section className="lo-flow-section" id="flow">
        <div className="lo-section-tag">{"// PIPELINE"}</div>
        <h2 className="lo-section-title">
          How it<br />works.
        </h2>
        <div className="lo-flow-steps">
          {[
            { label: "upload", name: "Your Resume" },
            { label: "scrape", name: "Jobs" },
            { label: "score", name: "& Approve" },
            { label: "find", name: "Alumni / HR" },
            { label: "generate", name: "Notes" },
            { label: "send", name: "Connections" },
          ].map((step, i) => (
            <div key={i} className="lo-flow-step">
              <div className="lo-step-circle">{String(i + 1).padStart(2, "0")}</div>
              <div className="lo-step-label">{step.label}</div>
              <div className="lo-step-name">{step.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="lo-stats-section" id="stats">
        {[
          { big: "10x", label: "more callbacks with referrals" },
          { big: "15", label: "max connections per day" },
          { big: "200", label: "char personalized note" },
          { big: "0", label: "manual effort required" },
        ].map((stat, i) => (
          <div key={i} className="lo-stat-item">
            <div className="lo-stat-big">{stat.big}</div>
            <div className="lo-stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="lo-cta-section">
        <h2 className="lo-cta-title">
          Stop applying.<br />
          <span>Start getting referred.</span>
        </h2>
        <div className="lo-hero-btns">
          <button className="lo-btn-main" onClick={() => router.push("/onboarding")}>
            Launch LinkedOut →
          </button>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="lo-footer">
        <span>LinkedOut © 2026</span>
        <span>built with FastAPI · LangGraph · pgvector · Playwright</span>
      </footer>
    </div>
  );
}