import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  Network,
  Search,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  Terminal,
  Activity,
  Maximize2,
  Filter,
  Layers,
} from "lucide-react";

interface RagScenario {
  id: string;
  title: string;
  query: string;
  cypherQuery: string;
  denseScore: number;
  sparseScore: number;
  graphScore: number;
  rrfScore: number;
  sufficiencyScore: number;
  nodes: {
    id: string;
    label: string;
    type: "tenant" | "document" | "entity" | "policy" | "branch";
    x: number;
    y: number;
    active: boolean;
  }[];
  edges: {
    from: string;
    to: string;
    label: string;
    active: boolean;
  }[];
  goldenChunks: {
    id: string;
    source: string;
    text: string;
    vectorScore: number;
    bm25Rank: number;
    graphHops: number;
    finalRank: number;
  }[];
}

const SCENARIOS: RagScenario[] = [
  {
    id: "sso-saml",
    title: "1. SAML SSO & Identity Federation",
    query: "How does Okta SAML 2.0 claim mapping resolve across isolated tenant branches?",
    cypherQuery:
      "MATCH (t:Tenant {id: 'org_enterprise_01'})-[:HAS_BRANCH]->(b:Branch)\nMATCH (b)-[:APPLIES_POLICY]->(p:Policy {type: 'SAML_2.0'})\nMATCH (p)-[:REQUIRES_CLAIM]->(e:Entity {name: 'Department_Scope'})\nRETURN t, b, p, e LIMIT 5;",
    denseScore: 0.94,
    sparseScore: 0.88,
    graphScore: 0.98,
    rrfScore: 0.952,
    sufficiencyScore: 0.96,
    nodes: [
      { id: "n1", label: "Tenant: Org_Enterprise", type: "tenant", x: 15, y: 30, active: true },
      { id: "n2", label: "Branch: US_East_01", type: "branch", x: 38, y: 18, active: true },
      { id: "n3", label: "Branch: EU_Central_02", type: "branch", x: 38, y: 55, active: false },
      { id: "n4", label: "Policy: SAML_2.0_SSO", type: "policy", x: 65, y: 22, active: true },
      { id: "n5", label: "Entity: Okta_Claims", type: "entity", x: 88, y: 35, active: true },
      { id: "n6", label: "Doc: SSO_Guide_v4", type: "document", x: 65, y: 65, active: true },
    ],
    edges: [
      { from: "n1", to: "n2", label: "HAS_BRANCH", active: true },
      { from: "n1", to: "n3", label: "HAS_BRANCH", active: false },
      { from: "n2", to: "n4", label: "APPLIES_POLICY", active: true },
      { from: "n4", to: "n5", label: "REQUIRES_CLAIM", active: true },
      { from: "n2", to: "n6", label: "INDEXED_IN", active: true },
    ],
    goldenChunks: [
      {
        id: "chk_sso_891",
        source: "SSO_Okta_Guide_v4.2.pdf",
        text: "SAML assertion attributes (department, branch_scope) are decrypted using the tenant X.509 cert and validated at RBAC Gate.",
        vectorScore: 0.942,
        bm25Rank: 1,
        graphHops: 2,
        finalRank: 1,
      },
      {
        id: "chk_rbac_402",
        source: "Tenant_Isolation_Architecture.md",
        text: "BranchAdmin authorization is constrained to local branch entities; claims matching US_East_01 restrict cross-branch reads.",
        vectorScore: 0.918,
        bm25Rank: 2,
        graphHops: 3,
        finalRank: 2,
      },
    ],
  },
  {
    id: "redis-failover",
    title: "2. Redis Topology & Live Session Failover",
    query: "What downstream live socket events and caches are impacted if Redis shard 3 drops?",
    cypherQuery:
      "MATCH (r:RedisNode {shard: 'shard_03'})-[:CACHES_SESSION]->(s:SocketCluster)\nMATCH (r)-[:RATE_LIMITS]->(g:Gateway)\nRETURN r, s, g;",
    denseScore: 0.89,
    sparseScore: 0.95,
    graphScore: 0.97,
    rrfScore: 0.941,
    sufficiencyScore: 0.94,
    nodes: [
      { id: "n1", label: "Redis: Shard_03", type: "entity", x: 18, y: 40, active: true },
      { id: "n2", label: "Socket.io Cluster", type: "entity", x: 48, y: 20, active: true },
      { id: "n3", label: "API Gateway RateLimiter", type: "policy", x: 48, y: 65, active: true },
      { id: "n4", label: "Doc: High_Availability.md", type: "document", x: 80, y: 35, active: true },
    ],
    edges: [
      { from: "n1", to: "n2", label: "CACHES_SESSION", active: true },
      { from: "n1", to: "n3", label: "RATE_LIMITS", active: true },
      { from: "n2", to: "n4", label: "DOCUMENTED_IN", active: true },
    ],
    goldenChunks: [
      {
        id: "chk_ha_991",
        source: "High_Availability_Disaster_Recovery.md",
        text: "Redis cluster failover triggers automated hot-standby promotion within 3 seconds. Socket.io falls back to MongoDB uncommitted queue.",
        vectorScore: 0.935,
        bm25Rank: 1,
        graphHops: 2,
        finalRank: 1,
      },
      {
        id: "chk_gw_201",
        source: "RateLimiting_Spec.md",
        text: "When Redis is unreachable, API Gateway fails open into in-memory token bucket mode (max 500 req/min per IP).",
        vectorScore: 0.884,
        bm25Rank: 3,
        graphHops: 1,
        finalRank: 2,
      },
    ],
  },
  {
    id: "sla-p1",
    title: "3. P1 Breach Risk & Autonomous Escalation",
    query: "Calculate SLA breach penalty and trigger on-call engineering dispatch for Ticket #8841.",
    cypherQuery:
      "MATCH (t:Ticket {id: '8841'})-[:BELONGS_TO]->(c:Customer {tier: 'Enterprise'})\nMATCH (c)-[:HAS_SLA]->(s:SLAContract)\nRETURN t, c, s;",
    denseScore: 0.92,
    sparseScore: 0.91,
    graphScore: 0.99,
    rrfScore: 0.963,
    sufficiencyScore: 0.98,
    nodes: [
      { id: "n1", label: "Ticket #8841 (P1)", type: "entity", x: 15, y: 40, active: true },
      { id: "n2", label: "Customer: Acme Corp", type: "tenant", x: 45, y: 22, active: true },
      { id: "n3", label: "SLA: Tier-1 99.99%", type: "policy", x: 75, y: 25, active: true },
      { id: "n4", label: "Action: Page OnCall", type: "policy", x: 75, y: 65, active: true },
    ],
    edges: [
      { from: "n1", to: "n2", label: "BELONGS_TO", active: true },
      { from: "n2", to: "n3", label: "BOUND_BY", active: true },
      { from: "n1", to: "n4", label: "AUTO_TRIGGERS", active: true },
    ],
    goldenChunks: [
      {
        id: "chk_sla_332",
        source: "Master_Services_Agreement_SLA.pdf",
        text: "P1 incidents with response time > 15 minutes incur an automated 10% SLA service credit and page the primary engineering lead.",
        vectorScore: 0.956,
        bm25Rank: 1,
        graphHops: 2,
        finalRank: 1,
      },
    ],
  },
];

export default function HybridRagVisualizer() {
  const [activeTab, setActiveTab] = useState<"graph" | "fusion" | "formula">("graph");
  const [selectedScenario, setSelectedScenario] = useState<RagScenario>(SCENARIOS[0]);
  const [selectedNode, setSelectedNode] = useState<string | null>("n5");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.72);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "tenant":
        return "border-emerald-500 bg-emerald-500/15 text-emerald-400";
      case "branch":
        return "border-sky-500 bg-sky-500/15 text-sky-400";
      case "policy":
        return "border-amber-500 bg-amber-500/15 text-amber-400";
      case "document":
        return "border-purple-500 bg-purple-500/15 text-purple-400";
      case "entity":
      default:
        return "border-primary bg-primary/15 text-primary";
    }
  };

  return (
    <section id="interactive-features" className="relative py-20 lg:py-28 bg-muted/10 border-t border-border/40">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Zero-Hallucination Grounding Engine
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Hybrid Multi-Index RAG &{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">
              Knowledge Graph Traversal
            </span>
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Traditional RAG fails when queries require multi-hop entity relationships. SupportAI merges{" "}
            <span className="font-semibold text-foreground">ChromaDB dense vectors</span>,{" "}
            <span className="font-semibold text-foreground">BM25 keyword search</span>, and{" "}
            <span className="font-semibold text-foreground">Neo4j Graph Cypher</span> via Reciprocal Rank Fusion.
          </p>
        </div>

        {/* Scenario Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedScenario(s);
                setSelectedNode(null);
              }}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                selectedScenario.id === s.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-card/80 text-muted-foreground border border-border/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Interactive Sandbox Container */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/30">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Query:
                </span>
                <p className="text-sm font-bold text-foreground line-clamp-1">{selectedScenario.query}</p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 text-xs">
              <button
                onClick={() => setActiveTab("graph")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  activeTab === "graph" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Network className="h-3.5 w-3.5 text-sky-500" />
                Neo4j Graph View
              </button>

              <button
                onClick={() => setActiveTab("fusion")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  activeTab === "fusion" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                RRF Multi-Index Fusion
              </button>

              <button
                onClick={() => setActiveTab("formula")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  activeTab === "formula" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-amber-500" />
                Cypher & Formulas
              </button>
            </div>
          </div>

          {/* Main Visualizer Area */}
          <div className="grid gap-6 p-6 lg:grid-cols-12">
            {/* Left Graph / Fusion Display */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-background/80 p-4 lg:col-span-8 min-h-[420px]">
              {activeTab === "graph" && (
                <div className="relative h-full w-full min-h-[380px]">
                  {/* Subtle Graph Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#8882_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* Top Legend */}
                  <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-semibold border border-emerald-500/20">
                      ● Tenant Node
                    </span>
                    <span className="flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-sky-500 font-semibold border border-sky-500/20">
                      ● Branch Node
                    </span>
                    <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-500 font-semibold border border-amber-500/20">
                      ● Policy Node
                    </span>
                    <span className="flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-purple-500 font-semibold border border-purple-500/20">
                      ● Document Node
                    </span>
                  </div>

                  {/* SVG Edges Canvas */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none">
                    {selectedScenario.edges.map((edge, idx) => {
                      const fromNode = selectedScenario.nodes.find((n) => n.id === edge.from);
                      const toNode = selectedScenario.nodes.find((n) => n.id === edge.to);
                      if (!fromNode || !toNode) return null;

                      return (
                        <g key={idx}>
                          <line
                            x1={`${fromNode.x}%`}
                            y1={`${fromNode.y}%`}
                            x2={`${toNode.x}%`}
                            y2={`${toNode.y}%`}
                            stroke={edge.active ? "hsl(var(--primary))" : "rgba(150,150,150,0.2)"}
                            strokeWidth={edge.active ? "2" : "1"}
                            strokeDasharray={edge.active ? "4 2" : "none"}
                            className={edge.active ? "animate-pulse" : ""}
                          />
                          <text
                            x={`${(fromNode.x + toNode.x) / 2}%`}
                            y={`${(fromNode.y + toNode.y) / 2 - 2}%`}
                            fill="currentColor"
                            className="text-[9px] font-mono fill-muted-foreground"
                            textAnchor="middle"
                          >
                            {edge.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* HTML Node Elements */}
                  {selectedScenario.nodes.map((node) => (
                    <motion.div
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.08 }}
                      className={`absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 rounded-xl border p-2.5 shadow-lg backdrop-blur-md transition-all text-xs font-semibold ${getNodeColor(
                        node.type
                      )} ${
                        selectedNode === node.id
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                          : ""
                      } ${!node.active ? "opacity-40" : "opacity-100"}`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Network className="h-3 w-3" />
                        <span>{node.label}</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Bottom Graph prompt */}
                  <div className="absolute bottom-2 right-2 rounded-lg bg-background/90 border border-border/60 p-2 text-[10px] text-muted-foreground backdrop-blur-sm">
                    <span>💡 Click any node to inspect relationship graph properties</span>
                  </div>
                </div>
              )}

              {activeTab === "fusion" && (
                <div className="space-y-4">
                  <div className="border-b border-border/40 pb-2">
                    <h4 className="text-sm font-bold text-foreground">
                      Reciprocal Rank Fusion (RRF) & Cross-Encoder Top Chunks
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Candidates aggregated across 3 distinct modalities: ChromaDB Dense Vector (0.5), BM25
                      Sparse (0.3), and Neo4j Graph Proximity (0.2).
                    </p>
                  </div>

                  {/* Golden Chunks Cards */}
                  <div className="space-y-3">
                    {selectedScenario.goldenChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 transition-all hover:border-primary"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground text-[10px]">
                              Rank #{chunk.finalRank} Golden Chunk
                            </Badge>
                            <span className="font-mono text-xs font-bold text-foreground">
                              {chunk.source}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-500 font-bold">
                            {(chunk.vectorScore * 100).toFixed(1)}% Relevance
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          "{chunk.text}"
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[11px] font-mono text-muted-foreground">
                          <span>Vector Score: <strong className="text-foreground">{chunk.vectorScore}</strong></span>
                          <span>BM25 Rank: <strong className="text-foreground">#{chunk.bm25Rank}</strong></span>
                          <span>Graph Hops: <strong className="text-foreground">{chunk.graphHops} hops</strong></span>
                          <span>Chunk ID: <strong className="text-primary">{chunk.id}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Threshold Slider */}
                  <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        Context Sufficiency Gate Threshold:
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {similarityThreshold.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="0.95"
                      step="0.01"
                      value={similarityThreshold}
                      onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                      className="mt-2 w-full accent-primary cursor-pointer"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>0.50 (Loose Fallback)</span>
                      <span>0.72 (Enterprise Default)</span>
                      <span>0.95 (Ultra-Strict Guardrail)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "formula" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-black/60 p-4 font-mono text-xs text-emerald-400">
                    <div className="mb-2 flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-bold text-sky-400">⚡ Live Neo4j Cypher Query</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                        Executed in 12ms
                      </Badge>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedScenario.cypherQuery}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs">
                    <h5 className="font-bold text-foreground mb-1.5">
                      Reciprocal Rank Fusion Mathematical Formulation:
                    </h5>
                    <div className="rounded bg-background/80 p-2.5 font-mono text-[11px] text-primary">
                      RRF(d) = ∑ [ w_m / (k + rank_m(d)) ]  where m ∈ (Dense, BM25, Graph), k=60
                    </div>
                    <p className="mt-2 text-muted-foreground text-[11px]">
                      Ensures balanced contribution from keyword exact match, high-dimensional semantic
                      embeddings, and graph relational hops without scale distortion.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Telemetry & Modality Metrics */}
            <div className="flex flex-col justify-between space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 lg:col-span-4">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Modality Breakdown
                  </span>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                    RRF: {(selectedScenario.rrfScore * 100).toFixed(1)}%
                  </Badge>
                </div>

                {/* Score Bars */}
                <div className="mt-4 space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Database className="h-3.5 w-3.5 text-primary" />
                        ChromaDB Dense Vector:
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {(selectedScenario.denseScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedScenario.denseScore * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Search className="h-3.5 w-3.5 text-amber-500" />
                        BM25 Inverted Index:
                      </span>
                      <span className="font-mono font-bold text-amber-500">
                        {(selectedScenario.sparseScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedScenario.sparseScore * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Network className="h-3.5 w-3.5 text-sky-500" />
                        Neo4j Graph Proximity:
                      </span>
                      <span className="font-mono font-bold text-sky-500">
                        {(selectedScenario.graphScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedScenario.graphScore * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-sky-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Sufficiency Check Card */}
                <div className="mt-6 rounded-xl border border-border/80 bg-background/80 p-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Sufficiency Verification:</span>
                    {selectedScenario.sufficiencyScore >= similarityThreshold ? (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Passed ({selectedScenario.sufficiencyScore})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Escalated to Human
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-normal">
                    {selectedScenario.sufficiencyScore >= similarityThreshold
                      ? "Score satisfies threshold. Grounded prompt passed to LLM synthesis engine."
                      : "Sufficiency below threshold. Triggering safe fallback auto-ticket creation."}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Feature List */}
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>512-Token Semantic Sliding Windows</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Cross-Encoder Query-Doc Scoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
