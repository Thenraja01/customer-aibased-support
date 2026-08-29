import React, { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Ticket,
  Headphones,
  AlertCircle,
  Cpu,
  Database,
  BrainCircuit,
  PenTool,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export interface AIProcessingStepsProps {
  currentStatus?: string;
  statusList?: string[];
  isStreaming?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onOpenTicket?: () => void;
  onConnectAgent?: () => void;
  onSwitchModel?: (targetProvider: string, targetModel: string) => void;
  adminFailoverNotice?: {
    failedProvider?: string;
    suggestedProvider?: string;
    suggestedModel?: string;
  } | null;
}

const STAGES = [
  {
    key: "understand",
    shortLabel: "UNDERSTAND",
    title: "Understanding your request",
    icon: BrainCircuit,
    pct: 20,
  },
  {
    key: "retrieve",
    shortLabel: "RETRIEVE",
    title: "Searching knowledge base",
    icon: Database,
    pct: 45,
  },
  {
    key: "reason",
    shortLabel: "REASON",
    title: "Checking relevant information",
    icon: Cpu,
    pct: 70,
  },
  {
    key: "generate",
    shortLabel: "GENERATE",
    title: "Generating response",
    icon: PenTool,
    pct: 90,
  },
  {
    key: "finalize",
    shortLabel: "FINALIZE",
    title: "Finalizing answer",
    icon: Sparkles,
    pct: 100,
  },
];

export const AIProcessingSteps = memo(function AIProcessingSteps({
  currentStatus,
  isStreaming = true,
  hasError = false,
  errorMessage,
  onOpenTicket,
  onConnectAgent,
  onSwitchModel,
  adminFailoverNotice,
}: AIProcessingStepsProps) {
  const { user } = useAuthContext();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "branch_admin";
  const shouldReduceMotion = useReducedMotion();

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dismissAdminNotice, setDismissAdminNotice] = useState(false);

  // Time tracker for natural long-wait feedback
  useEffect(() => {
    if (!isStreaming || hasError) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, hasError]);

  // Dynamic automatic stage simulation synchronized with status keywords
  useEffect(() => {
    if (!isStreaming || hasError) return;

    if (currentStatus) {
      const lower = currentStatus.toLowerCase();
      if (lower.includes("understand") || lower.includes("intent") || lower.includes("parsing")) {
        setActiveStageIndex(0);
      } else if (lower.includes("search") || lower.includes("retriev") || lower.includes("vector") || lower.includes("knowledge")) {
        setActiveStageIndex(1);
      } else if (lower.includes("reason") || lower.includes("graph") || lower.includes("check") || lower.includes("context")) {
        setActiveStageIndex(2);
      } else if (lower.includes("generat") || lower.includes("synthes") || lower.includes("writ")) {
        setActiveStageIndex(3);
      } else if (lower.includes("final") || lower.includes("complet")) {
        setActiveStageIndex(4);
      }
    } else {
      // Natural progression timer if status string is static
      if (elapsedSeconds >= 8) setActiveStageIndex(4);
      else if (elapsedSeconds >= 5) setActiveStageIndex(3);
      else if (elapsedSeconds >= 3) setActiveStageIndex(2);
      else if (elapsedSeconds >= 1) setActiveStageIndex(1);
      else setActiveStageIndex(0);
    }
  }, [currentStatus, elapsedSeconds, isStreaming, hasError]);

  if (!isStreaming && !hasError) return null;

  const currentStage = STAGES[activeStageIndex] || STAGES[0];
  const isRetrievalPhase = activeStageIndex <= 2;
  const isGenerationPhase = activeStageIndex >= 3;

  // Long-wait dynamic label
  const waitNotice = useMemo(() => {
    if (elapsedSeconds >= 10) return "This is taking a little longer than usual...";
    if (elapsedSeconds >= 5) return "Still working on your request...";
    return null;
  }, [elapsedSeconds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="my-3 max-w-[440px] select-none"
    >
      {/* ── Main Processing Capsule Card ── */}
      <div
        className={`relative overflow-hidden rounded-2xl p-[1px] transition-colors duration-500 ${
          hasError
            ? "bg-gradient-to-b from-rose-500/40 via-rose-500/10 to-transparent shadow-[0_8px_32px_rgba(244,63,94,0.15)]"
            : "bg-gradient-to-b from-cyan-500/30 via-indigo-500/15 to-transparent shadow-[0_8px_32px_rgba(6,182,212,0.12)]"
        }`}
      >
        {/* Ambient Glassmorphism Layer */}
        <div className="relative rounded-[15px] bg-[#0B0F19]/90 backdrop-blur-xl border border-white/5 p-4 space-y-3.5">
          
          {/* Header Row: Animated Neural Core Orb + Titles */}
          <div className="flex items-center gap-3.5">
            
            {/* ── Futuristic AI Neural Core Orb ── */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              {/* Concentric Breathing Wave 1 */}
              {!hasError && !shouldReduceMotion && (
                <motion.div
                  animate={{
                    scale: [1, 1.45, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[3px]"
                />
              )}

              {/* Concentric Breathing Wave 2 (Violet) */}
              {!hasError && !shouldReduceMotion && (
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.6, 0.1, 0.6],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  className="absolute inset-0 rounded-full bg-indigo-500/25 blur-[2px]"
                />
              )}

              {/* Central Glowing Neural Core Orb */}
              <motion.div
                animate={
                  shouldReduceMotion
                    ? {}
                    : hasError
                    ? { scale: 1 }
                    : {
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          "0 0 14px rgba(6,182,212,0.45)",
                          "0 0 22px rgba(99,102,241,0.65)",
                          "0 0 14px rgba(6,182,212,0.45)",
                        ],
                      }
                }
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center border ${
                  hasError
                    ? "bg-rose-950/80 border-rose-500/40 text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.4)]"
                    : "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-indigo-950/90 border-cyan-500/40 text-cyan-400"
                }`}
              >
                {hasError ? (
                  <AlertCircle size={15} className="text-rose-400" />
                ) : (
                  <motion.div
                    animate={shouldReduceMotion ? {} : { rotate: [0, 180, 360] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="flex items-center justify-center"
                  >
                    <Sparkles size={14} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  </motion.div>
                )}

                {/* Micro Particle Simulation */}
                {!hasError && !shouldReduceMotion && (
                  <>
                    <motion.div
                      animate={
                        isRetrievalPhase
                          ? { x: [6, 0], y: [6, 0], opacity: [0, 1, 0] }
                          : { x: [0, 6], y: [0, 6], opacity: [1, 0] }
                      }
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-1 h-1 rounded-full bg-cyan-300"
                    />
                    <motion.div
                      animate={
                        isRetrievalPhase
                          ? { x: [-6, 0], y: [-6, 0], opacity: [0, 1, 0] }
                          : { x: [0, -6], y: [0, -6], opacity: [1, 0] }
                      }
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="absolute w-1 h-1 rounded-full bg-indigo-300"
                    />
                  </>
                )}
              </motion.div>
            </div>

            {/* Titles & Smooth Stage Animation */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
                  {hasError ? "AI service temporarily unavailable" : "AI is thinking..."}
                </span>
                
                {/* Elapsed Timer / Status Pulse */}
                {!hasError && (
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {elapsedSeconds}s
                  </span>
                )}
              </div>

              {/* Dynamic Subtitle with Smooth Slide & Fade Transition */}
              <div className="h-4 mt-0.5 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {hasError ? (
                    <motion.span
                      key="error-text"
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="absolute text-[11px] text-rose-300/90 font-medium truncate w-full"
                    >
                      {errorMessage || "We encountered an issue connecting to the AI model."}
                    </motion.span>
                  ) : (
                    <motion.span
                      key={currentStage.key}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute text-[11px] text-slate-400 font-medium truncate w-full flex items-center gap-1.5"
                    >
                      <span className="text-cyan-400">●</span>
                      <span>{currentStage.title}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Progress Visualization (Stages & Pulse Line) ── */}
          {!hasError && (
            <div className="space-y-1.5 pt-0.5">
              {/* Continuous Illuminated Progress Bar */}
              <div className="relative w-full h-1 rounded-full bg-slate-800/80 overflow-hidden">
                <motion.div
                  initial={{ width: "15%" }}
                  animate={{ width: `${currentStage.pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />

                {/* Moving Light Beacon Pulse */}
                {!shouldReduceMotion && (
                  <motion.div
                    animate={{ x: ["-100%", "350%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                )}
              </div>

              {/* Stage Step Labels */}
              <div className="flex justify-between items-center px-0.5">
                {STAGES.map((s, idx) => {
                  const isDone = idx < activeStageIndex;
                  const isCurrent = idx === activeStageIndex;

                  return (
                    <div key={s.key} className="flex flex-col items-center">
                      <span
                        className={`text-[9px] font-semibold tracking-wider transition-colors duration-300 ${
                          isDone
                            ? "text-cyan-400/90"
                            : isCurrent
                            ? "text-cyan-300 font-bold drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                            : "text-slate-600"
                        }`}
                      >
                        {s.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Informative Long-Wait Feedback (>5s / >10s) ── */}
          {!hasError && waitNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-[11px] text-indigo-300/80 bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1.5"
            >
              <RefreshCw size={11} className="animate-spin text-indigo-400" />
              <span>{waitNotice}</span>
            </motion.div>
          )}

          {/* ── Customer-Safe Error Action Buttons ── */}
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1.5 flex flex-wrap items-center gap-2"
            >
              {onOpenTicket && (
                <button
                  type="button"
                  onClick={onOpenTicket}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm transition-all cursor-pointer"
                >
                  <Ticket size={13} />
                  <span>Create Support Ticket</span>
                </button>
              )}
              {onConnectAgent && (
                <button
                  type="button"
                  onClick={onConnectAgent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  <Headphones size={13} />
                  <span>Connect with Live Agent</span>
                </button>
              )}
            </motion.div>
          )}

          {/* ── Admin-Specific Failover Dialog (Hidden from regular customers) ── */}
          {isAdmin && hasError && adminFailoverNotice && !dismissAdminNotice && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-amber-400 font-semibold text-[11px]">
                <span className="flex items-center gap-1">
                  <AlertCircle size={12} />
                  ADMIN: AI Model Error Detected
                </span>
                <button
                  type="button"
                  onClick={() => setDismissAdminNotice(true)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Provider <span className="font-semibold text-amber-300">{adminFailoverNotice.failedProvider || "Default"}</span> encountered an issue.
              </p>
              {adminFailoverNotice.suggestedProvider && onSwitchModel && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onSwitchModel(
                        adminFailoverNotice.suggestedProvider!,
                        adminFailoverNotice.suggestedModel || ""
                      )
                    }
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                  >
                    Switch to {adminFailoverNotice.suggestedProvider}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissAdminNotice(true)}
                    className="px-2 py-1 rounded text-slate-400 hover:text-white text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
});

export default AIProcessingSteps;
