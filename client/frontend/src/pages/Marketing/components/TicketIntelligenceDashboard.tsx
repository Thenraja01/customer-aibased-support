import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Users,
  ShieldCheck,
  TrendingDown,
  Globe,
  Tag,
  FileQuestion,
  ArrowUpRight,
} from "lucide-react";

interface TicketData {
  id: string;
  title: string;
  customer: string;
  tier: string;
  arr: string;
  created: string;
  dimensions: {
    // 1. Category
    category: { name: string; confidence: number };
    // 2. Priority
    priority: { level: "P1-Critical" | "P2-High" | "P3-Medium" | "P4-Low"; color: string };
    // 3. Sentiment
    sentiment: { label: "Negative / Frustrated" | "Neutral" | "Positive"; score: number; polarity: number };
    // 4. Duplicate Detection
    duplicates: { count: number; clusterId: string; similarTickets: string[] };
    // 5. SLA Breach Risk
    slaRisk: { breachRisk: number; timeRemaining: string; deadline: string };
    // 6. RAG Grounded Suggestions
    ragSuggestion: { text: string; confidence: number; docSource: string };
    // 7. Language & Localization
    language: { code: string; language: string; translated: boolean };
    // 8. Churn & Revenue Risk
    churnRisk: { level: "HIGH" | "MEDIUM" | "LOW"; arrAtRisk: string };
    // 9. Skill-Based Routing
    routing: { targetTeam: string; assignedAgent: string; skillMatch: number };
    // 10. Compliance & Toxicity
    compliance: { piiScrubbed: boolean; toxicityScore: number; status: "CLEAN" | "FLAGGED" };
    // 11. Root Cause & Knowledge Gap
    knowledgeGap: { rootCause: string; kbArticleMissing: boolean; suggestedNewArticle: string };
  };
}

const TICKETS: TicketData[] = [
  {
    id: "TICK-9042",
    title: "CRITICAL: Okta SSO throws 500 error across entire US-East branch after cert rotation",
    customer: "Global Logistics Corp",
    tier: "Enterprise Tier-1",
    arr: "$145,000 / yr",
    created: "8 mins ago",
    dimensions: {
      category: { name: "Authentication / SAML 2.0", confidence: 99.4 },
      priority: { level: "P1-Critical", color: "rose" },
      sentiment: { label: "Negative / Frustrated", score: 88, polarity: -0.76 },
      duplicates: { count: 3, clusterId: "CLUSTER-AUTH-EAST", similarTickets: ["#9039", "#9040", "#9041"] },
      slaRisk: { breachRisk: 87, timeRemaining: "22 mins", deadline: "15m P1 Target" },
      ragSuggestion: {
        text: "The new X.509 certificate signature mismatch was identified in SP metadata. Please re-sync Okta public key fingerprint in Admin > SSO Settings > Key Store.",
        confidence: 98.6,
        docSource: "SSO_Okta_Guide_v4.2.pdf",
      },
      language: { code: "en-US", language: "English (United States)", translated: false },
      churnRisk: { level: "HIGH", arrAtRisk: "$145,000" },
      routing: { targetTeam: "Tier-3 Security & Identity", assignedAgent: "Alex Chen (Staff Security)", skillMatch: 99 },
      compliance: { piiScrubbed: true, toxicityScore: 0.02, status: "CLEAN" },
      knowledgeGap: {
        rootCause: "IdP Cert Fingerprint Invalidation",
        kbArticleMissing: false,
        suggestedNewArticle: "Automated Okta Rolling Key Rotation Protocol",
      },
    },
  },
  {
    id: "TICK-8812",
    title: "Billing invoice discrepancy: charged for 120 unassigned developer seats on Annual Pro",
    customer: "TechFlow Dynamics",
    tier: "Scale Enterprise",
    arr: "$82,000 / yr",
    created: "25 mins ago",
    dimensions: {
      category: { name: "Billing / Seat Licensing", confidence: 97.2 },
      priority: { level: "P2-High", color: "amber" },
      sentiment: { label: "Negative / Frustrated", score: 65, polarity: -0.45 },
      duplicates: { count: 0, clusterId: "CLUSTER-BILLING-SOLO", similarTickets: [] },
      slaRisk: { breachRisk: 34, timeRemaining: "1 hr 35 mins", deadline: "2h P2 Target" },
      ragSuggestion: {
        text: "Under Section 3.1 of Annual Master Agreement, unassigned seats are billed prorated unless marked 'Archived' prior to billing cycle cutoff.",
        confidence: 96.1,
        docSource: "Enterprise_Billing_Terms.md",
      },
      language: { code: "en-US", language: "English", translated: false },
      churnRisk: { level: "MEDIUM", arrAtRisk: "$82,000" },
      routing: { targetTeam: "Finance & Accounts Escalations", assignedAgent: "Elena Rostova (Account Exec)", skillMatch: 95 },
      compliance: { piiScrubbed: true, toxicityScore: 0.01, status: "CLEAN" },
      knowledgeGap: {
        rootCause: "Unassigned Seat Retention Ambiguity",
        kbArticleMissing: true,
        suggestedNewArticle: "How Enterprise Annual Seat Allocation & Prorated True-Ups Work",
      },
    },
  },
  {
    id: "TICK-7710",
    title: "Intermittent timeout on WebSocket chat connections during peak European trading hours",
    customer: "FinTech Prime Ltd",
    tier: "Enterprise Tier-1",
    arr: "$210,000 / yr",
    created: "42 mins ago",
    dimensions: {
      category: { name: "Infrastructure / Socket.io", confidence: 98.1 },
      priority: { level: "P2-High", color: "amber" },
      sentiment: { label: "Neutral", score: 40, polarity: -0.12 },
      duplicates: { count: 2, clusterId: "CLUSTER-SOCKET-TIMEOUT", similarTickets: ["#7704", "#7708"] },
      slaRisk: { breachRisk: 48, timeRemaining: "1 hr 18 mins", deadline: "2h P2 Target" },
      ragSuggestion: {
        text: "Redis adapter cluster memory exhaustion detected on Frankfurt shard-02. Recommended action: promote redis-slave-02b and expand buffer queue to 10k connections.",
        confidence: 97.4,
        docSource: "High_Availability_Disaster_Recovery.md",
      },
      language: { code: "en-GB", language: "English (United Kingdom)", translated: false },
      churnRisk: { level: "MEDIUM", arrAtRisk: "$210,000" },
      routing: { targetTeam: "SRE & Core Infrastructure", assignedAgent: "Marcus Vance (Principal SRE)", skillMatch: 98 },
      compliance: { piiScrubbed: true, toxicityScore: 0.00, status: "CLEAN" },
      knowledgeGap: {
        rootCause: "Redis Adapter Buffer Saturation",
        kbArticleMissing: false,
        suggestedNewArticle: "Socket.io Horizontal Auto-Scaling with Redis Cluster",
      },
    },
  },
];

export default function TicketIntelligenceDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<TicketData>(TICKETS[0]);
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);

  const handleCopySuggestion = () => {
    navigator.clipboard.writeText(selectedTicket.dimensions.ragSuggestion.text);
    setCopiedSuggestion(true);
    setTimeout(() => setCopiedSuggestion(false), 2000);
  };

  const d = selectedTicket.dimensions;

  return (
    <section className="relative py-20 lg:py-28 bg-muted/15 border-t border-border/40">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Next-Gen Predictive AI Engine
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            11-Dimensional{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">
              Ticket Intelligence Matrix
            </span>
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Every incoming ticket is evaluated simultaneously across 11 predictive dimensions in &lt;180ms—from
            real-time churn risk and frustration analysis to grounded RAG auto-responses and knowledge gap detection.
          </p>
        </div>

        {/* Ticket Selector Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {TICKETS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                selectedTicket.id === t.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="font-mono mr-1.5">{t.id}:</span>
              <span className="truncate max-w-[200px] inline-block align-bottom">{t.customer}</span>
            </button>
          ))}
        </div>

        {/* Intelligence Matrix Grid Card */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/40 p-6">
          {/* Top Ticket Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{selectedTicket.id}</span>
                <span className="text-xs text-muted-foreground">• {selectedTicket.created}</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {selectedTicket.tier}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                  {selectedTicket.arr}
                </Badge>
              </div>
              <h3 className="mt-1.5 text-base sm:text-lg font-bold text-foreground">
                {selectedTicket.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs px-3 py-1 font-bold uppercase ${
                  d.priority.level.startsWith("P1")
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "bg-amber-600 text-white"
                }`}
              >
                {d.priority.level}
              </Badge>
            </div>
          </div>

          {/* 11 Dimensions Showcase Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 1. Category Classification */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  1. Category Classification
                </span>
                <span className="font-mono text-emerald-500 font-bold">{d.category.confidence}%</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.category.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Zero-shot multi-label taxonomy match</p>
            </div>

            {/* 2. Priority Prediction */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  2. Priority Prediction
                </span>
                <span className="font-mono text-rose-500 font-bold">Severity: MAX</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.priority.level}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Calculated from enterprise ARR & outage blast radius</p>
            </div>

            {/* 3. Sentiment & Frustration Meter */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Frown className="h-3.5 w-3.5 text-amber-500" />
                  3. Frustration Meter
                </span>
                <span className="font-mono text-amber-500 font-bold">{d.sentiment.score}/100</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.sentiment.label}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${d.sentiment.score}%` }}
                />
              </div>
            </div>

            {/* 4. Duplicate / Semantic Clustering */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-sky-500" />
                  4. Duplicate Detection
                </span>
                <span className="font-mono text-sky-500 font-bold">{d.duplicates.count} Linked</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground font-mono">{d.duplicates.clusterId}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {d.duplicates.count > 0 ? `Merged with: ${d.duplicates.similarTickets.join(", ")}` : "Unique incident cluster"}
              </p>
            </div>

            {/* 5. SLA Breach Risk Prediction */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                  5. SLA Breach Risk
                </span>
                <span className="font-mono text-rose-500 font-bold">{d.slaRisk.breachRisk}% Risk</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.slaRisk.timeRemaining} Left</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Target: {d.slaRisk.deadline}</p>
            </div>

            {/* 7. Language & Localization */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  7. Language & Localization
                </span>
                <span className="font-mono text-primary font-bold">{d.language.code}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.language.language}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Auto-detect & real-time polyglot translation</p>
            </div>

            {/* 8. Churn & Revenue Risk */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  8. Churn & Revenue Risk
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase ${
                    d.churnRisk.level === "HIGH" ? "border-rose-500 text-rose-400" : "border-amber-500 text-amber-400"
                  }`}
                >
                  {d.churnRisk.level}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">{d.churnRisk.arrAtRisk} ARR</p>
              <p className="mt-1 text-[11px] text-muted-foreground">CSM notified automatically</p>
            </div>

            {/* 9. Skill-Based Routing */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-500" />
                  9. Skill-Based Routing
                </span>
                <span className="font-mono text-emerald-500 font-bold">{d.routing.skillMatch}% Match</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground truncate">{d.routing.assignedAgent}</p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate">{d.routing.targetTeam}</p>
            </div>

            {/* 10. Toxicity & Compliance Guardrail */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  10. Compliance & PII Guardrail
                </span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-[9px]">
                  {d.compliance.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">PII Redacted & Safe</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Toxicity Score: {d.compliance.toxicityScore}</p>
            </div>

            {/* 11. Knowledge Gap & Root Cause */}
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 transition-all hover:border-primary/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileQuestion className="h-3.5 w-3.5 text-purple-500" />
                  11. Knowledge Gap Alert
                </span>
                <span className="font-mono text-purple-400 text-[10px]">
                  {d.knowledgeGap.kbArticleMissing ? "GAP DETECTED" : "DOCUMENTED"}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-foreground truncate">{d.knowledgeGap.suggestedNewArticle}</p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate">Cause: {d.knowledgeGap.rootCause}</p>
            </div>
          </div>

          {/* 6. RAG Grounded Auto-Suggestions Wide Banner */}
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  6. RAG Grounded Auto-Response Suggestion (One-Click Canned Resolution)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                  {d.ragSuggestion.confidence}% Grounded Confidence
                </Badge>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Source: {d.ragSuggestion.docSource}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-sm text-foreground leading-relaxed">
              "{d.ragSuggestion.text}"
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-primary/20 pt-3 text-xs">
              <span className="text-muted-foreground">Agent can inject or send in 1 click via WebSocket Live Chat.</span>
              <Button
                size="sm"
                onClick={handleCopySuggestion}
                className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs font-semibold"
              >
                {copiedSuggestion ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedSuggestion ? "Copied to Clipboard" : "Copy Suggested Response"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
