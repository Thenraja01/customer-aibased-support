import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Compass } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { homePathFor } from "@/lib/access";

interface NotFoundProps {
  brand?: string;
  onHome?: () => void;
  onBack?: () => void;
}

export default function NotFound({
  brand,
  onHome,
  onBack,
}: NotFoundProps) {
  const navigate = useNavigate();
  const { user, orgSettings, tenant } = useAuthContext();
  const { theme, themeMode } = useTheme();

  // Dynamic organization name fallback
  const effectiveOrgName =
    brand ||
    orgSettings?.name ||
    user?.organizationName ||
    tenant?.name ||
    "SupportAI";

  const brandColor = orgSettings?.brand_colors?.primary || "#2563eb";
  const secondaryColor = orgSettings?.brand_colors?.secondary || "#7c3aed";

  const handleHome = onHome || (() => {
    const dest = homePathFor(user);
    navigate(dest);
  });

  const handleBack = onBack || (() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homePathFor(user));
    }
  });

  const textRef = useRef<HTMLSpanElement>(null);
  const sl1Ref = useRef<HTMLDivElement>(null);
  const sl2Ref = useRef<HTMLDivElement>(null);
  const sl3Ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isLight = theme === "light" && themeMode !== "dark" && themeMode !== "midnight";

  useEffect(() => {
    const gt = textRef.current;
    const bars = [sl1Ref.current, sl2Ref.current, sl3Ref.current];
    if (!gt) return;

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    function randInt(min: number, max: number) {
      return Math.floor(rand(min, max));
    }

    function sliceGlitch() {
      const n = randInt(2, 4);
      const cuts = Array.from({ length: n }, () => randInt(5, 95)).sort((a, b) => a - b);
      bars.forEach((b, i) => {
        if (!b) return;
        if (i < cuts.length - 1) {
          b.style.top = `${cuts[i]}%`;
          b.style.bottom = `${100 - cuts[i + 1]}%`;
          b.style.transform = `translateX(${randInt(-18, 18)}px)`;
          b.style.opacity = "1";
          b.style.background = Math.random() > 0.7 ? (isLight ? "#000" : "#0ff") : (isLight ? "#fff" : "#000");
        } else {
          b.style.opacity = "0";
        }
      });
      setTimeout(() => bars.forEach((b) => b && (b.style.opacity = "0")), 80 + randInt(0, 60));
    }

    function triggerGlitch() {
      if (!gt) return;
      gt.classList.add("glitching");
      sliceGlitch();
      if (Math.random() > 0.5) setTimeout(sliceGlitch, 60);
      setTimeout(() => {
        if (!gt) return;
        gt.classList.remove("glitching");
        void gt.offsetWidth;
      }, 150);
    }

    // Ambient RGB drift
    function ambientLoop() {
      if (gt && !gt.classList.contains("glitching")) {
        const sr = -3 + Math.sin(Date.now() / 800) * 1.5;
        const sc = 3 + Math.cos(Date.now() / 950) * 1.5;
        gt.style.setProperty("--sr", `${sr}px`);
        gt.style.setProperty("--sc", `${sc}px`);
      }
      rafRef.current = requestAnimationFrame(ambientLoop);
    }
    ambientLoop();

    // Initial burst
    setTimeout(() => {
      triggerGlitch();
      setTimeout(triggerGlitch, 100);
      setTimeout(triggerGlitch, 220);
    }, 300);

    // Recurring glitch
    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        triggerGlitch();
        if (Math.random() > 0.6) setTimeout(triggerGlitch, rand(120, 300));
        scheduleNext();
      }, rand(1800, 3500));
    }
    scheduleNext();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLight]);

  return (
    <>
      <style>{`
        .nf-page {
          min-height: 100vh;
          background: ${isLight ? "#f8fafc" : "#09090b"};
          color: ${isLight ? "#0f172a" : "#f8fafc"};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: Inter, system-ui, -apple-system, sans-serif;
          user-select: none;
          overflow: hidden;
          position: relative;
        }
        .nf-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent, transparent 2px,
            ${isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"} 2px,
            ${isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"} 4px
          );
          pointer-events: none;
          z-index: 10;
        }

        .nf-glow-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 45%, ${brandColor}18 0%, transparent 65%);
          pointer-events: none;
          z-index: 1;
        }

        .nf-code {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: ${isLight ? "#64748b" : "#71717a"};
          text-transform: uppercase;
          margin-bottom: 1.2rem;
          z-index: 12;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nf-glitch-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 1.8rem;
          z-index: 12;
        }

        .nf-glitch-text {
          font-size: clamp(2.8rem, 9vw, 5.2rem);
          font-weight: 900;
          color: ${isLight ? "#0f172a" : "#ffffff"};
          letter-spacing: -0.04em;
          line-height: 1;
          position: relative;
          display: block;
          text-shadow: ${isLight ? "none" : `0 0 35px ${brandColor}50`};
        }

        /* Red channel */
        .nf-glitch-text::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: var(--sr, -3px);
          color: ${isLight ? "#e11d48" : "#ff2020"};
          mix-blend-mode: ${isLight ? "multiply" : "screen"};
        }
        /* Cyan channel */
        .nf-glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: var(--sc, 3px);
          color: ${isLight ? "#0284c7" : "#00f0f0"};
          mix-blend-mode: ${isLight ? "multiply" : "screen"};
        }

        .nf-glitch-text.glitching::before {
          animation: nf-glitch-r 0.12s steps(1) forwards;
        }
        .nf-glitch-text.glitching::after {
          animation: nf-glitch-c 0.12s steps(1) forwards;
        }
        .nf-glitch-text.glitching {
          animation: nf-glitch-main 0.12s steps(1) forwards;
        }

        @keyframes nf-glitch-r {
          0%  { clip-path:inset(8%  0 78% 0); transform:translateX(-6px); }
          20% { clip-path:inset(45% 0 40% 0); transform:translateX(-4px); }
          40% { clip-path:inset(72% 0 12% 0); transform:translateX(-8px); }
          60% { clip-path:inset(20% 0 65% 0); transform:translateX(-5px); }
          80% { clip-path:inset(60% 0 28% 0); transform:translateX(-3px); }
          100%{ clip-path:inset(0   0 0   0); transform:translateX(-3px); }
        }
        @keyframes nf-glitch-c {
          0%  { clip-path:inset(55% 0 30% 0); transform:translateX(8px); }
          20% { clip-path:inset(10% 0 70% 0); transform:translateX(5px); }
          40% { clip-path:inset(80% 0 5%  0); transform:translateX(9px); }
          60% { clip-path:inset(35% 0 48% 0); transform:translateX(6px); }
          80% { clip-path:inset(15% 0 70% 0); transform:translateX(4px); }
          100%{ clip-path:inset(0   0 0   0); transform:translateX(3px); }
        }
        @keyframes nf-glitch-main {
          0%  { transform:translateX(-2px) skewX(-1deg); }
          25% { transform:translateX(2px)  skewX(1deg); }
          50% { transform:translateX(-1px) skewX(0deg); }
          75% { transform:translateX(3px)  skewX(-0.5deg); }
          100%{ transform:translateX(0);   skewX(0deg); }
        }

        .nf-slice {
          position: absolute;
          left: 0; right: 0;
          background: ${isLight ? "#f8fafc" : "#09090b"};
          z-index: 15;
          pointer-events: none;
          opacity: 0;
        }

        .nf-msg {
          font-size: clamp(0.85rem, 2vw, 1rem);
          color: ${isLight ? "#475569" : "#a1a1aa"};
          font-weight: 400;
          letter-spacing: -0.01em;
          margin-bottom: 2.2rem;
          max-width: 380px;
          text-align: center;
          line-height: 1.65;
          z-index: 12;
        }

        .nf-actions {
          display: flex;
          gap: 14px;
          z-index: 12;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn-home {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0.65rem 1.4rem;
          background: ${isLight ? "#0f172a" : "#ffffff"};
          color: ${isLight ? "#ffffff" : "#09090b"};
          border: none;
          border-radius: 10px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .nf-btn-home:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px ${brandColor}40;
        }

        .nf-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0.65rem 1.4rem;
          background: ${isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"};
          color: ${isLight ? "#334155" : "#e2e8f0"};
          border: 1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"};
          border-radius: 10px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
        }
        .nf-btn-back:hover {
          border-color: ${isLight ? "#94a3b8" : "#71717a"};
          background: ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)"};
          color: ${isLight ? "#0f172a" : "#ffffff"};
          transform: translateY(-1px);
        }
      `}</style>

      <div className="nf-page">
        <div className="nf-glow-bg" />

        <p className="nf-code">
          <Compass size={13} className="text-primary" /> Error 404 • Page Not Found
        </p>

        <div className="nf-glitch-wrap">
          <span
            ref={textRef}
            className="nf-glitch-text"
            data-text={effectiveOrgName}
          >
            {effectiveOrgName}
          </span>
          <div ref={sl1Ref} className="nf-slice" />
          <div ref={sl2Ref} className="nf-slice" />
          <div ref={sl3Ref} className="nf-slice" />
        </div>

        <p className="nf-msg">
          This page got lost in the void.<br />
          It doesn't exist — or maybe it never did.
        </p>

        <div className="nf-actions">
          <button className="nf-btn-home" onClick={handleHome}>
            <LayoutDashboard size={15} /> Go to Dashboard
          </button>
          <button className="nf-btn-back" onClick={handleBack}>
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    </>
  );
}
