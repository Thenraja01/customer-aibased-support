import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Terminal,
  FileCheck,
  UserCheck,
  Zap,
  Lock,
  RotateCcw,
  Sparkles,
  Layers,
  KeyRound,
} from "lucide-react";

interface ActionScenario {
  id: string;
  name: string;
  badge: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  intent: {
    tool: string;
    description: string;
    params: Record<string, any>;
  };
  requiredRole: string;
  requiresHITL: boolean;
  tenantScope: string;
  branchScope: string;
  auditOutput: {
    action: string;
    status: string;
    executedBy: string;
    auditId: string;
    timestamp: string;
  };
}

const ACTION_SCENARIOS: ActionScenario[] = [
  {
    id: "refund",
    name: "Enterprise SLA Refund ($4,500.00)",
    badge: "Financial Mutation",
    riskLevel: "HIGH",
    intent: {
      tool: "issue_sla_billing_credit",
      description: "Dispatch credit transaction to Stripe/Billing gateway for tenant breach compensation.",
      params: {
        ticketId: "TICK-9042",
        orgId: "org_enterprise_01",
        amount: 4500.0,
        currency: "USD",
        reason: "Contract Clause 8.2 - 99.9% Downtime Exceeded",
      },
    },
    requiredRole: "Org Admin / SuperAdmin",
    requiresHITL: true,
    tenantScope: "org_enterprise_01 (Enforced)",
    branchScope: "branch_us_east (Validated)",
    auditOutput: {
      action: "BILLING_CREDIT_DISPATCHED",
      status: "SUCCESS_200",
      executedBy: "Admin (HITL Approved)",
      auditId: "AUD-9942-8812-701A",
      timestamp: "2026-08-26T10:44:00Z",
    },
  },
  {
    id: "escalate",
    name: "Escalate Ticket to Tier-3 Security Lead",
    badge: "Workflow Escalation",
    riskLevel: "MEDIUM",
    intent: {
      tool: "escalate_ticket_tier",
      description: "Reassign ticket, elevate priority to P1-Critical, and trigger PagerDuty SMS alert.",
      params: {
        ticketId: "TICK-1042",
        targetTier: 3,
        notifyOnCall: true,
        urgency: "CRITICAL_P1",
      },
    },
    requiredRole: "Support Agent / Branch Admin",
    requiresHITL: false,
    tenantScope: "org_enterprise_01 (Enforced)",
    branchScope: "branch_global (Validated)",
    auditOutput: {
      action: "TICKET_TIER3_ESCALATED",
      status: "SUCCESS_200",
      executedBy: "SupportAI Autonomous Copilot",
      auditId: "AUD-3312-5509-902B",
      timestamp: "2026-08-26T10:44:00Z",
    },
  },
  {
    id: "purge-cache",
    name: "Purge Tenant Redis Cache & Invalidate JWTs",
    badge: "Security & Operations",
    riskLevel: "HIGH",
    intent: {
      tool: "purge_tenant_session_cache",
      description: "Flush Redis key prefix `sess:tenant:org_01:*` and force active user re-authentication.",
      params: {
        orgId: "org_enterprise_01",
        reason: "Security Incident Compromise Prevention",
        flushKeyPattern: "sess:tenant:org_01:*",
      },
    },
    requiredRole: "SuperAdmin Only",
    requiresHITL: true,
    tenantScope: "org_enterprise_01 (Enforced)",
    branchScope: "ALL_BRANCHES",
    auditOutput: {
      action: "TENANT_CACHE_PURGED",
      status: "SUCCESS_200",
      executedBy: "SuperAdmin (MFA Verified)",
      auditId: "AUD-7712-4401-118C",
      timestamp: "2026-08-26T10:44:00Z",
    },
  },
];

export default function AgentCopilotSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<ActionScenario>(ACTION_SCENARIOS[0]);
  const [currentStep, setCurrentStep] = useState<number>(3); // 1: Intent, 2: Scoping, 3: HITL, 4: Audit
  const [hitlStatus, setHitlStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const handleSelectScenario = (scenario: ActionScenario) => {
    setSelectedScenario(scenario);
    setHitlStatus(scenario.requiresHITL ? "pending" : "approved");
    setCurrentStep(scenario.requiresHITL ? 3 : 4);
  };

  const handleApprove = () => {
    setHitlStatus("approved");
    setCurrentStep(4);
  };

  const handleReject = () => {
    setHitlStatus("rejected");
    setCurrentStep(3);
  };

  const handleReset = () => {
    setHitlStatus(selectedScenario.requiresHITL ? "pending" : "approved");
    setCurrentStep(selectedScenario.requiresHITL ? 3 : 4);
  };

  return (
    <section className="relative py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1">
            <Bot className="h-3.5 w-3.5" />
            Autonomous Action Registry & Governance
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Autonomous AI Copilot with{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">
              Human-In-The-Loop (HITL)
            </span>
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            AI should not execute dangerous mutations without oversight. SupportAI enforces a non-bypassable
            chain: <strong className="text-foreground">Intent Planner → Tenant Scoping → RBAC Gate → HITL Approval → Tamper-Proof Audit</strong>.
          </p>
        </div>

        {/* Action Scenario Switcher */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {ACTION_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectScenario(s)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                selectedScenario.id === s.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{s.name}</span>
              <Badge
                variant="outline"
                className={`text-[9px] uppercase ${
                  s.riskLevel === "HIGH"
                    ? "border-rose-500/50 text-rose-400 bg-rose-500/10"
                    : "border-amber-500/50 text-amber-400 bg-amber-500/10"
                }`}
              >
                {s.riskLevel}
              </Badge>
            </button>
          ))}
        </div>

        {/* Pipeline Execution Flow Card */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/40 p-6">
          {/* Step Progress Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border/60 pb-6">
            <div
              className={`rounded-xl border p-3 transition-all ${
                currentStep >= 1
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border/60 bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>1. Intent Planner</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Zod JSON Schema emitted</p>
            </div>

            <div
              className={`rounded-xl border p-3 transition-all ${
                currentStep >= 2
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border/60 bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>2. Tenant & Branch Gate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Strict Isolation verified</p>
            </div>

            <div
              className={`rounded-xl border p-3 transition-all ${
                hitlStatus === "approved"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : hitlStatus === "rejected"
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>3. HITL Approval</span>
                {hitlStatus === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : hitlStatus === "rejected" ? (
                  <XCircle className="h-4 w-4 text-rose-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                )}
              </div>
              <p className="mt-1 text-[11px]">
                {hitlStatus === "approved"
                  ? "Admin Approved"
                  : hitlStatus === "rejected"
                  ? "Action Rejected"
                  : "Requires Admin Clearance"}
              </p>
            </div>

            <div
              className={`rounded-xl border p-3 transition-all ${
                currentStep >= 4 && hitlStatus === "approved"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border/60 bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>4. Immutable Audit Log</span>
                {currentStep >= 4 && hitlStatus === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Recorded in MongoDB & Redis</p>
            </div>
          </div>

          {/* Interactive Live Simulator Area */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left Intent & Tool Schema Viewer */}
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/80 p-4 lg:col-span-6">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Structured Tool Invocation Payload
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    actionRegistry.js
                  </Badge>
                </div>

                <div className="mt-3 rounded-lg border border-border/50 bg-black/60 p-3 font-mono text-xs text-sky-300">
                  <div className="text-[11px] text-muted-foreground mb-1">// Validated against Zod Schema</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`{
  "tool": "${selectedScenario.intent.tool}",
  "risk_level": "${selectedScenario.riskLevel}",
  "requires_approval": ${selectedScenario.requiresHITL},
  "required_role": "${selectedScenario.requiredRole}",
  "params": ${JSON.stringify(selectedScenario.intent.params, null, 2)}
}`}
                  </pre>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-muted-foreground">
                    <span>Tenant Boundary:</span>
                    <strong className="text-foreground font-mono">{selectedScenario.tenantScope}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-muted-foreground">
                    <span>Branch Scope:</span>
                    <strong className="text-foreground font-mono">{selectedScenario.branchScope}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <span>Autonomous Agent: Model Google Gemini 2.0 Pro</span>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 h-7 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  Reset Demo
                </Button>
              </div>
            </div>

            {/* Right Interactive HITL Admin Modal Simulation */}
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-5 lg:col-span-6">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">
                      Human-in-the-Loop Approval Interceptor
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      hitlStatus === "approved"
                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                        : hitlStatus === "rejected"
                        ? "border-rose-500 text-rose-400 bg-rose-500/10"
                        : "border-amber-500 text-amber-400 bg-amber-500/10 animate-pulse"
                    }`}
                  >
                    STATUS: {hitlStatus.toUpperCase()}
                  </Badge>
                </div>

                {/* HITL Interceptor Box */}
                {hitlStatus === "pending" && (
                  <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          Privileged Action Awaiting Org Admin Signature
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {selectedScenario.intent.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-amber-500/20 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReject}
                        className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 h-8 text-xs font-semibold"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject & Abort
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 h-8 text-xs font-semibold"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Authorize & Execute Action
                      </Button>
                    </div>
                  </div>
                )}

                {hitlStatus === "approved" && (
                  <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mutation Cleared & Dispatched Successfully!</span>
                    </div>

                    {/* Live Audit Log Receipt */}
                    <div className="mt-3 rounded-lg bg-black/60 p-3 font-mono text-[11px] text-emerald-300">
                      <div className="text-[10px] text-muted-foreground mb-1">// Immutable Audit Trail Record</div>
                      <div>AUDIT_ID: {selectedScenario.auditOutput.auditId}</div>
                      <div>ACTION: {selectedScenario.auditOutput.action}</div>
                      <div>ACTOR: {selectedScenario.auditOutput.executedBy}</div>
                      <div>TIMESTAMP: {selectedScenario.auditOutput.timestamp}</div>
                      <div>SIGNATURE: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
                    </div>
                  </div>
                )}

                {hitlStatus === "rejected" && (
                  <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <XCircle className="h-4 w-4" />
                      <span>Execution Blocked by Admin Policy</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      The action was rejected. Audit log records the refusal and prevents any database or API
                      side-effects.
                    </p>
                    <Button size="sm" variant="outline" onClick={handleReset} className="mt-3 h-7 text-xs">
                      Retry Scenario
                    </Button>
                  </div>
                )}
              </div>

              {/* Bottom Feature Pill */}
              <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Anti-Tamper Cryptographic Audit Hashes
                </span>
                <span className="font-mono text-emerald-500">Zero Security Bypass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
