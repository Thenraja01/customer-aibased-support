import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Database,
  Network,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  GitBranch,
} from "lucide-react";

interface PresetPrompt {
  id: string;
  label: string;
  query: string;
  response: string;
  model: string;
  latency: string;
  confidence: number;
  citations: {
    title: string;
    docId: string;
    score: number;
    chunkId: string;
    entity: string;
  }[];
  suggestedAction?: {
    actionName: string;
    payload: string;
    risk: "LOW" | "MEDIUM" | "HIGH";
  };
}

const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: "sso-okta",
    label: "🔐 SAML 2.0 / Okta SSO Setup",
    query: "How do I configure SAML 2.0 SSO with Okta and map custom enterprise department claims?",
    response:
      "To configure Okta SAML 2.0 SSO with custom department claims:\n\n1. **IdP Metadata Ingestion:** In **Admin > Security > SSO Settings**, upload your Okta IdP metadata XML or provide the Single Sign-On URL (`https://your-domain.okta.com/app/sso`).\n2. **Attribute Statement Mapping:** In your Okta SAML application settings, configure attribute statement `department` mapped to `user.department` and `role` mapped to `appuser.role`.\n3. **Tenant & Branch Scope Enforcement:** SupportAI's RBAC Gate will automatically match the department claim to your scoped Branch ID (`branch_na_east`) with strict 5-tier isolation.\n4. **Assertion Encryption:** Download the SupportAI SP X.509 Certificate to enforce SHA-256 encrypted assertions.",
    model: "Google Gemini 2.0 Pro",
    latency: "284ms",
    confidence: 99.4,
    citations: [
      {
        title: "Enterprise SSO & Okta Integration Guide (v4.2)",
        docId: "DOC-8941",
        score: 0.962,
        chunkId: "chk_sso_942",
        entity: "Identity::Okta_SAML_Provider",
      },
      {
        title: "Tenant Scoping & Custom Claims Schema",
        docId: "DOC-2309",
        score: 0.941,
        chunkId: "chk_claims_108",
        entity: "Security::RBAC_Claim_Mapper",
      },
    ],
    suggestedAction: {
      actionName: "configure_sso_claims_mapping",
      payload: '{"provider": "okta", "enforceBranchScope": true, "signAlgorithm": "SHA-256"}',
      risk: "MEDIUM",
    },
  },
  {
    id: "sla-credit",
    label: "💳 Autonomous SLA Refund Check",
    query: "Customer in ticket #4092 suffered a 45-min downtime in US-East. Are they eligible for SLA credit?",
    response:
      "**SLA Evaluation Report for Ticket #4092:**\n\n- **Account Tier:** Enterprise Tier-1 ($120k ARR, Branch `US-East-1`).\n- **Recorded Outage Window:** 45 minutes on 2026-08-24 14:10 UTC.\n- **SLA Policy Contract (Sec 4.2):** Outages exceeding 30 mins in a calendar month guarantee a **15% monthly billing credit** ($1,500.00).\n- **HITL Governance Trigger:** Because refund amount > $1,000, autonomous execution requires 1-Click approval from `Org Admin` or `SuperAdmin`.",
    model: "Claude 3.5 Sonnet",
    latency: "318ms",
    confidence: 98.7,
    citations: [
      {
        title: "Master Enterprise Service Level Agreement (SLA)",
        docId: "DOC-0012",
        score: 0.978,
        chunkId: "chk_sla_004",
        entity: "Contract::Tier1_Credit_Schedule",
      },
      {
        title: "Automated Incident Postmortem #8812",
        docId: "DOC-7731",
        score: 0.923,
        chunkId: "chk_inc_519",
        entity: "Incident::US_East_Downtime",
      },
    ],
    suggestedAction: {
      actionName: "dispatch_hitl_sla_refund",
      payload: '{"ticketId": "4092", "creditAmount": 1500.00, "currency": "USD", "reason": "SLA breach 45m"}',
      risk: "HIGH",
    },
  },
  {
    id: "graph-reasoning",
    label: "🕸️ Neo4j Knowledge Graph Traversal",
    query: "What downstream services and branch databases are affected if Redis cluster node-03 goes offline?",
    response:
      "**Neo4j Multi-Hop Impact Analysis (Depth: 3 hops):**\n\n```\n(Redis:node-03) -[:CACHES_SESSION]-> (SocketIO:Cluster-East)\n                -[:RATE_LIMITS]-> (API_Gateway:NA-East)\n                -[:LOCKS_MUTATION]-> (Ticket_Engine:Org-Global)\n```\n\n1. **Socket.io Live Chat Session State:** Active live chat typing indicators and uncommitted draft sync will fall back to local browser state and MongoDB persistent reconnect.\n2. **Multi-Tenant Rate Limiter:** Will fail open into memory bucket mode (max 500 req/min per IP) preventing service denial.\n3. **Recommendation:** Automated failover to `redis-slave-03b` is queued. No data loss expected.",
    model: "Hybrid RAG + Neo4j Cypher",
    latency: "342ms",
    confidence: 99.1,
    citations: [
      {
        title: "Infrastructure Topology & Failover Matrix",
        docId: "DOC-9901",
        score: 0.985,
        chunkId: "chk_infra_990",
        entity: "Topology::Redis_Failover_Protocol",
      },
    ],
    suggestedAction: {
      actionName: "initiate_hot_standby_switch",
      payload: '{"targetNode": "redis-slave-03b", "drainTimeoutMs": 3000}',
      risk: "HIGH",
    },
  },
];

export default function HeroSection() {
  const [selectedPrompt, setSelectedPrompt] = useState<PresetPrompt>(PRESET_PROMPTS[0]);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [actionDispatched, setActionDispatched] = useState(false);

  // Typewriter streaming effect
  useEffect(() => {
    setIsTyping(true);
    setActionDispatched(false);
    setActiveCitation(null);
    setDisplayedText("");

    let currentIndex = 0;
    const fullText = selectedPrompt.response;
    const speed = fullText.length > 300 ? 5 : 10;

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 4));
        currentIndex += 4;
      } else {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [selectedPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-48 -z-10 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-48 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-20" />

      <div className="container mx-auto px-4">
        {/* Top Header Badge & Titles */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md dark:border-primary/40 dark:bg-primary/15"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>SupportAI v3.0 • Multi-Agent Hybrid RAG & Graph Copilot</span>
            <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider">
              Enterprise
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Zero-Hallucination AI Support for{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">
              Mission-Critical Enterprises
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
          >
            Unify <span className="font-semibold text-foreground">Dense Vector Search (ChromaDB)</span>,{" "}
            <span className="font-semibold text-foreground">BM25 Sparse Retrieval</span>, and{" "}
            <span className="font-semibold text-foreground">Neo4j Graph RAG</span> with autonomous Human-In-The-Loop
            guardrails and 5-tier tenant scoping.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="group gap-2 rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/95"
              asChild
            >
              <a href="#interactive-features">
                Explore Feature Matrix
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-border/80 bg-background/60 backdrop-blur-md hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <a href="#live-architecture">
                <Layers className="h-4 w-4 text-primary" />
                Live Architecture & SLA
              </a>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/contact">
                Schedule Demo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Quick Key Stat Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 gap-4 border-y border-border/40 py-6 sm:grid-cols-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>&lt;320ms</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Hybrid RRF Retrieval</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span>99.4%</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Grounding Precision</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                <Activity className="h-5 w-5 text-primary" />
                <span>74%</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Autonomous Resolution</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                <GitBranch className="h-5 w-5 text-sky-500" />
                <span>5-Tier</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">RBAC Tenant Isolation</span>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Interactive AI Chat Preview Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mx-auto mt-12 max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border/80 bg-card/70 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/40 dark:shadow-primary/10">
            {/* Top Prompt Selector Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-3 w-3 items-center justify-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 text-xs font-mono font-medium text-muted-foreground">
                  supportai-sandbox://copilot-runtime
                </span>
              </div>

              {/* Preset Scenario Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Live Queries:
                </span>
                {PRESET_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPrompt(p)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selectedPrompt.id === p.id
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Body Mockup */}
            <div className="grid gap-4 p-4 lg:grid-cols-12">
              {/* Left Main Chat Stream */}
              <div className="flex flex-col justify-between rounded-xl bg-background/80 p-4 border border-border/50 lg:col-span-8 min-h-[380px]">
                {/* User Input Bubble */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary/15 px-4 py-3 text-sm text-foreground border border-primary/20">
                      <p className="font-medium">{selectedPrompt.query}</p>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                        <span>Customer • Scoped Tenant: org_enterprise_01</span>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      USR
                    </div>
                  </div>

                  {/* AI Response Stream Bubble */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="w-full max-w-[90%] rounded-2xl rounded-tl-none border border-border/80 bg-card p-4 text-sm shadow-sm dark:bg-muted/30">
                      {/* Model & Latency Telemetry Header */}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary text-[10px]">
                            <Cpu className="h-3 w-3" />
                            {selectedPrompt.model}
                          </Badge>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            ⚡ {selectedPrompt.latency}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>{selectedPrompt.confidence}% Grounded</span>
                        </div>
                      </div>

                      {/* Markdown / Text content with animated cursor */}
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                        {displayedText}
                        {isTyping && (
                          <span className="inline-block h-4 w-1.5 animate-pulse bg-primary ml-0.5" />
                        )}
                      </div>

                      {/* Action Dispatch Tool Card (if present) */}
                      {selectedPrompt.suggestedAction && !isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-amber-500" />
                              <span className="text-xs font-semibold text-foreground">
                                Autonomous Action Proposal
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] uppercase ${
                                  selectedPrompt.suggestedAction.risk === "HIGH"
                                    ? "border-rose-500 text-rose-500 bg-rose-500/10"
                                    : "border-amber-500 text-amber-500 bg-amber-500/10"
                                }`}
                              >
                                {selectedPrompt.suggestedAction.risk} RISK (Requires HITL)
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-2 rounded bg-black/40 p-2 font-mono text-[11px] text-amber-200">
                            <code>
                              {selectedPrompt.suggestedAction.actionName}(
                              {selectedPrompt.suggestedAction.payload})
                            </code>
                          </div>

                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            {actionDispatched ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                                <CheckCircle2 className="h-4 w-4" />
                                Queued to HITL Approval Queue
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setActionDispatched(true)}
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                              >
                                Simulate Dispatch to HITL Gate
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Bottom utility controls */}
                      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px]">Anti-Hallucination Guardrail: Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted hover:text-foreground text-[11px]"
                          >
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                          <button
                            onClick={() => setSelectedPrompt({ ...selectedPrompt })}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted hover:text-foreground text-[11px]"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Rerun
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive query footer */}
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span className="flex-1 font-mono text-[11px] truncate">
                    Ready for natural language prompt or REST trigger...
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    RRF Score: 0.942
                  </Badge>
                </div>
              </div>

              {/* Right Telemetry & Grounded Citations Sidebar */}
              <div className="flex flex-col justify-between space-y-4 rounded-xl bg-muted/20 p-4 border border-border/40 lg:col-span-4">
                <div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Grounded Citations
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-500">
                      {selectedPrompt.citations.length} Verified Sources
                    </Badge>
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Synthesized from multi-stage vector chunks & Neo4j graph nodes:
                  </p>

                  {/* Citations List */}
                  <div className="mt-3 space-y-2.5">
                    {selectedPrompt.citations.map((cit, idx) => (
                      <div
                        key={cit.chunkId}
                        onClick={() => setActiveCitation(activeCitation === idx ? null : idx)}
                        className={`cursor-pointer rounded-lg border p-2.5 transition-all text-xs ${
                          activeCitation === idx
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/60 bg-card/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-foreground line-clamp-1">
                            [{idx + 1}] {cit.title}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] font-bold text-primary">
                            {(cit.score * 100).toFixed(1)}% match
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <span className="rounded bg-muted px-1.5 py-0.5">{cit.chunkId}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5">{cit.docId}</span>
                        </div>

                        {/* Entity Graph Tag */}
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                          <Network className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cit.entity}</span>
                        </div>

                        {activeCitation === idx && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground"
                          >
                            <p>
                              Verified via Cross-Encoder Reranker. Anti-hallucination score passed 0.72
                              sufficiency threshold.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Step Mini Telemetry */}
                <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-[11px]">
                  <div className="font-semibold text-foreground flex items-center justify-between mb-1.5">
                    <span>Retrieval Pipeline:</span>
                    <span className="text-emerald-500 font-mono">OK (200)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>• ChromaDB Dense:</span>
                      <span className="text-foreground">top-30 chunks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• BM25 Sparse:</span>
                      <span className="text-foreground">top-20 matches</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Neo4j Graph RAG:</span>
                      <span className="text-foreground">3-hop expansion</span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1 text-primary font-semibold">
                      <span>• RRF + Reranker:</span>
                      <span>Golden Top-3 selected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
