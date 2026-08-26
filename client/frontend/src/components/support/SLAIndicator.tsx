import React from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SLAIndicatorProps {
  createdAt?: string;
  slaMinutes?: number;
  compact?: boolean;
}

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  createdAt,
  slaMinutes = 15,
  compact = false,
}) => {
  if (!createdAt) return null;

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - createdTime) / (1000 * 60));
  const remainingMinutes = slaMinutes - elapsedMinutes;

  let status: "healthy" | "warning" | "breached" = "healthy";
  if (remainingMinutes <= 0) {
    status = "breached";
  } else if (remainingMinutes <= 5) {
    status = "warning";
  }

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          status === "breached"
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            : status === "warning"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        }`}
        title={`SLA: ${slaMinutes}m total. Elapsed: ${elapsedMinutes}m`}
      >
        <Clock size={10} />
        {status === "breached"
          ? `Breached (${Math.abs(remainingMinutes)}m overdue)`
          : `${remainingMinutes}m SLA`}
      </span>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
        status === "breached"
          ? "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400"
          : status === "warning"
          ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      <div className="flex items-center gap-2">
        {status === "breached" ? (
          <AlertTriangle size={16} className="shrink-0" />
        ) : status === "warning" ? (
          <Clock size={16} className="shrink-0 animate-pulse" />
        ) : (
          <CheckCircle2 size={16} className="shrink-0" />
        )}
        <div>
          <p className="font-bold">
            {status === "breached"
              ? "SLA Breached"
              : status === "warning"
              ? "SLA Approaching Target"
              : "SLA On Track"}
          </p>
          <p className="text-[11px] opacity-80">
            {status === "breached"
              ? `Target exceeded by ${Math.abs(remainingMinutes)} mins`
              : `${remainingMinutes} minutes remaining before SLA breach`}
          </p>
        </div>
      </div>
      <Badge variant="outline" className="font-mono text-[10px]">
        {elapsedMinutes}m / {slaMinutes}m
      </Badge>
    </div>
  );
};
