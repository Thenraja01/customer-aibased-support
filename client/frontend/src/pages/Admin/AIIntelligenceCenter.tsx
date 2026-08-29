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
  Star,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Lock,
  Power,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AxiosInstance from "@/api/axiosInstance";
import { AIIntelligenceAPI } from "@/api/aiIntelligence.api";
import { ModelManagementAPI } from "@/api/modelManagement.api";
import { useToast } from "@/components/ui/toast";

type IntelligenceTab = "models" | "health" | "routing" | "conflicts" | "confidence" | "simulator";

export default function AIIntelligenceCenter() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("models");

  // ── Tab 0: Multi-Tenant Models & Priority State ────────────────────────
  const [models, setModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [maxFallbacks, setMaxFallbacks] = useState<number>(1);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<any | null>(null);

  const [modelForm, setModelForm] = useState({
    provider: "ollama",
    model: "llama3.2:3b",
    display_name: "",
    apiKey: "",
    priority: 1,
    enabled: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const res = await ModelManagementAPI.getAIConfigs();
      if (res.data?.success) {
        setModels(res.data.data || []);
        if (res.data.maxFallbacks !== undefined) {
          setMaxFallbacks(res.data.maxFallbacks);
        }
      }
    } catch {
      toast.error("Error", "Failed to load configured AI models.");
    } finally {
      setModelsLoading(false);
    }
  }, [toast]);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await ModelManagementAPI.setDefaultModel(id);
      if (res.data?.success) {
        toast.success("Default Model Updated", res.data.message);
        fetchModels();
        fetchHealthDiagnostics();
      }
    } catch (err: any) {
      toast.error("Failed to set default", err.response?.data?.message || err.message);
    }
  };

  const handleMovePriority = async (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === models.length - 1)) {
      return;
    }
    const newModels = [...models];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newModels[index];
    newModels[index] = newModels[targetIndex];
    newModels[targetIndex] = temp;

    // Assign priorities
    const orderPayload = newModels.map((m, idx) => ({ id: m._id, priority: idx + 1 }));
    setModels(newModels);

    try {
      await ModelManagementAPI.reorderPriorities(orderPayload);
      toast.success("Priority Updated", "Model priority order saved.");
    } catch {
      toast.error("Error", "Failed to save reordered priority.");
      fetchModels();
    }
  };

  const handleTestModelConnection = async (modelItem: any) => {
    setTestingModelId(modelItem._id);
    try {
      const res = await ModelManagementAPI.testAIConfig(modelItem._id);
      if (res.data?.success && (res.data.data?.status === "healthy" || res.data.data?.status === "degraded")) {
        toast.success("Test Connection Successful", `${modelItem.display_name} is responsive (${res.data.data.latencyMs}ms)`);
      } else {
        toast.error("Connection Failed", res.data?.data?.error || "Provider unreachable or invalid credentials");
      }
      fetchModels();
    } catch (err: any) {
      toast.error("Test Error", err.response?.data?.message || "Connection test failed");
    } finally {
      setTestingModelId(null);
    }
  };

  const handleResetCircuit = async (id: string) => {
    try {
      await ModelManagementAPI.resetCircuit(id);
      toast.success("Circuit Reset", "Circuit breaker reset to CLOSED.");
      fetchModels();
    } catch {
      toast.error("Error", "Failed to reset circuit breaker.");
    }
  };

  const handleToggleEnable = async (modelItem: any) => {
    try {
      await ModelManagementAPI.updateAIConfig(modelItem._id, {
        enabled: !modelItem.enabled,
      });
      toast.success("Updated", `${modelItem.display_name} is now ${!modelItem.enabled ? "ENABLED" : "DISABLED"}`);
      fetchModels();
    } catch {
      toast.error("Error", "Failed to toggle model state.");
    }
  };

  const handleSaveModelForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await ModelManagementAPI.updateAIConfig(editingModel._id, {
          provider: modelForm.provider,
          model: modelForm.model,
          display_name: modelForm.display_name || `${modelForm.provider} - ${modelForm.model}`,
          apiKey: modelForm.apiKey || undefined,
          priority: modelForm.priority,
          configuration: {
            temperature: modelForm.temperature,
            max_tokens: modelForm.max_tokens,
          },
        });
        toast.success("Model Updated", "AI Model configuration updated.");
      } else {
        await ModelManagementAPI.createAIConfig({
          provider: modelForm.provider,
          model: modelForm.model,
          display_name: modelForm.display_name || `${modelForm.provider} - ${modelForm.model}`,
          apiKey: modelForm.apiKey || null,
          priority: models.length + 1,
          enabled: true,
          default: models.length === 0,
          configuration: {
            temperature: modelForm.temperature,
            max_tokens: modelForm.max_tokens,
          },
        });
        toast.success("Model Created", "New AI Model added to priority chain.");
      }
      setShowAddModal(false);
      setEditingModel(null);
      fetchModels();
      fetchHealthDiagnostics();
    } catch (err: any) {
      toast.error("Save Failed", err.response?.data?.message || "Failed to save model configuration");
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this model configuration?")) return;
    try {
      await ModelManagementAPI.deleteAIConfig(id);
      toast.success("Model Removed", "Model configuration deleted.");
      fetchModels();
      fetchHealthDiagnostics();
    } catch {
      toast.error("Error", "Failed to delete model configuration.");
    }
  };

  const openEditModal = (m: any) => {
    setEditingModel(m);
    setModelForm({
      provider: m.provider,
      model: m.model,
      display_name: m.display_name,
      apiKey: "",
      priority: m.priority || 1,
      enabled: m.enabled !== false,
      temperature: m.configuration?.temperature ?? 0.7,
      max_tokens: m.configuration?.max_tokens ?? 2048,
    });
    setShowAddModal(true);
  };

  const openNewModelModal = () => {
    setEditingModel(null);
    setModelForm({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      display_name: "",
      apiKey: "",
      priority: models.length + 1,
      enabled: true,
      temperature: 0.7,
      max_tokens: 2048,
    });
    setShowAddModal(true);
  };

  // ── Existing State for Other Diagnostic Tabs ───────────────────────────
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [routingPrompt, setRoutingPrompt] = useState("What is the return and refund policy for orders placed online?");
  const [routingRole, setRoutingRole] = useState("customer");
  const [routingSla, setRoutingSla] = useState(1000);
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [conflictsData, setConflictsData] = useState<any>(null);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [confidenceQuery, setConfidenceQuery] = useState("I need an urgent refund for my broken item");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [confidenceResult, setConfidenceResult] = useState<any>(null);
  const [confidenceLoading, setConfidenceLoading] = useState(false);
  const [simScenario, setSimScenario] = useState("PROVIDER_OUTAGE");
  const [simTargetProvider, setSimTargetProvider] = useState("ollama");
  const [simTrafficMultiplier, setSimTrafficMultiplier] = useState(2);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

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
      if (res.data?.success) setRoutingResult(res.data.data);
    } catch {
      toast.error("Error", "Failed to explain model routing.");
    } finally {
      setRoutingLoading(false);
    }
  }, [routingPrompt, routingRole, routingSla, healthData?.activeProvider, toast]);

  const fetchConflicts = useCallback(async () => {
    setConflictsLoading(true);
    try {
      const res = await AIIntelligenceAPI.detectKnowledgeConflicts();
      if (res.data?.success) setConflictsData(res.data.data);
    } catch {
      toast.error("Error", "Failed to scan knowledge conflicts.");
    } finally {
      setConflictsLoading(false);
    }
  }, [toast]);

  const handleEvaluateConfidence = useCallback(async () => {
    if (!confidenceQuery.trim()) return;
    setConfidenceLoading(true);
    try {
      const res = await AIIntelligenceAPI.evaluateConfidence({
        query: confidenceQuery,
        threshold: confidenceThreshold,
      });
      if (res.data?.success) setConfidenceResult(res.data.data);
    } catch {
      toast.error("Error", "Failed to evaluate answer confidence.");
    } finally {
      setConfidenceLoading(false);
    }
  }, [confidenceQuery, confidenceThreshold, toast]);

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
    fetchModels();
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
              AI Model Management & Operations Center
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
              Production Failover v4.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Priority-ordered multi-tenant LLM routing, circuit-breaker failover protection, and real-time health observability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchModels(); fetchHealthDiagnostics(); }} disabled={modelsLoading || healthLoading} className="gap-2">
            <RefreshCw size={14} className={modelsLoading || healthLoading ? "animate-spin" : ""} />
            Refresh All
          </Button>
          {activeTab === "models" && (
            <Button size="sm" onClick={openNewModelModal} className="gap-1.5 shadow-sm">
              <Plus size={15} /> Add Model
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border">
        {[
          { id: "models", label: "Model Management & Failover", icon: Star },
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
        {/* TAB 0: MODEL MANAGEMENT & PRIORITY FAILOVER */}
        {/* ========================================================================= */}
        {activeTab === "models" && (
          <motion.div
            key="models"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Architecture Banner */}
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Shield className="text-primary shrink-0" size={20} />
                <div>
                  <p className="font-bold text-foreground">Controlled Failover Architecture Active</p>
                  <p className="text-muted-foreground">
                    Default model owns the request until a genuine provider failure. Max allowed fallback attempts: <span className="font-bold text-foreground">{maxFallbacks}</span>.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-background border-border text-foreground font-mono">
                Cooldown: 60s | Threshold: 3 failures
              </Badge>
            </div>

            {/* Model Priority List */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Star size={18} className="text-amber-500 fill-amber-500" />
                    Priority-Ordered AI Models
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Drag or reorder priority. Top-most active model is the designated Default Model.
                  </p>
                </div>
              </div>

              {modelsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <p className="text-xs">Loading configured models...</p>
                </div>
              ) : models.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-border p-8 space-y-3">
                  <Cpu size={32} className="mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No Custom Models Configured</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    The platform is currently operating on system environment defaults. Add your custom models to configure priority failover.
                  </p>
                  <Button size="sm" onClick={openNewModelModal} className="gap-1.5">
                    <Plus size={14} /> Add First Model
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {models.map((item: any, idx: number) => {
                    const isDefault = item.default === true || idx === 0;
                    const cb = item.circuitBreaker || {};
                    const isCircuitOpen = cb.state === "OPEN";

                    return (
                      <div
                        key={item._id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isDefault
                            ? "border-amber-500/50 bg-amber-500/[0.03] shadow-sm"
                            : "border-border bg-card hover:border-border/80"
                        } ${!item.enabled ? "opacity-60" : ""}`}
                      >
                        {/* Left: Info */}
                        <div className="flex items-center gap-3.5">
                          {/* Priority Badge */}
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                                isDefault
                                  ? "bg-amber-500 text-black font-extrabold shadow-sm"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMovePriority(idx, "up")}
                                disabled={idx === 0}
                                className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
                                title="Move up priority"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                onClick={() => handleMovePriority(idx, "down")}
                                disabled={idx === models.length - 1}
                                className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
                                title="Move down priority"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">
                                {item.display_name || `${item.provider} - ${item.model}`}
                              </span>
                              {isDefault && (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px] font-bold">
                                  <Star size={10} className="fill-amber-500" /> DEFAULT MODEL
                                </Badge>
                              )}
                              {!item.enabled && (
                                <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                                  DISABLED
                                </Badge>
                              )}
                              {isCircuitOpen && (
                                <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                                  <AlertTriangle size={10} /> CIRCUIT OPEN ({Math.ceil((cb.remainingCooldownMs || 0) / 1000)}s)
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Provider: <span className="font-mono uppercase font-semibold text-foreground">{item.provider}</span></span>
                              <span>Model: <span className="font-mono text-foreground">{item.model}</span></span>
                              <span>Key: <span className="font-mono">{item.apiKey || (item.provider === "ollama" ? "Localhost" : "None")}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isCircuitOpen && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleResetCircuit(item._id)}
                              className="h-8 text-xs gap-1"
                            >
                              <RotateCcw size={12} /> Reset Circuit
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestModelConnection(item)}
                            disabled={testingModelId === item._id}
                            className="h-8 text-xs gap-1.5"
                          >
                            {testingModelId === item._id ? (
                              <Loader2 size={12} className="animate-spin text-primary" />
                            ) : (
                              <Play size={12} className="text-emerald-500" />
                            )}
                            Test Connection
                          </Button>

                          {!isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(item._id)}
                              className="h-8 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              <Star size={12} /> Set as Default
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEnable(item)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title={item.enabled ? "Disable model" : "Enable model"}
                          >
                            <Power size={14} className={item.enabled ? "text-emerald-500" : "text-muted-foreground"} />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(item)}
                            className="h-8 text-xs text-primary hover:text-primary/80"
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteModel(item._id)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

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
              <div className="space-y-6">
                {/* Live AI Generated Answer Preview */}
                {routingResult.liveGeneratedAnswer && (
                  <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-card to-card p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-cyan-400" />
                        <h4 className="text-sm font-bold text-foreground">Live AI Response Preview</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs uppercase border-cyan-500/40 text-cyan-400 bg-cyan-950/40">
                          {routingResult.selectedProvider || "Ollama"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {routingResult.executionLatencyMs || 240}ms
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-background/80 border border-border text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {routingResult.liveGeneratedAnswer}
                    </div>
                  </div>
                )}

                {/* Retrieved Knowledge Chunks */}
                {routingResult.retrievedKnowledgeChunks?.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-emerald-500" />
                      <h4 className="text-sm font-bold text-foreground">Retrieved Knowledge Base Chunks ({routingResult.retrievedKnowledgeChunks.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {routingResult.retrievedKnowledgeChunks.map((chunk: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-500">
                            <span>Chunk #{idx + 1}</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                              {chunk.score}% Match
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed line-clamp-3">
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision Rationale & Scoring Matrix */}
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
                  </div>

                  {/* Summary Metric Card */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-3">Routing Analysis</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Complexity:</span>
                          <span className="font-semibold text-foreground">{routingResult.analysis?.complexity || "SIMPLE"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Estimated Tokens:</span>
                          <span className="font-semibold text-foreground">~{routingResult.analysis?.estimatedTokens || 12}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">User Level:</span>
                          <span className="font-semibold text-foreground capitalize">{routingResult.analysis?.userRole || "Customer"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <span className="text-[11px] font-bold text-cyan-400">Selected: {routingResult.selectedProvider?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFLICT DETECTOR */}
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
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Knowledge Base Conflict Scanner
              </h3>
              <p className="text-xs text-muted-foreground">
                Scans indexed knowledge chunks for contradictory policies, outdated terms, or overlapping rules.
              </p>
              <div className="flex justify-end">
                <Button size="sm" onClick={fetchConflicts} disabled={conflictsLoading} className="gap-2">
                  {conflictsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Scan Conflicts
                </Button>
              </div>
            </div>

            {conflictsData && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Conflict Scan Results</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {conflictsData.scannedDocumentsCount ?? 0} Docs Scanned
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {conflictsData.scannedChunksCount ?? 0} Chunks Analyzed
                    </Badge>
                  </div>
                </div>

                {(!conflictsData.conflicts || conflictsData.conflicts.length === 0) ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{conflictsData.message || "All uploaded documents are consistent. No conflicting terms or policies detected."}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conflictsData.conflicts.map((c: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{c.topic}</span>
                          <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px]">
                            {c.severity} SEVERITY
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                          <div className="p-2.5 rounded-lg bg-background border border-border/70 space-y-1">
                            <span className="font-semibold text-foreground text-[11px]">Source A: {c.docA?.title}</span>
                            <p className="text-[11px] leading-relaxed italic">"{c.docA?.snippet}"</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-background border border-border/70 space-y-1">
                            <span className="font-semibold text-foreground text-[11px]">Source B: {c.docB?.title}</span>
                            <p className="text-[11px] leading-relaxed italic">"{c.docB?.snippet}"</p>
                          </div>
                        </div>
                        {c.suggestedFix && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 pt-1 font-medium flex items-center gap-1.5">
                            <Sparkles size={13} className="shrink-0" />
                            <span>Suggested Fix: {c.suggestedFix}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONFIDENCE & ESCALATION */}
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
                Confidence Threshold & Escalation Simulator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Customer Test Query</Label>
                  <Input value={confidenceQuery} onChange={(e) => setConfidenceQuery(e.target.value)} className="bg-background text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Threshold ({Math.round(confidenceThreshold * 100)}%)</Label>
                  <input
                    type="range"
                    min="0.4"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleEvaluateConfidence} disabled={confidenceLoading} className="gap-2">
                  {confidenceLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Evaluate Score
                </Button>
              </div>
            </div>

            {confidenceResult && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Confidence & Escalation Decision</h4>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-3 py-1 ${
                      confidenceResult.requiresEscalation
                        ? "border-rose-500/40 text-rose-400 bg-rose-950/30"
                        : "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                    }`}
                  >
                    {confidenceResult.requiresEscalation ? "⚠️ HUMAN AGENT ESCALATION" : "✅ AI AUTONOMOUS RESOLUTION"}
                  </Badge>
                </div>

                {/* Score Progress Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Confidence Score:</span>
                    <span className="text-foreground font-mono text-sm font-bold">
                      {confidenceResult.confidencePercentage || Math.round((confidenceResult.confidence || 0) * 100)}% ({confidenceResult.confidenceRating || "MEDIUM"})
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${confidenceResult.confidencePercentage || Math.round((confidenceResult.confidence || 0) * 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        confidenceResult.requiresEscalation
                          ? "bg-gradient-to-r from-amber-500 to-rose-500"
                          : "bg-gradient-to-r from-cyan-500 to-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Decision Explanation Note */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground leading-relaxed flex items-start gap-2.5">
                  <Target size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>{confidenceResult.escalationReason}</span>
                </div>

                {/* Component Grounding Breakdown */}
                {confidenceResult.metrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-background border border-border text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-semibold">Vector Similarity</p>
                      <p className="text-base font-bold text-foreground">{confidenceResult.metrics.vectorSimilarityScore || 82}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-semibold">Graph Grounding</p>
                      <p className="text-base font-bold text-foreground">{confidenceResult.metrics.graphGroundingScore || 90}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-semibold">Guardrail Safety</p>
                      <p className="text-base font-bold text-foreground">{confidenceResult.metrics.guardrailSafetyScore || 98}%</p>
                    </div>
                  </div>
                )}
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
                Failover & Outage Chaos Simulator
              </h3>
              <p className="text-xs text-muted-foreground">
                Simulate sudden provider rate-limits, server crashes, and multi-tenant traffic spikes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chaos Scenario</Label>
                  <select value={simScenario} onChange={(e) => setSimScenario(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="PROVIDER_OUTAGE">Simulate Provider 500 Outage</option>
                    <option value="RATE_LIMIT_429">Simulate 429 Rate Limit Burst</option>
                    <option value="TRAFFIC_SPIKE">Simulate 3x Multi-Tenant Spike</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Target Model</Label>
                  <select value={simTargetProvider} onChange={(e) => setSimTargetProvider(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="ollama">Ollama (Localhost)</option>
                    <option value="groq">Groq (Cloud)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Multiplier ({simTrafficMultiplier}x)</Label>
                  <Input type="number" min="1" max="10" value={simTrafficMultiplier} onChange={(e) => setSimTrafficMultiplier(parseInt(e.target.value, 10) || 1)} className="bg-background text-xs" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleRunSimulation} disabled={simLoading} className="gap-2">
                  {simLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Execute Chaos Simulation
                </Button>
              </div>
            </div>

            {simResult && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    {simResult.simulation?.scenarioName || "Chaos Simulation Results"}
                  </h4>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs">
                    {simResult.simulation?.systemStatus || "STABLE"}
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                  <p className="text-muted-foreground">{simResult.simulation?.simulatedEvent}</p>
                  {simResult.simulation?.automaticFailoverTarget && (
                    <div className="flex items-center gap-2 pt-1 font-semibold text-foreground">
                      <span>Automatic Failover Target:</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">
                        {simResult.simulation.automaticFailoverTarget}
                      </Badge>
                      <span className="text-muted-foreground font-normal">
                        ({simResult.simulation.failoverLatencyMs || 340}ms)
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline Trace */}
                {simResult.simulation?.timeline?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-muted-foreground">Execution Trace Timeline</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {simResult.simulation.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center gap-3">
                          <span className="text-primary font-bold">{step.time}</span>
                          <span className="text-foreground/90 font-sans">{step.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Add / Edit AI Model ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Cpu size={18} className="text-primary" />
                {editingModel ? "Edit AI Model Configuration" : "Add AI Model to Priority Chain"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModelForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider</Label>
                  <select
                    value={modelForm.provider}
                    onChange={(e) => setModelForm({ ...modelForm, provider: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="ollama">Ollama (Local)</option>
                    <option value="groq">Groq Cloud</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="grok">xAI Grok</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model Identifier</Label>
                  <Input
                    value={modelForm.model}
                    onChange={(e) => setModelForm({ ...modelForm, model: e.target.value })}
                    placeholder="e.g. llama-3.3-70b-versatile"
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={modelForm.display_name}
                  onChange={(e) => setModelForm({ ...modelForm, display_name: e.target.value })}
                  placeholder="e.g. Primary Fast Customer Model"
                  className="text-xs"
                />
              </div>

              {modelForm.provider !== "ollama" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key (Stored Encrypted AES-256)</Label>
                  <Input
                    type="password"
                    value={modelForm.apiKey}
                    onChange={(e) => setModelForm({ ...modelForm, apiKey: e.target.value })}
                    placeholder={editingModel ? "Leave empty to keep existing key" : "Enter API Key"}
                    className="text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Temperature ({modelForm.temperature})</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={modelForm.temperature}
                    onChange={(e) => setModelForm({ ...modelForm, temperature: parseFloat(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Output Tokens</Label>
                  <Input
                    type="number"
                    min="256"
                    max="8192"
                    value={modelForm.max_tokens}
                    onChange={(e) => setModelForm({ ...modelForm, max_tokens: parseInt(e.target.value, 10) || 2048 })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingModel ? "Save Changes" : "Add Model"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
