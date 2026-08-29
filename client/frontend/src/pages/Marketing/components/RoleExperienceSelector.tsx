import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Building2,
  GitBranch,
  Headphones,
  User,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Activity,
  Layers,
  FileText,
  Lock,
  MessageSquare,
  Bot,
  BarChart3,
  Cpu,
} from "lucide-react";

interface RoleView {
  id: string;
  roleName: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  permissions: string[];
  mockData: {
    title: string;
    kpis: { label: string; value: string; change?: string }[];
    feedTitle: string;
    feedItems: { primary: string; secondary: string; tag: string }[];
  };
}

const ROLES: RoleView[] = [
  {
    id: "super_admin",
    roleName: "SuperAdmin",
    badge: "Global Governance",
    icon: Shield,
    description:
      "Global platform orchestration across all tenant organizations, multi-region cluster health, LLM failover policies, and immutable global audit logs.",
    permissions: [
      "Global Tenant Provisioning & Deletion",
      "LLM Model Health & Multi-Vendor Fallback (Gemini/Grok/Claude)",
      "Cross-Tenant Security Audit Trails",
      "System Resource & Vector DB Cluster Telemetry",
    ],
    mockData: {
      title: "Global SuperAdmin Orchestration Console",
      kpis: [
        { label: "Active Enterprises", value: "48 Orgs", change: "+12% MoM" },
        { label: "LLM Quota Uptime", value: "99.98%", change: "Gemini / Claude Fallback Active" },
        { label: "Vector Embeddings", value: "14.2M Chunks", change: "ChromaDB Clustered" },
        { label: "Daily Grounded Queries", value: "1.85M", change: "Avg 290ms" },
      ],
      feedTitle: "Real-time Platform Audit Log Stream",
      feedItems: [
        { primary: "Org 'Acme Cloud' provisioned branch 'AP-South-1'", secondary: "Actor: superadmin@supportai.io", tag: "PROVISION" },
        { primary: "LLM Fallback switched from Claude to Gemini 2.0 Pro", secondary: "Latency trigger: 1200ms -> 240ms", tag: "AI_ROUTING" },
        { primary: "Global Graph RAG index re-balanced (Neo4j Shard 02)", secondary: "Multi-tenant Cypher optimizer", tag: "GRAPH_SYNC" },
      ],
    },
  },
  {
    id: "admin",
    roleName: "Org Admin",
    badge: "Enterprise Scope",
    icon: Building2,
    description:
      "Enterprise management: configure branches, AI copilot risk thresholds, department SSO integrations, and enterprise-wide knowledge bases.",
    permissions: [
      "Branch Provisioning & Team Quotas",
      "SAML 2.0 / OAuth Enterprise Configuration",
      "Human-In-The-Loop (HITL) Policy Authoring",
      "Organization Knowledge Base Document Ingestion",
    ],
    mockData: {
      title: "Enterprise Organization Control Center",
      kpis: [
        { label: "Active Branches", value: "8 Branches", change: "NA, EU, APAC" },
        { label: "Copilot Auto-Resolution", value: "76.4%", change: "+5.2% vs last month" },
        { label: "Pending HITL Tasks", value: "3 Approvals", change: "Requires Admin" },
        { label: "Ingested Knowledge Docs", value: "842 Guides", change: "All Verified" },
      ],
      feedTitle: "Organization Action & Approval Queue",
      feedItems: [
        { primary: "Approve $4,500 SLA Credit for Ticket #9042", secondary: "Branch: US-East • Agent: Copilot AI", tag: "HITL_PENDING" },
        { primary: "New Document Indexed: 'SAML_Okta_Guide_v4.2.pdf'", secondary: "142 chunks partitioned & enriched", tag: "KNOWLEDGE" },
        { primary: "Branch 'EU-Central' added 5 new Tier-2 Support Agents", secondary: "RBAC Matrix: Enforced", tag: "TEAM_MGMT" },
      ],
    },
  },
  {
    id: "branch_admin",
    roleName: "Branch Admin",
    badge: "Branch Isolated",
    icon: GitBranch,
    description:
      "Localized operations: manage regional team rosters, branch-scoped document permissions, SLA adherence, and localized FAQs.",
    permissions: [
      "Branch Team Roster & Schedule Assignment",
      "Branch-Scoped Document Ingestion (Strict Data Isolation)",
      "Regional SLA Adherence & Breach Prevention",
      "Branch Customer Satisfaction & Real-time Metrics",
    ],
    mockData: {
      title: "Branch Admin Console — North America East",
      kpis: [
        { label: "Branch Support Team", value: "24 Agents", change: "18 Online" },
        { label: "Branch SLA Adherence", value: "98.8%", change: "<15m P1 avg response" },
        { label: "Active Live Chats", value: "62 Sessions", change: "Zero Queue Wait" },
        { label: "Branch Knowledge Base", value: "190 Local Docs", change: "US East Regional" },
      ],
      feedTitle: "Branch Activity & Ticket Routing",
      feedItems: [
        { primary: "P1 Incident Ticket #9042 routed to Alex Chen", secondary: "Skill Match: 99% Identity Expert", tag: "ROUTED" },
        { primary: "Branch Document updated: 'Regional_Tax_Compliance_US.pdf'", secondary: "Scope: branch_na_east only", tag: "DOC_SCOPE" },
        { primary: "SLA Warning averted for Ticket #8891 (Response sent)", secondary: "Saved SLA penalty", tag: "SLA_METRIC" },
      ],
    },
  },
  {
    id: "support",
    roleName: "Support Agent",
    badge: "Live Copilot Assist",
    icon: Headphones,
    description:
      "Empowered with real-time AI copilot: instant grounded canned responses, live typing indicators, 1-click escalations, and automated ticket tagging.",
    permissions: [
      "Omnichannel Live Chat & Ticket Inbox",
      "1-Click Grounded RAG Copilot Response Injection",
      "Smart Ticket Escalation & Re-assignment",
      "Customer Interaction History & Knowledge Search",
    ],
    mockData: {
      title: "Support Agent Live Workspace & AI Copilot",
      kpis: [
        { label: "Assigned Active Tickets", value: "6 Tickets", change: "2 P1, 4 P2" },
        { label: "Copilot Suggestion Usage", value: "89%", change: "Avg 12s response" },
        { label: "CSAT Satisfaction", value: "4.9 / 5.0", change: "128 ratings" },
        { label: "Avg Resolution Time", value: "4m 18s", change: "60% faster with AI" },
      ],
      feedTitle: "Live Ticket Stream & Copilot Suggestions",
      feedItems: [
        { primary: "Ticket #9042: 'Okta SSO 500 error after cert rotate'", secondary: "Copilot generated 98.6% grounded response", tag: "AI_SUGGESTION" },
        { primary: "Ticket #8911: 'Add 15 developer seats to account'", secondary: "Auto-priced with corporate discount", tag: "AUTO_SOLVE" },
        { primary: "Live Chat with Sarah M. (Global Logistics)", secondary: "Customer sentiment: Frustrated -> Positive", tag: "LIVE_CHAT" },
      ],
    },
  },
  {
    id: "customer",
    roleName: "Customer",
    badge: "Zero-Wait Self-Service",
    icon: User,
    description:
      "Instant 24/7 intelligent self-service portal: natural language questions answered with verified citations, interactive ticket tracking, and direct agent escalation.",
    permissions: [
      "24/7 Grounded AI Live Chat Assistant",
      "Interactive Ticket Submission & Tracking",
      "Public & Organization Knowledge Search",
      "Instant Human Agent Request",
    ],
    mockData: {
      title: "Customer Self-Service Hub & Grounded Assistant",
      kpis: [
        { label: "Resolution Speed", value: "Instant (0s)", change: "Zero Wait Time" },
        { label: "Verified Citations", value: "100% Grounded", change: "Official Docs" },
        { label: "Active Support Tickets", value: "1 Open Ticket", change: "In Progress" },
        { label: "Self-Service Rating", value: "5.0 ★", change: "Seamless" },
      ],
      feedTitle: "Customer Portal & Active Inquiries",
      feedItems: [
        { primary: "Query: 'How to setup Okta SAML claims?'", secondary: "Answered in 284ms with 2 official doc citations", tag: "RESOLVED" },
        { primary: "Ticket #9042 Status: 'In Investigation by Alex Chen'", secondary: "Estimated resolution: 18 mins", tag: "IN_PROGRESS" },
        { primary: "Saved Bookmark: 'Enterprise SSO Best Practices Guide'", secondary: "Updated 2 days ago", tag: "BOOKMARK" },
      ],
    },
  },
];

export default function RoleExperienceSelector() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("super_admin");

  const currentRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];
  const IconComponent = currentRole.icon;

  return (
    <section className="relative py-20 lg:py-28 bg-background border-t border-border/40">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1">
            <Lock className="h-3.5 w-3.5" />
            5-Tier Role-Based Experience Matrix
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Tailored Experiences from{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">
              SuperAdmin to Customer
            </span>
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Every persona receives a purpose-built interface designed for maximum productivity and strict
            tenant security boundaries. Toggle any role below to preview their live console.
          </p>
        </div>

        {/* 5-Role Switcher Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {ROLES.map((role) => {
            const RoleIcon = role.icon;
            const isSelected = selectedRoleId === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25 scale-105"
                    : "bg-muted/40 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                <RoleIcon className="h-4 w-4" />
                <span>{role.roleName}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-mono ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {role.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Persona Preview Window */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/40 p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Role Description & Capabilities */}
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-5 lg:col-span-5">
              <div>
                <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{currentRole.roleName}</h3>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {currentRole.badge} Scope
                    </Badge>
                  </div>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {currentRole.description}
                </p>

                {/* Permissions Checklist */}
                <div className="mt-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Enforced Permissions & Capabilities:
                  </span>
                  {currentRole.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Data Isolation Guarantee:</span>
                <p className="mt-1 text-[11px]">
                  All database queries, vector searches, and graph traversals are strictly filtered by{" "}
                  <code>organization_id</code> and <code>branch_id</code> at the API Gateway layer.
                </p>
              </div>
            </div>

            {/* Right Interactive Mock Console UI */}
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/90 p-5 lg:col-span-7">
              <div>
                {/* Console Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-foreground">{currentRole.mockData.title}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    LIVE MOCKUP
                  </Badge>
                </div>

                {/* KPI Cards Grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentRole.mockData.kpis.map((kpi, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {kpi.label}
                      </span>
                      <div className="mt-1 text-sm sm:text-base font-black text-foreground">{kpi.value}</div>
                      {kpi.change && (
                        <span className="text-[10px] text-emerald-500 font-semibold truncate block mt-0.5">
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Activity Feed */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground mb-3">
                    <span>{currentRole.mockData.feedTitle}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Real-time WebSocket Sync</span>
                  </div>

                  <div className="space-y-2.5">
                    {currentRole.mockData.feedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card p-3 text-xs transition-all hover:border-primary/40"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{item.primary}</p>
                          <p className="text-[11px] text-muted-foreground">{item.secondary}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[9px] font-mono border-primary/30 text-primary">
                          {item.tag}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Console Action Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <span>Role active session: 100% token verified</span>
                <span className="font-mono text-primary font-semibold">JWT: RS256 Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
