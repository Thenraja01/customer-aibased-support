import { Clock, ShieldAlert, CheckCircle2, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SlaAutoClosePanelProps {
  form: any;
  updateField: (path: string, value: any) => void;
}

const PRIORITIES = [
  { key: "urgent", label: "Urgent Priority", defaultResp: 30, defaultRes: 240, badge: "bg-destructive/10 text-destructive border-destructive/20" },
  { key: "high", label: "High Priority", defaultResp: 60, defaultRes: 480, badge: "bg-secondary/10 text-secondary border-secondary/20" },
  { key: "medium", label: "Medium Priority", defaultResp: 240, defaultRes: 1440, badge: "bg-accent/10 text-amber-500 border-accent/20" },
  { key: "low", label: "Low Priority", defaultResp: 720, defaultRes: 2880, badge: "bg-primary/10 text-primary border-primary/20" },
];

export default function SlaAutoClosePanel({ form, updateField }: SlaAutoClosePanelProps) {
  const sla = form.sla_settings || {};
  const autoClose = form.auto_close_settings || { enabled: true, closing_period_hours: 48 };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Service Level Agreements (SLA) & Ticket Auto-Close
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Define priority-based first response & resolution targets, and configure automatic ticket closing after resolution.
        </p>
      </div>

      {/* SLA Policy Targets */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 border-b dark:border-white/[0.06] pb-2">
          <Timer size={16} className="text-indigo-500" /> Response & Resolution SLA Targets
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {PRIORITIES.map((p) => {
            const currentResp = sla[p.key]?.first_response_minutes ?? p.defaultResp;
            const currentRes = sla[p.key]?.resolution_minutes ?? p.defaultRes;

            return (
              <div
                key={p.key}
                className="p-4 rounded-xl border bg-card/50 dark:border-white/[0.08] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${p.badge}`}>
                    {p.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">First Response (mins)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentResp}
                      onChange={(e) =>
                        updateField(`sla_settings.${p.key}.first_response_minutes`, Number(e.target.value))
                      }
                      className="h-9 text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      ~{(currentResp / 60).toFixed(1)} hrs
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Resolution Target (mins)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentRes}
                      onChange={(e) =>
                        updateField(`sla_settings.${p.key}.resolution_minutes`, Number(e.target.value))
                      }
                      className="h-9 text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      ~{(currentRes / 60).toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Breach Notification & Warning Threshold Percentage */}
      <div className="space-y-4 border-t dark:border-white/[0.06] pt-6 max-w-4xl">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-500" /> SLA Warning & Breach Notification Threshold
        </h4>

        <div className="p-5 rounded-2xl border bg-card/60 dark:border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">SLA Time Remaining Warning Threshold</Label>
              <p className="text-xs text-muted-foreground">
                Trigger SLA Warning notifications when the remaining SLA time falls below this percentage.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <span className="text-sm font-bold text-amber-500">
                {form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50}% Time Remaining
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2 pt-2">
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateField("sla_warning_threshold_pct", val);
                updateField("sla_settings.warning_threshold_pct", val);
              }}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>10% Remaining</span>
              <span>25%</span>
              <span className="font-bold text-amber-500">50% (Default)</span>
              <span>75%</span>
              <span>90% Remaining</span>
            </div>
          </div>

          {/* Dynamic Visual SLA Percentage Timeline Bar */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-muted-foreground block">Dynamic SLA Alert Timeline Preview</span>
            <div className="h-5 w-full bg-muted/60 rounded-lg overflow-hidden flex border dark:border-white/[0.08] text-[10px] font-bold text-white font-mono">
              <div
                style={{ width: `${100 - (form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50)}%` }}
                className="bg-emerald-500/80 flex items-center justify-center transition-all duration-300"
              >
                🟢 On Track ({100 - (form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50)}%)
              </div>
              <div
                style={{ width: `${form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50}%` }}
                className="bg-amber-500/90 flex items-center justify-center transition-all duration-300"
              >
                🟠 SLA Warning Notification Trigger ({form.sla_warning_threshold_pct ?? form.sla_settings?.warning_threshold_pct ?? 50}%)
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Example: For a 4-hour SLA target, notification triggers when <strong className="text-amber-500">{((form.sla_warning_threshold_pct ?? 50) / 100 * 4).toFixed(1)} hours ({((form.sla_warning_threshold_pct ?? 50) / 100 * 240)} mins)</strong> remaining.
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Auto-Close Rules */}
      <div className="space-y-4 border-t dark:border-white/[0.06] pt-6 max-w-4xl">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={16} className="text-emerald-500" /> Auto-Close Resolved Tickets
        </h4>

        <div className="p-5 rounded-2xl border bg-card/60 dark:border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Automatic Ticket Closing</Label>
              <p className="text-xs text-muted-foreground">
                Automatically transition ticket status from <span className="font-semibold text-emerald-500">Resolved</span> to <span className="font-semibold text-slate-400">Closed</span> if customer remains inactive.
              </p>
            </div>
            <Switch
              checked={autoClose.enabled !== false}
              onCheckedChange={(checked) => updateField("auto_close_settings.enabled", checked)}
            />
          </div>

          {autoClose.enabled !== false && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t dark:border-white/[0.06]">
              <div className="space-y-1.5">
                <Label className="text-xs">Resolution Grace Period (Hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={autoClose.closing_period_hours ?? 48}
                  onChange={(e) =>
                    updateField("auto_close_settings.closing_period_hours", Number(e.target.value))
                  }
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Default is 48 hours (2 days). Range: 1 hour to 720 hours (30 days).
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl flex items-center gap-3 text-xs text-muted-foreground border dark:border-white/[0.06]">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                <span>
                  Resolved tickets will automatically be closed after{" "}
                  <strong className="text-foreground">{autoClose.closing_period_hours ?? 48} hours</strong> (~{((autoClose.closing_period_hours ?? 48) / 24).toFixed(1)} days) if the customer does not reopen or respond.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
