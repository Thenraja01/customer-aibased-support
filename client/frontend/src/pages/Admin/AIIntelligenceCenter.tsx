import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Compass,
  AlertTriangle,
  Target,
  FlaskConical,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
  ArrowRight,
  Shield,
  Play,
  Cpu,
  Database,
  UserCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AxiosInstance from "@/api/axiosInstance";
import { AIIntelligenceAPI } from "@/api/aiIntelligence.api";
import { useToast } from "@/components/ui/toast";

type IntelligenceTab = "health" | "routing" | "conflicts" | "confidence" | "simulator";

export default function AIIntelligenceCenter() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("health");

  // Provider Settings Modal State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [configForm, setConfigForm] = useState({
    apiKey: "",
    model: "",
    baseUrl: "",
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const openProviderConfig = (p: any) => {
    setSelectedProvider(p);
    setConfigForm({
      apiKey: p.details?.apiKey || "",
      model: p.model || "",
      baseUrl: p.details?.baseUrl || "",
    });
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setTestingConnection(true);
    try {
      const res = await AxiosInstance.post("/admin/v1/models/test", {
        provider: selectedProvider.provider,
        apiKey: configForm.apiKey,
        model: configForm.model,
      });
      if (res.data?.success && (res.data?.data?.status === "healthy" || res.data?.data?.status === "HEALTHY")) {
        toast.success("Connection Successful", `${selectedProvider.provider.toUpperCase()} is responsive (${res.data.data.latencyMs}ms)`);
      } else {
        toast.error("Test Failed", res.data?.data?.error || "Could not connect to provider API");
      }
    } catch (err: any) {
      toast.error("Test Failed", err.response?.data?.message || "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveProviderConfig = async () => {
    if (!selectedProvider) return;
    setSavingConfig(true);
    try {
      await AxiosInstance.post("/agent/switch-provider", {
        provider: selectedProvider.provider,
      });
      toast.success("Provider Updated", `Set ${selectedProvider.provider.toUpperCase()} as active live provider.`);
      setSelectedProvider(null);
      fetchHealthDiagnostics();
    } catch (err: any) {
      toast.error("Update Failed", err.response?.data?.message || "Failed to update provider configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  // State for Health Agent
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // State for Routing Explorer
  const [routingPrompt, setRoutingPrompt] = useState("What is the return and refund policy for orders placed online?");
  const [routingRole, setRoutingRole] = useState("customer");
  const [routingSla, setRoutingSla] = useState(1000);
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // State for Conflict Detector
  const [conflictsData, setConflictsData] = useState<any>(null);
  const [conflictsLoading, setConflictsLoading] = useState(false);

  // State for Confidence & Escalation
  const [confidenceQuery, setConfidenceQuery] = useState("I need an urgent refund for my broken item");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [confidenceResult, setConfidenceResult] = useState<any>(null);
  const [confidenceLoading, setConfidenceLoading] = useState(false);

  // State for What-If Simulator
  const [simScenario, setSimScenario] = useState("PROVIDER_OUTAGE");
  const [simTargetProvider, setSimTargetProvider] = useState("ollama");
  const [simTrafficMultiplier, setSimTrafficMultiplier] = useState(2);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch Health Diagnostics
  const fetchHealthDiagnostics = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await AIIntelligenceAPI.getHealthDiagnostics();
      if (res.data?.success) {
        setHealthData(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load AI health diagnostics.");
    } finally {
      setHealthLoading(false);
    }
  }, [toast]);

  // Explain Routing
  const handleExplainRouting = useCallback(async () => {
    if (!routingPrompt.trim()) return;
    setRoutingLoading(true);
    try {
      const res = await AIIntelligenceAPI.explainRouting({
        prompt: routingPrompt,
        role: routingRole,
        slaMaxMs: routingSla,
        preferredProvider: healthData?.activeProvider,
      });
      if (res.data?.success) {
        setRoutingResult(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to explain model routing.");
    } finally {
      setRoutingLoading(false);
    }
  }, [routingPrompt, routingRole, routingSla, healthData?.activeProvider, toast]);

  // Fetch Knowledge Conflicts
  const fetchConflicts = useCallback(async () => {
    setConflictsLoading(true);
    try {
      const res = await AIIntelligenceAPI.detectKnowledgeConflicts();
      if (res.data?.success) {
        setConflictsData(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to scan knowledge conflicts.");
    } finally {
      setConflictsLoading(false);
    }
  }, [toast]);

  // Evaluate Answer Confidence
  const handleEvaluateConfidence = useCallback(async () => {
    if (!confidenceQuery.trim()) return;
    setConfidenceLoading(true);
    try {
      const res = await AIIntelligenceAPI.evaluateConfidence({
        query: confidenceQuery,
        threshold: confidenceThreshold,
      });
      if (res.data?.success) {
        setConfidenceResult(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to evaluate answer confidence.");
    } finally {
      setConfidenceLoading(false);
    }
  }, [confidenceQuery, confidenceThreshold, toast]);

  // Run What-If Simulation
  const handleRunSimulation = useCallback(async () => {
    setSimLoading(true);
    try {
      const res = await AIIntelligenceAPI.runWhatIfSimulation({
        scenario: simScenario,
        targetProvider: simTargetProvider,
        trafficMultiplier: simTrafficMultiplier,
      });
      if (res.data?.success) {
        setSimResult(res.data.data);
        toast.success("Simulation Complete", `Simulated ${simScenario} successfully.`);
      }
    } catch {
      toast.error("Error", "Failed to run infrastructure simulation.");
    } finally {
      setSimLoading(false);
    }
  }, [simScenario, simTargetProvider, simTrafficMultiplier, toast]);

  useEffect(() => {
    fetchHealthDiagnostics();
    fetchConflicts();
    handleExplainRouting();
    handleEvaluateConfidence();
    handleRunSimulation();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Zap className="text-primary" size={28} />
              AI Operations & Intelligence Center
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
              v3.2 Live Ops
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automated diagnostics, routing explanations, knowledge conflict detection, confidence scoring, and what-if infrastructure testing.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealthDiagnostics} disabled={healthLoading} className="gap-2">
          <RefreshCw size={14} className={healthLoading ? "animate-spin" : ""} />
          Refresh Metrics
        </Button>
      </div>

      {/* 5 Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border">
        {[
          { id: "health", label: "AI Health Agent", icon: Activity },
          { id: "routing", label: "Routing Explorer", icon: Compass },
          { id: "conflicts", label: "Conflict Detector", icon: AlertTriangle },
          { id: "confidence", label: "Confidence & Escalation", icon: Target },
          { id: "simulator", label: "What-If Simulator", icon: FlaskConical },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IntelligenceTab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <tab.icon size={15} className={isActive ? "text-primary" : ""} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: AI HEALTH AGENT */}
        {/* ========================================================================= */}
        {activeTab === "health" && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Overview Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Overall System Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{healthData?.overallScore ?? 95}%</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                    {healthData?.healthStatus || "OPTIMAL"}
                  </Badge>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Active LLM Provider</p>
                <div className="flex items-center gap-2 mt-1">
                  <Cpu size={20} className="text-primary" />
                  <span className="text-xl font-bold uppercase text-foreground">{healthData?.activeProvider || "ollama"}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">RAG Vector Indexing</p>
                <div className="flex items-center gap-2 mt-1">
                  <Database size={20} className="text-emerald-500" />
                  <span className="text-xl font-bold text-foreground">
                    {healthData?.ragMetrics?.chunkCount ?? 0} Chunks
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Avg Retrieval P95</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{healthData?.ragMetrics?.avgRetrievalLatencyMs ?? 42}</span>
                  <span className="text-xs text-muted-foreground">ms</span>
                </div>
              </div>
            </div>

            {/* Provider Diagnostic Breakdown */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                LLM Provider Diagnostic Health
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {healthData?.providers?.map((p: any) => {
                  const statusUpper = String(p.status || "").toUpperCase();
                  const isHealthy = statusUpper === "HEALTHY";
                  const isUnconfigured = statusUpper === "UNCONFIGURED";

                  return (
                    <div
                      key={p.provider}
                      onClick={() => openProviderConfig(p)}
                      className="p-4 rounded-xl border border-border/80 bg-card space-y-2 shadow-sm hover:border-primary cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wide text-foreground group-hover:text-primary transition-colors">{p.provider}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                            isHealthy
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : isUnconfigured
                              ? "bg-muted text-muted-foreground border border-border"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isHealthy
                                ? "bg-emerald-500 animate-pulse"
                                : isUnconfigured
                                ? "bg-muted-foreground/40"
                                : "bg-rose-500"
                            }`}
                          />
                          {String(p.status).toLowerCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Model: <span className="font-mono text-foreground">{p.model}</span></p>
                      <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Latency: <span className="font-mono text-foreground">{p.latencyMs}ms</span></span>
                        <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit Config →</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic Action Recommendations */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Automated Remediations & Suggestions
              </h3>
              {healthData?.recommendedActions?.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active anomalies detected. RAG pipeline and provider instances are operating cleanly.</p>
              ) : (
                <div className="space-y-2">
                  {healthData?.recommendedActions?.map((rec: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{rec.action} ({rec.target})</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20">
                        Auto-Fix Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ROUTING DECISION EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === "routing" && (
          <motion.div
            key="routing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Compass size={18} className="text-primary" />
                Model Routing Selection Rationale
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Test Prompt Query</Label>
                  <Input value={routingPrompt} onChange={(e) => setRoutingPrompt(e.target.value)} className="bg-background text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Caller Role</Label>
                  <select value={routingRole} onChange={(e) => setRoutingRole(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="customer">Customer (Level 4)</option>
                    <option value="support">Support Agent (Level 3)</option>
                    <option value="admin">Org Admin (Level 1)</option>
                    <option value="super_admin">Super Admin (Level 0)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Max SLA Target ({routingSla}ms)</Label>
                  <Input type="number" min="200" max="5000" value={routingSla} onChange={(e) => setRoutingSla(parseInt(e.target.value, 10) || 1000)} className="bg-background text-xs" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleExplainRouting} disabled={routingLoading} className="gap-2">
                  {routingLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Analyze Routing Decision
                </Button>
              </div>
            </div>

            {routingResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-foreground">Decision Rationale & Scoring Matrix</h4>
                  <ul className="space-y-2">
                    {routingResult.decisionRationale?.map((line: string, idx: number) => (
                      <li key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground flex items-start gap-2">
                        <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Provider Selection Fit Scores</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {routingResult.providerComparison?.map((p: any) => (
                        <div key={p.name} className={`p-3 rounded-xl border text-center ${p.selected ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}>
                          <p className="text-xs font-bold uppercase">{p.name}</p>
                          <p className="text-lg font-black text-primary mt-1">{p.fitScore}%</p>
                          <p className="text-[10px] text-muted-foreground">{p.speedMs}ms latency</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-foreground">Prompt Metrics</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Complexity:</span>
                      <Badge variant="outline" className="font-mono">{routingResult.analysis?.complexity}</Badge>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Estimated Tokens:</span>
                      <span className="font-mono font-bold">{routingResult.analysis?.estimatedTokens}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">SLA Budget:</span>
                      <span className="font-mono font-bold">{routingResult.analysis?.slaMaxMs}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KNOWLEDGE CONFLICT DETECTOR */}
        {/* ========================================================================= */}
        {activeTab === "conflicts" && (
          <motion.div
            key="conflicts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Knowledge Base Contradiction Scanner
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scans uploaded documents to identify conflicting policies, pricing, and operating rules across vector chunks.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={fetchConflicts} disabled={conflictsLoading} className="gap-2">
                  <RefreshCw size={14} className={conflictsLoading ? "animate-spin" : ""} />
                  Scan KB Now
                </Button>
              </div>

              {conflictsData?.conflicts?.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-muted/20 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-semibold text-foreground">
                    {conflictsData?.scannedDocumentsCount === 0
                      ? "No uploaded Knowledge Base documents found."
                      : "No policy contradictions detected across KB documents."}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {conflictsData?.scannedDocumentsCount === 0
                      ? "Upload PDF or DOCX documents in Knowledge Base to run live automated policy contradiction scanning."
                      : `Scanned ${conflictsData?.scannedDocumentsCount} uploaded document(s) cleanly.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflictsData?.conflicts?.map((conf: any) => (
                    <div key={conf.id} className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                            {conf.severity} SEVERITY
                          </Badge>
                          <span className="font-bold text-xs text-foreground">{conf.topic}</span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">Match: {Math.round(conf.confidenceScore * 100)}%</span>
                      </div>

                      <p className="text-xs font-semibold text-rose-500">Contradiction: {conf.contradictionType}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                          <p className="font-bold text-muted-foreground text-[11px]">{conf.docA?.title}</p>
                          <p className="text-muted-foreground italic">"{conf.docA?.snippet}"</p>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                          <p className="font-bold text-muted-foreground text-[11px]">{conf.docB?.title}</p>
                          <p className="text-muted-foreground italic">"{conf.docB?.snippet}"</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs">
                        <span className="text-muted-foreground font-medium">Suggested Fix: {conf.suggestedFix}</span>
                        <Button size="sm" className="h-7 text-xs gap-1">
                          Resolve Conflict
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANSWER CONFIDENCE & HUMAN ESCALATION */}
        {/* ========================================================================= */}
        {activeTab === "confidence" && (
          <motion.div
            key="confidence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Confidence Threshold & Escalation Evaluator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Test Customer Query</Label>
                  <Input value={confidenceQuery} onChange={(e) => setConfidenceQuery(e.target.value)} className="bg-background text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Min Confidence Threshold ({Math.round(confidenceThreshold * 100)}%)</Label>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full h-9"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleEvaluateConfidence} disabled={confidenceLoading} className="gap-2">
                  {confidenceLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Evaluate Confidence Score
                </Button>
              </div>
            </div>

            {confidenceResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Calculated Confidence Score</p>
                      <p className="text-4xl font-black text-foreground mt-1">{confidenceResult.confidencePercentage}%</p>
                    </div>
                    <Badge variant="outline" className={`text-xs px-3 py-1 font-bold ${
                      confidenceResult.requiresEscalation ? "border-amber-500 text-amber-500 bg-amber-500/10" : "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                    }`}>
                      {confidenceResult.requiresEscalation ? "ESCALATION RECOMMENDED" : "AUTO-RESOLVED"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{confidenceResult.escalationReason}</p>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border text-center">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground">Vector Similarity</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{Math.round(confidenceResult.metrics?.vectorSimilarityScore * 100)}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground">Graph Grounding</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{Math.round(confidenceResult.metrics?.graphGroundingScore * 100)}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-[11px] text-muted-foreground">Guardrail Safety</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{Math.round(confidenceResult.metrics?.guardrailSafetyScore * 100)}%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-foreground">Action Trigger</h4>
                  {confidenceResult.requiresEscalation ? (
                    <div className="space-y-3 text-xs">
                      <p className="text-amber-500 font-semibold">Low confidence triggers automated support ticket handoff.</p>
                      <Button className="w-full gap-2 bg-amber-500 text-black hover:bg-amber-600">
                        <UserCheck size={15} /> Hand-Off to Human Support
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <p className="text-emerald-500 font-semibold">High confidence query handled automatically by AI Assistant.</p>
                      <Button variant="outline" className="w-full gap-2 border-emerald-500/30 text-emerald-500">
                        <Check size={15} /> Direct Auto-Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: WHAT-IF SIMULATOR */}
        {/* ========================================================================= */}
        {activeTab === "simulator" && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FlaskConical size={18} className="text-primary" />
                Infrastructure What-If Simulator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Simulation Scenario</Label>
                  <select value={simScenario} onChange={(e) => setSimScenario(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="PROVIDER_OUTAGE">LLM Provider Outage</option>
                    <option value="TRAFFIC_SPIKE">Traffic Volume Burst</option>
                    <option value="RAG_THRESHOLD_CHANGE">RAG Similarity Threshold Shift</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Target Provider</Label>
                  <select value={simTargetProvider} onChange={(e) => setSimTargetProvider(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="ollama">Ollama (Local)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq Llama-3</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Traffic Surge Multiplier ({simTrafficMultiplier}x)</Label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={simTrafficMultiplier}
                    onChange={(e) => setSimTrafficMultiplier(parseInt(e.target.value, 10))}
                    className="w-full h-9"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleRunSimulation} disabled={simLoading} className="gap-2">
                  {simLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Run Scenario Simulation
                </Button>
              </div>
            </div>

            {simResult && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{simResult.simulation?.scenarioName}</h4>
                    <p className="text-xs text-muted-foreground">{simResult.simulation?.simulatedEvent}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono text-xs">
                    {simResult.simulation?.systemStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-muted-foreground font-semibold">Failover Latency</p>
                    <p className="text-xl font-bold text-foreground mt-1">{simResult.simulation?.failoverLatencyMs || simResult.simulation?.p95LatencyAfterMs || 1420}ms</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-muted-foreground font-semibold">Dropped Requests</p>
                    <p className="text-xl font-bold text-emerald-500 mt-1">{simResult.simulation?.droppedRequests ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-muted-foreground font-semibold">Cost Impact Delta</p>
                    <p className="text-xl font-bold text-foreground mt-1">{simResult.simulation?.estimatedCostImpactPer1k || "+$0.0003"}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-foreground">Simulation Execution Timeline</p>
                  <div className="space-y-1.5 font-mono text-xs">
                    {simResult.simulation?.timeline?.map((step: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-background border border-border flex items-center gap-3">
                        <span className="text-primary font-bold">{step.time}</span>
                        <span className="text-foreground">{step.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Configuration Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={20} className="text-primary" />
                  <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                    Configure {selectedProvider.provider} Provider
                  </h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProvider(null)} className="h-7 w-7 p-0">
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Active Model Name</Label>
                  <Input
                    value={configForm.model}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. qwen-2.5-70b, gemini-2.0-flash, llama3.2:3b"
                    className="bg-background text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">API Key / Auth Token</Label>
                  <Input
                    type="password"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter provider API key (gsk_..., AIzaSy...)"
                    className="bg-background text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Base URL Override (Optional)</Label>
                  <Input
                    value={configForm.baseUrl}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="e.g. http://localhost:11434 or custom proxy endpoint"
                    className="bg-background text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="gap-2 text-xs"
                >
                  {testingConnection ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-500" />}
                  Test Connection
                </Button>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedProvider(null)} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProviderConfig}
                    disabled={savingConfig}
                    className="gap-2 text-xs"
                  >
                    {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Set As Live Provider
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
