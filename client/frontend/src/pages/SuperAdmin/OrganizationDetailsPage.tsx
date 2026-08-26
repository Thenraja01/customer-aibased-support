import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2, Image, Shield, HardDrive, Bot, MessageSquare, Clock, Mail,
  Key, CreditCard, Activity, LineChart as LineChartIcon, ArrowLeft, Save, Plus,
  RefreshCw, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import {
  HistogramWidget, AreaChartWidget, WaterfallChartWidget
} from "@/components/admin/AdvancedDashboardCharts";

export default function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    | "general"
    | "branding"
    | "subscription"
    | "storage"
    | "ai_config"
    | "chatbot"
    | "working_hours"
    | "email_templates"
    | "api_keys"
    | "billing"
    | "activity"
    | "analytics"
  >("general");

  const [orgData, setOrgData] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Form states
  const [generalForm, setGeneralForm] = useState<any>({});
  const [brandingForm, setBrandingForm] = useState<any>({});
  const [aiForm, setAiForm] = useState<any>({});
  const [chatbotForm, setChatbotForm] = useState<any>({});
  const [workingHoursForm, setWorkingHoursForm] = useState<any>({});
  const [emailForm, setEmailForm] = useState<any>({});
  const [newKeyName, setNewKeyName] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [fullRes, analyticsRes] = await Promise.all([
        AdminAPI.getOrgFullDetails(id),
        AdminAPI.getOrgAnalytics(id),
      ]);

      if (fullRes.data?.success) {
        const org = fullRes.data.data.organization;
        setOrgData(org);
        setActivityLogs(fullRes.data.data.activityLogs || []);

        setGeneralForm({
          name: org.name || "",
          domain: org.domain || "",
          email: org.email || "",
          phone: org.phone || "",
          address: org.address || "",
          status: org.status || "active",
        });

        setBrandingForm({
          logoUrl: org.logo?.url || "",
          primaryColor: org.brand_colors?.primary || "#2563eb",
          secondaryColor: org.brand_colors?.secondary || "#7c3aed",
          accentColor: org.brand_colors?.accent || "#f59e0b",
        });

        setAiForm({
          customPrompt: org.customPrompt || "",
          temperature: org.ai_settings?.temperature ?? 0.7,
          top_k: org.ai_settings?.top_k ?? 40,
          similarity_threshold: org.ai_settings?.similarity_threshold ?? 0.75,
          max_tokens: org.ai_settings?.max_tokens ?? 2048,
          response_style: org.ai_settings?.response_style || "balanced",
          // LLM Config
          provider: org.llm_config?.provider || "ollama",
          model_name: org.llm_config?.model_name || "llama3.2:3b",
          gemini_api_key: org.llm_config?.gemini_api_key || "",
          groq_api_key: org.llm_config?.groq_api_key || "",
          openai_api_key: org.llm_config?.openai_api_key || "",
          // RAG Config
          chunk_size: org.rag_config?.chunk_size ?? 500,
          chunk_overlap: org.rag_config?.chunk_overlap ?? 100,
          bfs_max_depth: org.rag_config?.bfs_max_depth ?? 2,
          bfs_max_nodes: org.rag_config?.bfs_max_nodes ?? 30,
          rag_top_k: org.rag_config?.top_k ?? 5,
          query_cache_ttl_ms: org.rag_config?.query_cache_ttl_ms ?? 600000,
        });

        setChatbotForm({
          chatbot_name: org.chatbot_name || "Support AI",
          default_language: org.default_language || "en",
          greeting_message: org.greeting_message || "Hello! How can I help you today?",
        });

        setWorkingHoursForm(org.working_hours || {});
        setEmailForm(org.email_templates || {});
      }

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to load organization details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (partialData: any) => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await AdminAPI.updateOrganization(id, partialData);
      if (res.data?.success) {
        toast.success("Success", "Organization settings updated successfully.");
        loadData();
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!id || !newKeyName) return;
    try {
      setSaving(true);
      const res = await AdminAPI.createOrgApiKey(id, newKeyName);
      if (res.data?.success) {
        toast.success("Success", "New API key generated successfully.");
        setNewKeyName("");
        loadData();
      }
    } catch (err: any) {
      toast.error("Error", "Failed to generate API key");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!id || !keyId) return;
    try {
      setSaving(true);
      const res = await AdminAPI.revokeOrgApiKey(id, keyId);
      if (res.data?.success) {
        toast.success("Success", "API key revoked successfully.");
        loadData();
      }
    } catch (err: any) {
      toast.error("Error", "Failed to revoke API key");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !orgData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Organization Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/organizations")} title="Back to organizations">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{orgData?.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">{orgData?.organization_id}</Badge>
              <Badge className={orgData?.status === "active" ? "bg-emerald-500" : "bg-rose-500"}>
                {orgData?.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Domain: {orgData?.domain || "N/A"} • Plan: <span className="uppercase font-semibold text-primary">{orgData?.plan}</span> • Created: {new Date(orgData?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw size={14} className="mr-1.5" /> Refresh
          </Button>
        </div>
      </div>


      {/* Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b pb-2 dark:border-white/[0.06]">
        {[
          { id: "general", label: "General Info", icon: Building2 },
          { id: "branding", label: "Branding", icon: Image },
          { id: "ai_config", label: "AI Config", icon: Bot },
          { id: "chatbot", label: "Chatbot", icon: MessageSquare },
          { id: "working_hours", label: "Working Hours", icon: Clock },
          { id: "email_templates", label: "Email Templates", icon: Mail },
          { id: "api_keys", label: "API Keys", icon: Key },
          { id: "billing", label: "Billing", icon: CreditCard },
          { id: "activity", label: "Activity Log", icon: Activity },
          { id: "analytics", label: "Analytics Suite", icon: LineChartIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Information */}
      {activeTab === "general" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="text-primary" size={18} /> General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Organization Name</label>
              <Input value={generalForm.name} onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Domain</label>
              <Input value={generalForm.domain} onChange={(e) => setGeneralForm({ ...generalForm, domain: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Primary Contact Email</label>
              <Input value={generalForm.email} onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
              <Input value={generalForm.phone} onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })} className="mt-1" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
              <Input value={generalForm.address} onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
              <select
                value={generalForm.status}
                onChange={(e) => setGeneralForm({ ...generalForm, status: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSaveSettings(generalForm)} disabled={saving}>
              <Save size={14} className="mr-1.5" /> {saving ? "Saving..." : "Save General Info"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Branding */}
      {activeTab === "branding" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Image className="text-primary" size={18} /> Branding Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Logo URL</label>
              <Input value={brandingForm.logoUrl} onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" className="mt-1" />
              {brandingForm.logoUrl && (
                <div className="mt-2 p-2 border rounded bg-muted/20 w-fit">
                  <img src={brandingForm.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Primary Brand Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} className="font-mono text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Secondary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} className="font-mono text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Accent Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                handleSaveSettings({
                  logo: { url: brandingForm.logoUrl },
                  brand_colors: {
                    primary: brandingForm.primaryColor,
                    secondary: brandingForm.secondaryColor,
                    accent: brandingForm.accentColor,
                  },
                })
              }
              disabled={saving}
            >
              <Save size={14} className="mr-1.5" /> Save Branding
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Subscription Plan */}
      {activeTab === "subscription" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="text-primary" size={18} /> Subscription Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Active Plan</label>
              <select
                value={orgData?.plan || "free"}
                onChange={(e) => handleSaveSettings({ plan: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border bg-background text-sm font-semibold text-primary"
              >
                <option value="free">Free ($0/mo)</option>
                <option value="starter">Starter ($49/mo)</option>
                <option value="business">Business ($199/mo)</option>
                <option value="enterprise">Enterprise ($499/mo)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Subscription Expiry</label>
              <Input
                type="date"
                value={orgData?.subscription_end ? new Date(orgData.subscription_end).toISOString().split("T")[0] : ""}
                onChange={(e) => handleSaveSettings({ subscription_end: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Storage Usage */}
      {activeTab === "storage" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HardDrive className="text-primary" size={18} /> Storage Usage
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Storage Used:</span>
                <span className="font-mono font-bold">
                  {Math.round((orgData?.storage_used || 0) / 1024 / 1024)} MB / {Math.round((orgData?.storage_limit || 524288000) / 1024 / 1024)} MB
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((orgData?.storage_used || 0) / (orgData?.storage_limit || 524288000)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Configuration */}
      {activeTab === "ai_config" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bot className="text-primary" size={18} /> AI & RAG Configuration
          </h2>

          <div className="space-y-6">
            {/* System Prompt & Basic Parameters */}
            <div className="space-y-4 border-b pb-6 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-foreground">General Prompt Settings</h3>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Custom System Prompt</label>
                <Textarea
                  value={aiForm.customPrompt}
                  onChange={(e) => setAiForm({ ...aiForm, customPrompt: e.target.value })}
                  rows={3}
                  placeholder="Enter custom instructions for RAG LLM response generation..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Temperature ({aiForm.temperature})</label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={aiForm.temperature}
                    onChange={(e) => setAiForm({ ...aiForm, temperature: parseFloat(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Similarity Threshold ({aiForm.similarity_threshold})</label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.01"
                    value={aiForm.similarity_threshold}
                    onChange={(e) => setAiForm({ ...aiForm, similarity_threshold: parseFloat(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Response Style</label>
                  <select
                    value={aiForm.response_style}
                    onChange={(e) => setAiForm({ ...aiForm, response_style: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LLM Provider Integration Section */}
            <div className="space-y-4 border-b pb-6 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-foreground">LLM Model & Provider Integration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">AI Provider</label>
                  <select
                    value={aiForm.provider}
                    onChange={(e) => setAiForm({ ...aiForm, provider: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border bg-background text-sm font-medium"
                  >
                    <option value="ollama">Ollama (Local / Open Source)</option>
                    <option value="gemini">Google Gemini AI</option>
                    <option value="groq">Groq Cloud (Qwen/Llama)</option>
                    <option value="openai">OpenAI (GPT-4 / GPT-3.5)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Model Name</label>
                  <Input
                    value={aiForm.model_name}
                    onChange={(e) => setAiForm({ ...aiForm, model_name: e.target.value })}
                    placeholder="e.g. llama3.2:3b, gemini-1.5-flash, qwen/qwen3.6-27b"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Gemini API Key</label>
                  <Input
                    type="password"
                    value={aiForm.gemini_api_key}
                    onChange={(e) => setAiForm({ ...aiForm, gemini_api_key: e.target.value })}
                    placeholder="AIzaSy..."
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Groq API Key</label>
                  <Input
                    type="password"
                    value={aiForm.groq_api_key}
                    onChange={(e) => setAiForm({ ...aiForm, groq_api_key: e.target.value })}
                    placeholder="gsk_..."
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">OpenAI API Key</label>
                  <Input
                    type="password"
                    value={aiForm.openai_api_key}
                    onChange={(e) => setAiForm({ ...aiForm, openai_api_key: e.target.value })}
                    placeholder="sk-..."
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* RAG Chunk & Retrieval Tuning Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">RAG Chunking & Vector Retrieval Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Chunk Size (chars)</label>
                  <Input
                    type="number"
                    value={aiForm.chunk_size}
                    onChange={(e) => setAiForm({ ...aiForm, chunk_size: parseInt(e.target.value) || 500 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Chunk Overlap (chars)</label>
                  <Input
                    type="number"
                    value={aiForm.chunk_overlap}
                    onChange={(e) => setAiForm({ ...aiForm, chunk_overlap: parseInt(e.target.value) || 100 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Top-K Chunks Returned</label>
                  <Input
                    type="number"
                    value={aiForm.rag_top_k}
                    onChange={(e) => setAiForm({ ...aiForm, rag_top_k: parseInt(e.target.value) || 5 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Graph BFS Max Depth</label>
                  <Input
                    type="number"
                    value={aiForm.bfs_max_depth}
                    onChange={(e) => setAiForm({ ...aiForm, bfs_max_depth: parseInt(e.target.value) || 2 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Graph BFS Max Nodes</label>
                  <Input
                    type="number"
                    value={aiForm.bfs_max_nodes}
                    onChange={(e) => setAiForm({ ...aiForm, bfs_max_nodes: parseInt(e.target.value) || 30 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Query Cache TTL (ms)</label>
                  <Input
                    type="number"
                    value={aiForm.query_cache_ttl_ms}
                    onChange={(e) => setAiForm({ ...aiForm, query_cache_ttl_ms: parseInt(e.target.value) || 600000 })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() =>
                  handleSaveSettings({
                    customPrompt: aiForm.customPrompt,
                    ai_settings: {
                      temperature: aiForm.temperature,
                      top_k: aiForm.top_k,
                      similarity_threshold: aiForm.similarity_threshold,
                      max_tokens: aiForm.max_tokens,
                      response_style: aiForm.response_style,
                    },
                    llm_config: {
                      provider: aiForm.provider,
                      model_name: aiForm.model_name,
                      gemini_api_key: aiForm.gemini_api_key,
                      groq_api_key: aiForm.groq_api_key,
                      openai_api_key: aiForm.openai_api_key,
                    },
                    rag_config: {
                      chunk_size: aiForm.chunk_size,
                      chunk_overlap: aiForm.chunk_overlap,
                      bfs_max_depth: aiForm.bfs_max_depth,
                      bfs_max_nodes: aiForm.bfs_max_nodes,
                      top_k: aiForm.rag_top_k,
                      query_cache_ttl_ms: aiForm.query_cache_ttl_ms,
                    },
                  })
                }
                disabled={saving}
              >
                <Save size={14} className="mr-1.5" /> Save AI & RAG Configuration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Chatbot Configuration */}
      {activeTab === "chatbot" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="text-primary" size={18} /> Chatbot Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Chatbot Display Name</label>
              <Input value={chatbotForm.chatbot_name} onChange={(e) => setChatbotForm({ ...chatbotForm, chatbot_name: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Default Language</label>
              <Input value={chatbotForm.default_language} onChange={(e) => setChatbotForm({ ...chatbotForm, default_language: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Greeting Message</label>
              <Textarea value={chatbotForm.greeting_message} onChange={(e) => setChatbotForm({ ...chatbotForm, greeting_message: e.target.value })} rows={3} className="mt-1" />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings(chatbotForm)} disabled={saving}>
                <Save size={14} className="mr-1.5" /> Save Chatbot Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Working Hours */}
      {activeTab === "working_hours" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="text-primary" size={18} /> Working Hours Schedule
          </h2>
          <div className="space-y-3">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
              const dayConfig = workingHoursForm[day] || { open: "09:00", close: "17:00", enabled: true };
              return (
                <div key={day} className="flex items-center justify-between p-3">
                  <span className="capitalize font-semibold text-sm w-24">{day}</span>
                  <div className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={dayConfig.open || "09:00"}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          [day]: { ...dayConfig, open: e.target.value },
                        })
                      }
                      className="w-32 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={dayConfig.close || "17:00"}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          [day]: { ...dayConfig, close: e.target.value },
                        })
                      }
                      className="w-32 text-xs"
                    />
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={dayConfig.enabled !== false}
                        onChange={(e) =>
                          setWorkingHoursForm({
                            ...workingHoursForm,
                            [day]: { ...dayConfig, enabled: e.target.checked },
                          })
                        }
                      />
                      Open
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSaveSettings({ working_hours: workingHoursForm })} disabled={saving}>
              <Save size={14} className="mr-1.5" /> Save Working Hours
            </Button>
          </div>
        </div>
      )}

      {/* Tab 8: Email Templates */}
      {activeTab === "email_templates" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Mail className="text-primary" size={18} /> Email Notifications & Templates
          </h2>
          <div className="space-y-4">
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-sm">Ticket Assigned Template</h3>
              <Input
                value={emailForm.ticket_assigned?.subject || ""}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    ticket_assigned: { ...emailForm.ticket_assigned, subject: e.target.value },
                  })
                }
                placeholder="Subject Line"
              />
              <Textarea
                value={emailForm.ticket_assigned?.body || ""}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    ticket_assigned: { ...emailForm.ticket_assigned, body: e.target.value },
                  })
                }
                rows={3}
              />
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-sm">Ticket Resolved Template</h3>
              <Input
                value={emailForm.ticket_resolved?.subject || ""}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    ticket_resolved: { ...emailForm.ticket_resolved, subject: e.target.value },
                  })
                }
                placeholder="Subject Line"
              />
              <Textarea
                value={emailForm.ticket_resolved?.body || ""}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    ticket_resolved: { ...emailForm.ticket_resolved, body: e.target.value },
                  })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings({ email_templates: emailForm })} disabled={saving}>
                <Save size={14} className="mr-1.5" /> Save Email Templates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: API Keys */}
      {activeTab === "api_keys" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Key className="text-primary" size={18} /> Active API Keys
            </h2>
            <div className="flex items-center gap-2">
              <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key Name (e.g. Mobile App)" className="w-48 text-xs" />
              <Button size="sm" onClick={handleCreateApiKey} disabled={!newKeyName}>
                <Plus size={14} className="mr-1" /> Generate Key
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {orgData?.api_keys && orgData.api_keys.length > 0 ? (
              orgData.api_keys.map((k: any) => (
                <div key={k._id || k.key} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{k.name}</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">{k.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={k.is_active ? "default" : "destructive"} className="shrink-0">
                      {k.is_active ? "Active" : "Revoked"}
                    </Badge>
                    {k.is_active && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => handleRevokeApiKey(k._id || k.key)}
                        disabled={saving}
                        title="Revoke API Key"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No active API keys found.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 10: Billing Information */}
      {activeTab === "billing" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="text-primary" size={18} /> Billing & Invoices
          </h2>
          <div className="p-4 bg-muted/20 space-y-2">
            <p className="text-sm font-semibold">Active Plan: <span className="uppercase text-primary">{orgData?.plan}</span></p>
            <p className="text-xs text-muted-foreground">Payment Status: <span className="text-emerald-600 font-bold">Up to date (Good Standing)</span></p>
          </div>
        </div>
      )}

      {/* Tab 11: Activity Log */}
      {activeTab === "activity" && (
        <div className="rounded-lg border bg-card p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-primary" size={18} /> Tenant Audit Logs
          </h2>
          <div className="divide-y dark:divide-white/[0.04]">
            {activityLogs.length > 0 ? (
              activityLogs.map((log: any) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-xs text-muted-foreground">By: {log.user_id?.name || "System"}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-6">No audit records for this organization.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 12: Analytics Suite (3 Purpose-Driven Charts) */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LineChartIcon className="text-primary" size={22} />
              Organization Key Performance Analytics (Top 3 Purpose-Driven Charts)
            </h2>
            <Badge variant="outline" className="text-xs">Recharts Analytics</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Chart 1: Revenue Waterfall Bridge (Purpose: Financial MRR Flow) */}
            <WaterfallChartWidget title="1. Revenue MRR Waterfall Bridge" data={analytics.revenueAnalytics?.waterfall} />

            {/* Chart 2: User Retention Histogram (Purpose: Engagement Distribution) */}
            <HistogramWidget title="2. User Retention Interval Bins" data={analytics.userAnalytics?.histogram} />

            {/* Chart 3: AI Session Volume Area Chart (Purpose: Usage Trajectory) */}
            <AreaChartWidget title="3. AI Session Volume Trajectory" data={analytics.aiPerformance?.area} dataKey="sessions" />
          </div>
        </div>
      )}
    </div>
  );
}
