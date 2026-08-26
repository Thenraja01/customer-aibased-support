import { memo } from "react";
import { Check, Loader2, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface AIProcessingStepsProps {
  currentStatus: string;
  statusList?: string[];
  isStreaming: boolean;
}

const DEFAULT_STAGES = [
  "Analyzing question",
  "Checking permissions",
  "Searching knowledge base",
  "Checking graph relationships",
  "Generating response",
];

export const AIProcessingSteps = memo(function AIProcessingSteps({
  currentStatus,
  isStreaming,
}: AIProcessingStepsProps) {
  if (!isStreaming) return null;

  // Map known server status strings to clean display text
  const cleanCurrent = currentStatus || "Analyzing question";
  
  // Find current active index
  let activeIndex = DEFAULT_STAGES.findIndex((s) =>
    s.toLowerCase().includes(cleanCurrent.toLowerCase().split(":")[0].trim())
  );
  if (activeIndex === -1) activeIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="my-3 mx-4 p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/20 shadow-lg max-w-md"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40">
        <Loader2 size={13} className="animate-spin text-primary shrink-0" />
        <span className="text-[11.5px] font-bold text-foreground tracking-wide uppercase">
          Agent Processing
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {DEFAULT_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div
              key={stage}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : isCompleted
                  ? "text-emerald-500 font-medium"
                  : "text-muted-foreground/60"
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Loader2 size={10} className="animate-spin" />
                  </div>
                ) : (
                  <Circle size={12} className="text-muted-foreground/40" />
                )}
              </div>
              <span className="text-[11.5px] truncate">
                {isActive && currentStatus && !DEFAULT_STAGES.includes(currentStatus)
                  ? currentStatus
                  : stage}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});
