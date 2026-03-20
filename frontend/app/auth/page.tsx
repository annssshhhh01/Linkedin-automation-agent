"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login } from "@/lib/api";
import "./auth.css";

const TERMINAL_LINES = [
  { prefix: "agent@linkedout", cmd: " ~ $ ", text: "linkedout init --auth" },
  { icon: "→", text: "initializing secure session..." },
  { icon: "✓", text: "encryption layer active · AES-256" },
  { icon: "✓", text: "database connected · pgvector ready" },
  { icon: "→", text: "loading AI pipeline modules..." },
  { icon: "✓", text: "job scraper · resume matcher · note generator" },
  { icon: "✓", text: "alumni finder · connection sender" },
  { icon: "!", text: "awaiting user authentication" },
  { prefix: "agent@linkedout", cmd: " ~ $ ", text: "" },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  // Terminal typing animation
  const [visibleLines, setVisibleLines] = useState(0);

  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Custom cursor
  useEffect(() => {
    const cur = curRef.current;
    const ring = ringRef.current;
    if (!cur || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
    };

    document.addEventListener('mousemove', handleMouseMove);

    const updateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      animationFrameId = requestAnimationFrame(updateRing);
    };
    updateRing();

    const interactives = document.querySelectorAll('input,button,a');
    const onEnter = () => ring.style.transform = 'translate(-50%,-50%) scale(1.7)';
    const onLeave = () => ring.style.transform = 'translate(-50%,-50%) scale(1)';

    interactives.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [mode]);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.2 + .3,
      op: Math.random() * .4 + .08
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(74,222,128,${.03 * (1 - d / 90)})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74,222,128,${p.op})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Terminal typing animation
  useEffect(() => {
    setVisibleLines(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= TERMINAL_LINES.length) {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setEmailError(false);
    setPasswordError(false);
    setConfirmError(false);

    let ok = true;
    if (!email.trim()) { setEmailError(true); ok = false; }
    if (!password.trim()) { setPasswordError(true); ok = false; }
    if (mode === "register" && password !== confirmPassword) {
      setConfirmError(true);
      setError("passwords do not match");
      ok = false;
    }
    if (mode === "register" && password.length < 6) {
      setPasswordError(true);
      setError("password must be at least 6 characters");
      ok = false;
    }
    if (!ok) return;

    setLoading(true);

    try {
      if (mode === "register") {
        await register(email, password);
        setSuccess("account created! logging you in...");
        // Auto-login after register
        await login(email, password);
        setTimeout(() => router.push("/"), 1200);
      } else {
        await login(email, password);
        setSuccess("authenticated! redirecting...");
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr?.response?.data?.detail || "something went wrong. try again.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setEmailError(false);
    setPasswordError(false);
    setConfirmError(false);
  };

  return (
    <div className="auth-container" onKeyDown={handleKeyDown}>
      <div id="auth-cur" ref={curRef}></div>
      <div id="auth-cur-r" ref={ringRef}></div>
      <canvas id="auth-bg" ref={canvasRef}></canvas>
      <div className="auth-grid"></div>

      <div className="auth-page">
        {/* ══════ LEFT — 3D Terminal ══════ */}
        <div className="auth-left">
          <div className="auth-logo">Linked<span>Out</span></div>
          <div className="auth-hero-tag">
            <div className="auth-live-dot"></div>
            secure authentication
          </div>

          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>

          <div className="auth-3d-scene">
            <div className="auth-cube">
              {/* Front face — Terminal */}
              <div className="auth-cube-face auth-cube-front">
                <div className="auth-scanline"></div>
                <div className="auth-term-bar">
                  <div className="auth-tdot" style={{ background: '#ff5f57' }}></div>
                  <div className="auth-tdot" style={{ background: '#ffbd2e' }}></div>
                  <div className="auth-tdot" style={{ background: '#28c840' }}></div>
                  <div className="auth-term-title">linkedout — auth</div>
                </div>
                <div className="auth-term-body">
                  {TERMINAL_LINES.slice(0, visibleLines).map((line, idx) => (
                    <div
                      key={idx}
                      className="atl auth-typed-line"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {line.prefix ? (
                        <>
                          <span className="atp">{line.prefix}</span>
                          <span className="atc">{line.cmd}</span>
                          <span className="atm">{line.text}</span>
                          {line.text === "" && <span className="auth-blink"></span>}
                        </>
                      ) : (
                        <>
                          <span className={
                            line.icon === "✓" ? "ats" :
                            line.icon === "!" ? "atw" :
                            "ati"
                          }>{line.icon}</span>
                          <span className="atm">{line.text}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Back face — reflection */}
              <div className="auth-cube-face auth-cube-back">
                <div className="auth-term-bar" style={{ opacity: 0.3 }}>
                  <div className="auth-tdot" style={{ background: '#ff5f57', opacity: 0.3 }}></div>
                  <div className="auth-tdot" style={{ background: '#ffbd2e', opacity: 0.3 }}></div>
                  <div className="auth-tdot" style={{ background: '#28c840', opacity: 0.3 }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-glow-line"></div>
        </div>

        {/* ══════ RIGHT — Auth Form ══════ */}
        <div className="auth-right">
          <div className="auth-form-card">
            {/* Mode Toggle */}
            <div className="auth-mode-toggle">
              <button
                className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                sign in
              </button>
              <button
                className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                register
              </button>
            </div>

            <div className="auth-form-title">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div className="auth-form-sub">
              {mode === 'login'
                ? 'sign in to access your agent'
                : 'register to start automating'}
            </div>

            {/* Error / Success Banners */}
            {error && (
              <div className="auth-banner error">
                <span>✕</span> {error}
              </div>
            )}
            {success && (
              <div className="auth-banner success">
                <span>✓</span> {success}
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <div className="auth-flabel">email</div>
              <input
                className={`auth-finput ${emailError ? 'auth-err' : ''}`}
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {emailError && <div className="auth-ferr">email is required</div>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-flabel">password</div>
              <input
                className={`auth-finput ${passwordError ? 'auth-err' : ''}`}
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {passwordError && !error && <div className="auth-ferr">password is required</div>}
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div className="auth-field">
                <div className="auth-flabel">confirm password</div>
                <input
                  className={`auth-finput ${confirmError ? 'auth-err' : ''}`}
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit */}
            <button
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
            </button>

            {/* Security Note */}
            <div className="auth-sec-note">
              <div className="auth-sec-icon">⚿</div>
              <div className="auth-sec-text">
                <b>passwords are hashed with bcrypt.</b><br />
                JWT tokens expire in 7 days · all API calls are authenticated
              </div>
            </div>

            <Link href="/" className="auth-back">← back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
