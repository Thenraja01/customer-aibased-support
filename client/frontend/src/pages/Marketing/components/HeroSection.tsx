import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, LayoutDashboard, Ticket, Sparkles, BookOpen, FileText,
  BarChart3, Building2, Settings, Search, ShieldCheck, MessagesSquare,
  GitBranch, ArrowRight, Play, CheckCircle2, Send, CircleDot, Brain,
  Zap, Clock, Layers, Lock, Database, Check, RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

/* ------------------------------ Feature pill ------------------------- */
interface FeaturePillProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  badge?: string;
}

function FeaturePill({ icon: Icon, title, sub, badge }: FeaturePillProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground tracking-tight">{title}</p>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ------------------------- Interactive Scenarios ----------------------- */
interface Scenario {
  id: string;
  tabLabel: string;
  ticketNo: string;
  status: string;
  statusColor: string;
  customerName: string;
  customerInitials: string;
  customerQuery: string;
  aiResponse: string;
  copilotAction: string;
  actionDetails: string;
  reasoningSteps: string[];
  suggestedActions: string[];
  slaTime: string;
  assignedBranch: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "billing",
    tabLabel: "💳 Billing & Refund",
    ticketNo: "#TKT-2025-0048",
    status: "Auto-Resolved",
    statusColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    customerName: "Sarah Johnson",
    customerInitials: "SJ",
    customerQuery: "Hi, I was charged twice for my Enterprise Subscription invoice #INV-9821. Can you please check and refund?",
    aiResponse: "I found the duplicate transaction on invoice #INV-9821. I've initiated an automated refund of $499.00 via Stripe. The receipt has been sent to your email!",
    copilotAction: "StripeRefundTool.execute()",
    actionDetails: "Invoice #INV-9821 matched. Reversible transaction verified with 100% confidence.",
    reasoningSteps: [
      "Vector search retrieved Stripe invoice policy docs (Score: 0.96)",
      "Cross-referenced Neo4j graph: User -> Tenant -> BillingAccount",
      "Triggered HITL safe tool invocation with idempotency key",
    ],
    suggestedActions: ["Email Receipt to Customer", "Update Billing Status", "Archive Ticket"],
    slaTime: "Resolved in 18s (SLA: 4h)",
    assignedBranch: "Global HQ — Finance",
  },
  {
    id: "technical",
    tabLabel: "⚡ API & SSO Escalation",
    ticketNo: "#TKT-2025-0052",
    status: "Copilot Assisted",
    statusColor: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    customerName: "Marcus Vance",
    customerInitials: "MV",
    customerQuery: "Our SAML 2.0 Okta SSO login is throwing error 401 'Invalid Issuer Audience' after domain migration.",
    aiResponse: "This usually occurs when Okta's Entity ID doesn't match the new callback URL. Update your IdP Metadata URI to: https://app.supportai.io/api/auth/saml/callback.",
    copilotAction: "KnowledgeGraph.traverse()",
    actionDetails: "Entity link: Okta SAML -> ACS URL config -> Multi-Tenant Branch Router.",
    reasoningSteps: [
      "Hybrid RAG matched SAML Troubleshooting Guide (BM25 + Chroma)",
      "Identified branch metadata misconfiguration in tenant payload",
      "Generated instant step-by-step resolution script",
    ],
    suggestedActions: ["Generate Test SAML Assertion", "Sync IdP Certs", "Invite Branch Admin"],
    slaTime: "1m 12s left (High Priority)",
    assignedBranch: "US-East Engineering",
  },
  {
    id: "sla",
    tabLabel: "🛡️ SLA Incident Triage",
    ticketNo: "#TKT-2025-0061",
    status: "Incident Escalation",
    statusColor: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    customerName: "Elena Rostova",
    customerInitials: "ER",
    customerQuery: "Webhook delivery rate dropped by 40% across our Europe region instances in the last 15 minutes.",
    aiResponse: "Our automated telemetry detected a regional gateway latency spike. Failover route EU-Central-1 is now active. All delayed webhooks are auto-retrying.",
    copilotAction: "IncidentCommander.trigger()",
    actionDetails: "Statuspage incident created: INC-4029. Notification broadcast to 142 impacted users.",
    reasoningSteps: [
      "Detected pattern match against ongoing infra alert INC-4029",
      "Calculated SLA impact risk index: 8.4/10",
      "Drafted public status update and linked customer tickets",
    ],
    suggestedActions: ["Post Incident Update", "Notify On-Call SRE", "Send Batch Customer Notice"],
    slaTime: "SLA Protected (Tier 1)",
    assignedBranch: "EMEA Ops Command",
  },
];

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Ticket, label: "Tickets", active: true },
  { icon: Sparkles, label: "AI Copilot" },
  { icon: BookOpen, label: "Knowledge Base" },
  { icon: FileText, label: "Documents" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Building2, label: "Organization" },
  { icon: Settings, label: "Settings" },
];

function DashboardMockup() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("billing");
  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  return (
    <div className="relative group">
      {/* Glow aura */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-sky-500/20 to-purple-600/30 opacity-75 blur-2xl transition duration-1000 group-hover:opacity-100" />

      <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl transition-all">
        {/* Scenario Switcher Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-semibold text-muted-foreground">SupportAI Agent Workspace</span>
          </div>

          <div className="flex items-center gap-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScenarioId(s.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  activeScenarioId === s.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.tabLabel}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="grid grid-cols-[56px_1fr_240px] gap-0 p-0 max-lg:grid-cols-[56px_1fr] max-sm:grid-cols-1">
          {/* Mini Sidebar */}
          <div className="flex flex-col items-center gap-1 border-r border-border/60 bg-muted/20 py-3 max-sm:hidden">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Bot className="h-4 w-4" />
            </div>
            {sidebarItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                title={label}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>

          {/* Main Chat Panel */}
          <div className="flex flex-col p-4">
            {/* Top ticket metadata header */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{scenario.ticketNo}</span>
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${scenario.statusColor}`}>
                  {scenario.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" />
                <span>{scenario.slaTime}</span>
              </div>
            </div>

            {/* Conversation Flow with AnimatePresence */}
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Customer message */}
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-border/60 bg-muted/50 p-3 text-xs leading-relaxed text-foreground shadow-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="bg-primary/20 text-[8px] font-bold text-primary">
                        {scenario.customerInitials}
                      </AvatarFallback>
                    </Avatar>
                    {scenario.customerName}
                  </p>
                  {scenario.customerQuery}
                </div>

                {/* AI Automated Reply */}
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-primary p-3 text-xs leading-relaxed text-primary-foreground shadow-md shadow-primary/20">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold opacity-90">
                    <Sparkles className="h-3 w-3" /> Autonomous AI Agent
                  </div>
                  {scenario.aiResponse}
                </div>

                {/* AI Copilot & HITL Reasoning Chain Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 dark:border-primary/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Brain className="h-3.5 w-3.5" /> AI Copilot Intelligence
                    </p>
                    <Badge variant="outline" className="text-[10px] border-primary/30 bg-background/80 text-primary">
                      {scenario.copilotAction}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-2">
                    {scenario.actionDetails}
                  </p>

                  <div className="space-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                    {scenario.reasoningSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Input Bar */}
            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="Ask AI Copilot or compose customer response…"
                className="h-9 rounded-full border-border bg-background text-xs"
                readOnly
                value="Auto-suggested resolution applied • Ready to dispatch"
              />
              <Button size="icon" className="h-9 w-9 shrink-0 rounded-full shadow-md">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Right Rail: Meta & Quick Actions */}
          <div className="hidden flex-col gap-3.5 border-l border-border/60 bg-muted/10 p-3.5 lg:flex">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Suggested Actions
              </p>
              {scenario.suggestedActions.map((action) => (
                <div
                  key={action}
                  className="mb-1.5 flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-card/60 px-2.5 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="truncate">{action}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Branch Context
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-semibold text-foreground truncate max-w-[120px]">{scenario.assignedBranch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RAG Source</span>
                  <span className="font-semibold text-primary">ChromaDB + Graph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LLM Engine</span>
                  <span className="font-semibold text-foreground">Gemini 2.0 Failover</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-semibold text-emerald-500">99.4%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Hero Main Component ------------------------------ */
export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-48 -left-40 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Hero Headline & CTA */}
          <div className="lg:col-span-6 xl:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Autonomous AI Support & Hybrid RAG Platform
              </Badge>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Smarter Support.
                <br />
                <span className="bg-gradient-to-r from-primary via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                  Zero Hallucinations.
                </span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Empower your organization with multi-tenant AI agents, Graph RAG precision, 
                and automated Human-In-The-Loop ticket workflows that deflect up to 74% of support volume.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">
                  <Link to="/register">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                  <Link to="/login">
                    <Play className="mr-2 h-4 w-4 fill-current text-primary" /> Live Demo
                  </Link>
                </Button>
              </div>

              {/* Trust highlights */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 74% Auto-Deflection
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Multi-Tenant & Branch Scoped
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Enterprise SOC2 & RBAC
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Interactive Dashboard Mockup */}
          <div className="lg:col-span-6 xl:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <DashboardMockup />

              {/* Floating Hologram Knowledge Graph Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -left-6 -bottom-6 hidden rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xl backdrop-blur-xl md:block"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Graph RAG Entity Mesh</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-500">
                    ChromaDB 768d
                  </span>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-500">
                    Neo4j Cypher
                  </span>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    Zero Hallucination
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature Grid Below Hero */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeaturePill
            icon={Bot}
            title="AI Copilot & Autonomous Agents"
            sub="Generates grounded answers, executes verified tools, and escalates seamlessly."
            badge="Auto-pilot"
          />
          <FeaturePill
            icon={Search}
            title="Hybrid RAG & Vector Embeddings"
            sub="Combines dense ChromaDB embeddings with BM25 keyword reranking."
            badge="768-dim"
          />
          <FeaturePill
            icon={Building2}
            title="Multi-Tenant & Branch Scoping"
            sub="Isolated data partitions and custom policies for organizations and regional teams."
            badge="Enterprise"
          />
          <FeaturePill
            icon={FileText}
            title="Full Document Lifecycle"
            sub="Automated parsing, chunking, peer review, and instant vector ingestion."
            badge="PDF & Docx"
          />
          <FeaturePill
            icon={MessagesSquare}
            title="Real-Time WebSocket Chat"
            sub="Sub-50ms Socket.io messaging with presence sync and push notifications."
            badge="Socket.io"
          />
          <FeaturePill
            icon={ShieldCheck}
            title="Granular RBAC & Audit Trails"
            sub="5-tier permission model from SuperAdmin to Customer with immutable audit logs."
            badge="Tier 0–4"
          />
        </div>

        {/* Bottom Feature Metrics & Multi-Tenant Highlights */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="rounded-3xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" /> Multi-Tenant Branch Routing
              </p>
              {["Acme Corp — Main Branch", "Fintech Prime — EU Regional", "CloudScale — US West"].map((t) => (
                <div key={t} className="mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" /> Real-Time Platform Velocity
              </p>
              <div className="flex h-16 items-end gap-1.5">
                {[35, 50, 42, 68, 58, 80, 72, 92, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-base font-bold text-foreground">1,248</p><p className="text-muted-foreground text-[10px]">Tickets Today</p></div>
                <div><p className="text-base font-bold text-emerald-500">18s</p><p className="text-muted-foreground text-[10px]">Avg. First Reply</p></div>
                <div><p className="text-base font-bold text-primary">98.4%</p><p className="text-muted-foreground text-[10px]">CSAT Score</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <GitBranch className="h-4 w-4 text-primary" /> Document Ingestion Pipeline
              </p>
              <div className="flex items-center justify-between">
                {["Upload", "Chunk", "Review", "Approved", "Vectorized"].map((step, i, arr) => (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < 4 ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="mt-1 h-0.5 w-full bg-border" />}
                    <p className="mt-1.5 text-center text-[9px] font-medium text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}