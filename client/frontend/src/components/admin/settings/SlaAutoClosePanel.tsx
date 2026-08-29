import { Clock, ShieldAlert, CheckCircle2, Timer, UserCheck, Users, RotateCw, Zap, Sparkles, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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

const ASSIGNMENT_METHODS = [
  {
    id: "round_robin",
    title: "Round Robin Rotation",
    description: "Sequentially rotates new tickets equally across all available support agents.",
    icon: RotateCw,
    tag: "Equal Distribution",
  },
  {
    id: "least_busy",
    title: "Least Busy (Load Balanced)",
    description: "Automatically assigns tickets to the agent with the lowest active/open ticket workload.",
    icon: Scale,
    tag: "Workload Optimized",
  },
  {
    id: "skill_based",
    title: "Skill & Topic Matching",
    description: "Matches incoming ticket categories and tags with specialized agent skills and language.",
    icon: Sparkles,
    tag: "Specialization",
  },
  {
    id: "hybrid",
    title: "Hybrid Smart Dispatch",
    description: "Multi-factor algorithm evaluating agent availability, branch location, and weighted ticket load.",
    icon: Zap,
    tag: "Recommended",
  },
  {
    id: "manual",
    title: "Manual Queue Triage",
    description: "Keeps tickets in unassigned queue until manually claimed or assigned by a lead/admin.",
    icon: Users,
    tag: "Manual Control",
  },
];

export default function SlaAutoClosePanel({ form, updateField }: SlaAutoClosePanelProps) {
  const sla = form.sla_settings || {};
  const autoClose = form.auto_close_settings || { enabled: true, closing_period_hours: 48 };
  const assignment = form.ticket_assignment_config || {
    method: "round_robin",
    auto_assign_on_create: true,
    only_active_agents: true,
    max_tickets_per_agent: 10,
    reassign_on_sla_warning: false,
    inactivity_timeout_mins: 60,
    fallback_to_branch_admin: true,
  };

  const selectedMethod = assignment.method || "round_robin";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Service Level Agreements (SLA), Ticket Assignment & Auto-Close
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure automatic ticket dispatch methods, priority-based SLA response targets, and resolved ticket auto-closing.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. TICKET AUTO-ASSIGNMENT & DISPATCH METHOD */}
      {/* ========================================================================= */}
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <UserCheck size={16} className="text-primary" /> Ticket Assignment & Routing Strategy
          </h4>
          <Badge variant="outline" className="text-xs font-mono uppercase border-primary/30 text-primary">
            Active: {selectedMethod.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ASSIGNMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => updateField("ticket_assignment_config.method", method.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/40"
                    : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon size={16} />
                    </div>
                    <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                      {method.tag}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-bold text-foreground pt-1">{method.title}</h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{method.description}</p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <input
                    type="radio"
                    name="assignmentMethod"
                    checked={isSelected}
                    onChange={() => updateField("ticket_assignment_config.method", method.id)}
                    className="accent-primary cursor-pointer"
                  />
                  <span>{isSelected ? "Selected Method" : "Select"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assignment Constraints & Rules */}
        <div className="p-5 rounded-2xl border bg-card/60 dark:border-white/[0.08] space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Assignment Rules & Agent Capacity Controls
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Auto Assign on Create */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Auto-Assign on Creation</Label>
                <p className="text-[11px] text-muted-foreground">Automatically trigger routing engine upon new ticket creation.</p>
              </div>
              <Switch
                checked={assignment.auto_assign_on_create !== false}
                onCheckedChange={(checked) => updateField("ticket_assignment_config.auto_assign_on_create", checked)}
              />
            </div>

            {/* Only Active/Online Staff */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Check Agent Availability</Label>
                <p className="text-[11px] text-muted-foreground">Only assign tickets to staff currently marked as Online / Active.</p>
              </div>
              <Switch
                checked={assignment.only_active_agents !== false}
                onCheckedChange={(checked) => updateField("ticket_assignment_config.only_active_agents", checked)}
              />
            </div>

            {/* Reassign on SLA Warning */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Re-assign on Inactivity</Label>
                <p className="text-[11px] text-muted-foreground">Re-route ticket if unacknowledged after grace timeout.</p>
              </div>
              <Switch
                checked={assignment.reassign_on_sla_warning ?? false}
                onCheckedChange={(checked) => updateField("ticket_assignment_config.reassign_on_sla_warning", checked)}
              />
            </div>

            {/* Fallback to Branch Admin */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Branch Admin Fallback</Label>
                <p className="text-[11px] text-muted-foreground">Route to Branch Admin if all support agents reach capacity.</p>
              </div>
              <Switch
                checked={assignment.fallback_to_branch_admin !== false}
                onCheckedChange={(checked) => updateField("ticket_assignment_config.fallback_to_branch_admin", checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t dark:border-white/[0.06]">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Maximum Active Ticket Load Per Agent</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={assignment.max_tickets_per_agent ?? 10}
                onChange={(e) => updateField("ticket_assignment_config.max_tickets_per_agent", Number(e.target.value))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">Agents at capacity will be skipped during auto-assignment rotation.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Agent Inactivity Timeout (Minutes)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={assignment.inactivity_timeout_mins ?? 60}
                onChange={(e) => updateField("ticket_assignment_config.inactivity_timeout_mins", Number(e.target.value))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">Time before an untouched ticket triggers re-assignment alerts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SLA POLICY TARGETS */}
      {/* ========================================================================= */}
      <div className="space-y-4 max-w-4xl border-t dark:border-white/[0.06] pt-6">
        <h4 className="text-sm font-semibold flex items-center gap-2 border-b dark:border-white/[0.06] pb-2">
          <Timer size={16} className="text-indigo-500" /> Response & Resolution SLA Targets
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* ========================================================================= */}
      {/* 3. SLA BREACH WARNING THRESHOLD */}
      {/* ========================================================================= */}
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
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TICKET AUTO-CLOSE RULES */}
      {/* ========================================================================= */}
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
