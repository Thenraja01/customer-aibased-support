import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TenantAppLoaderProps {
  title?: string;
  orgName?: string;
  subtitle?: string | string[];
  brandColor?: string;
  secondaryColor?: string;
  bgTheme?: "dark" | "light" | "brand" | "glass" | "auto";
  duration?: number;
  onComplete?: () => void;
  isInlinePreview?: boolean;
  skeletonMode?: boolean;
}

// 3D Staggered character rise animation
const charVariants = {
  hidden: { opacity: 0, y: 22, rotateX: 90, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.12 + i * 0.04,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Subtitle words drop down with perspective
const wordVariants = {
  hidden: { opacity: 0, y: -14, rotateX: -60, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.6 + i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Outer overlay fade out
const overlayVariants = {
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 0.45, ease: "easeInOut", delay: 0.05 },
  },
};

export default function TenantAppLoader({
  title,
  orgName = "SupportAI",
  subtitle = "Build fast, ship faster",
  brandColor = "#2563eb",
  secondaryColor = "#7c3aed",
  bgTheme = "dark",
  duration = 2400,
  onComplete,
  isInlinePreview = false,
  skeletonMode = false,
}: TenantAppLoaderProps) {
  const [done, setDone] = useState(false);

  // Use orgName / title
  const displayTitle = (title && title.trim()) || orgName || "SupportAI";

  useEffect(() => {
    if (isInlinePreview) return;
    const timer = setTimeout(() => {
      setDone(true);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, isInlinePreview]);

  // Format subtitle words
  const subtitleWords = Array.isArray(subtitle)
    ? subtitle
    : typeof subtitle === "string" && subtitle.trim()
    ? subtitle.trim().split(/\s+/)
    : ["Build", "fast,", "ship", "faster"];

  // Detect active system/app theme if auto
  const isAppLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  const effectiveTheme =
    bgTheme === "auto" ? (isAppLight ? "light" : "dark") : bgTheme;

  // Background style based on theme
  const getBackdropStyles = () => {
    if (effectiveTheme === "light") {
      return {
        background: "#ffffff",
        textColor: "#0f172a",
        subColor: "#64748b",
        accentGlow: `radial-gradient(circle at 50% 45%, ${brandColor}22 0%, transparent 65%)`,
        textShadow: "none",
      };
    }
    if (effectiveTheme === "brand") {
      return {
        background: `linear-gradient(145deg, #09090b 0%, #0f172a 45%, ${secondaryColor}30 100%)`,
        textColor: "#ffffff",
        subColor: "#94a3b8",
        accentGlow: `radial-gradient(circle at 50% 40%, ${brandColor}40 0%, transparent 70%)`,
        textShadow: `0 0 32px ${brandColor}60, 0 2px 10px rgba(0,0,0,0.5)`,
      };
    }
    if (effectiveTheme === "glass") {
      return {
        background: isAppLight
          ? "rgba(255, 255, 255, 0.82)"
          : "rgba(9, 9, 11, 0.82)",
        backdropFilter: "blur(24px)",
        textColor: isAppLight ? "#0f172a" : "#ffffff",
        subColor: isAppLight ? "#64748b" : "#a1a1aa",
        accentGlow: `radial-gradient(circle at 50% 50%, ${brandColor}30 0%, transparent 60%)`,
        textShadow: isAppLight ? "none" : `0 0 24px ${brandColor}45`,
      };
    }
    // Default: midnight dark
    return {
      background: "#09090b",
      textColor: "#ffffff",
      subColor: "#a1a1aa",
      accentGlow: `radial-gradient(circle at 50% 45%, ${brandColor}26 0%, transparent 70%)`,
      textShadow: `0 0 28px ${brandColor}45, 0 2px 10px rgba(0,0,0,0.5)`,
    };
  };

  const themeStyle = getBackdropStyles();

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {(!done || isInlinePreview) && (
        <motion.div
          key="tenant-loader"
          variants={overlayVariants}
          initial="visible"
          exit="exit"
          style={{
            position: isInlinePreview ? "relative" : "fixed",
            inset: 0,
            width: "100%",
            height: isInlinePreview ? "320px" : "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: themeStyle.background,
            backdropFilter: (themeStyle as any).backdropFilter,
            zIndex: isInlinePreview ? 10 : 99999,
            userSelect: "none",
            overflow: "hidden",
            borderRadius: isInlinePreview ? "16px" : "0px",
          }}
        >
          {/* Ambient Brand Radial Glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: themeStyle.accentGlow,
              pointerEvents: "none",
            }}
          />

          {/* Skeleton Grid Pattern Overlay */}
          {skeletonMode && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(${themeStyle.textColor}12 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
                pointerEvents: "none",
              }}
            />
          )}

          {/* ── Animated 3D Perspective Title (Org Name) ── */}
          <div
            style={{
              perspective: "700px",
              display: "flex",
              overflow: "hidden",
              paddingBottom: "6px",
              zIndex: 1,
            }}
          >
            {displayTitle.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="visible"
                style={{
                  display: "inline-block",
                  fontFamily: '"Inter", "Geist", system-ui, -apple-system, sans-serif',
                  fontWeight: 800,
                  fontSize: isInlinePreview ? "2.3rem" : "clamp(2.4rem, 5.5vw, 3.8rem)",
                  letterSpacing: "-0.04em",
                  color: themeStyle.textColor,
                  lineHeight: 1,
                  whiteSpace: "pre",
                  textShadow: themeStyle.textShadow,
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* ── Subtitle / Tagline Dropdown ── */}
          <div
            style={{
              perspective: "500px",
              display: "flex",
              gap: "0.35em",
              marginTop: "0.85rem",
              overflow: "hidden",
              paddingBottom: "4px",
              zIndex: 1,
              flexWrap: "wrap",
              justifyContent: "center",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            {subtitleWords.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                style={{
                  display: "inline-block",
                  fontFamily: '"Inter", "Geist", system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  fontSize: isInlinePreview ? "0.85rem" : "clamp(0.85rem, 1.8vw, 1.05rem)",
                  color: themeStyle.subColor,
                  letterSpacing: "-0.01em",
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Animated Progress Bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "120px", opacity: 1 }}
            transition={{ duration: Math.max(0.6, duration / 1000 - 0.4), ease: "easeInOut", delay: 0.25 }}
            style={{
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`,
              marginTop: "1.75rem",
              borderRadius: "999px",
              zIndex: 1,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
