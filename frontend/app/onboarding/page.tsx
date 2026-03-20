"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./onboarding.css";

export default function Onboarding() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cookies, setCookies] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      animationFrameId = requestAnimationFrame(updateRing);
    };
    updateRing();

    const interactives = document.querySelectorAll('input,textarea,button,a');
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
  }, []);

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

  const handleLaunch = () => {
    let ok = true;
    setEmailError(false);
    setPasswordError(false);

    if (!cookies) {
      if (!email.trim()) {
        setEmailError(true);
        ok = false;
      }
      if (!password.trim()) {
        setPasswordError(true);
        ok = false;
      }
    }

    if (!ok) return;

    setLoading(true);

    if (cookies) {
      localStorage.setItem("linkedOutCookies", cookies);
    } else {
      localStorage.setItem("linkedOutCredentials", JSON.stringify({ email, password }));
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLaunch();
    }
  };

  return (
    <div className="onboarding-container" onKeyDown={handleKeyDown}>
      <div id="cur" ref={curRef}></div>
      <div id="cur-r" ref={ringRef}></div>
      <canvas id="bg" ref={canvasRef}></canvas>
      <div className="grid"></div>

      <div className="page">
        <div className="left">
          <div className="nav-logo">Linked<span>Out</span></div>
          <div className="hero-tag"><div className="live-dot"></div>agent ready</div>
          <div className="hero-title">Connect your<br /><span className="accent">LinkedIn.</span><br />Get referred.</div>
          <div className="hero-desc">Sign in once. LinkedOut scrapes jobs, finds alumni, generates personalized notes, and sends connection requests — fully automated.</div>
          <div className="term-preview">
            <div className="term-bar">
              <div className="tdot" style={{ background: '#ff5f57' }}></div>
              <div className="tdot" style={{ background: '#ffbd2e' }}></div>
              <div className="tdot" style={{ background: '#28c840' }}></div>
            </div>
            <div className="term-body">
              <div className="tl"><span className="tp">agent@linkedout</span><span className="tc"> ~ $</span><span className="tm"> linkedout start</span></div>
              <div className="tl"><span className="ti">→</span><span className="tm"> authenticating with linkedin...</span></div>
              <div className="tl"><span className="ts">✓</span><span className="tm"> session established</span></div>
              <div className="tl"><span className="ts">✓</span><span className="tm"> resume embedded · 7 chunks</span></div>
              <div className="tl"><span className="tw">!</span><span className="tm"> 8 jobs awaiting your approval</span></div>
              <div className="tl"><span className="tp">agent@linkedout</span><span className="tc"> ~ $</span><span className="blink"></span></div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="form-wrap">
            <div className="form-heading">Sign in to LinkedIn</div>
            <div className="form-sub"> connect your account to begin</div>
            <div className="field">
              <div className="flabel">email</div>
              <input
                className={`finput ${emailError ? 'err' : ''}`}
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {emailError && <div className="ferr" style={{ display: 'block' }}>email is required</div>}
            </div>
            <div className="field">
              <div className="flabel">password</div>
              <input
                className={`finput ${passwordError ? 'err' : ''}`}
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {passwordError && <div className="ferr" style={{ display: 'block' }}>password is required</div>}
            </div>
            <div className="or-row">or paste session cookies</div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="flabel">session cookies (json)</div>
              <textarea
                className="ftextarea"
                rows={3}
                placeholder='[{"name": "li_at", "value": "AQE..."}]'
                value={cookies}
                onChange={e => setCookies(e.target.value)}
              ></textarea>
            </div>
            <button
              className={`launch-btn ${loading ? 'loading' : ''}`}
              onClick={handleLaunch}
              disabled={loading}
            >
              LAUNCH AGENT →
            </button>
            <div className="sec-note">
              <div className="sec-icon">⚿</div>
              <div className="sec-text"><b>credentials never leave your machine.</b><br />stored encrypted locally · used only for playwright automation · never sent to any server</div>
            </div>
            <Link href="/" className="back">← back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
