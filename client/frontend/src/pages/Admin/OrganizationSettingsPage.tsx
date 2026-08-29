import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { Save, Bot, Clock, Mail, Building2, FileText, BarChart3, Shield, Info, Database, Crown, Cpu, KeyRound, CreditCard, ScrollText, LineChart, Brain, Server, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import TicketTemplatesManager from "@/components/admin/TicketTemplatesManager";
import AIConfigPanel from "@/components/admin/settings/AIConfigPanel";
import BillingPanel from "@/components/admin/settings/BillingPanel";
import AnalyticsPanel from "@/components/admin/settings/AnalyticsPanel";
import ActivityLogPanel from "@/components/admin/settings/ActivityLogPanel";
import ApiKeysPanel from "@/components/admin/settings/ApiKeysPanel";
import SubscriptionPanel from "@/components/admin/settings/SubscriptionPanel";
import StoragePanel from "@/components/admin/settings/StoragePanel";
import ChatbotPanel from "@/components/admin/settings/ChatbotPanel";
import RagSettingsPanel from "@/components/admin/settings/RagSettingsPanel";
import SmtpSettingsPanel from "@/components/admin/settings/SmtpSettingsPanel";
import SlaAutoClosePanel from "@/components/admin/settings/SlaAutoClosePanel";
import EmailTemplatesStudio from "@/components/admin/settings/EmailTemplatesStudio";
import { safeSetItem, STORAGE_KEYS, sanitizeOrgSettingsForStorage } from "@/utils/localStorage";

import AxiosInstance from "@/api/axiosInstance";

function ChartPreview({ form }: { form: any }) {
  const [chartData, setChartData] = useState<{ name: string; val: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await AxiosInstance.get("/admin/v1/analytics/overview");
        if (res.data?.success && Array.isArray(res.data.data?.series) && isMounted) {
          const series = res.data.data.series.slice(-7).map((s: any) => ({
            name: s.date ? String(s.date).slice(5) : "Day",
            val: Number(s.tickets || s.chats || s.calls || 0),
          }));
          if (series.length > 0) {
            setChartData(series);
          }
        }
      } catch (err) {
        console.error("Failed to load chart preview data from backend", err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="h-40 w-full bg-card p-4 rounded-xl border border-border">
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Loading backend analytics preview...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Bar dataKey="val" fill={form.chart_colors?.primary || "#6366f1"} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

import {
  DEFAULT_RAG_CONFIG,
  DEFAULT_SMTP_CONFIG,
  DEFAULT_AI_SETTINGS,
  DEFAULT_WORKING_HOURS,
  DEFAULT_GUARDRAILS
} from "@/constants/defaults";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

import TenantLoaderCustomizer from "@/components/branding/TenantLoaderCustomizer";

type Tab = "general" | "branding" | "subscription" | "storage" | "ai-config" | "chatbot" | "rag" | "smtp" | "hours" | "email" | "api-keys" | "billing" | "activity-log" | "analytics" | "security" | "ticket-templates" | "sla-autoclose";

const TAB_GROUPS = [
  {
    label: "General",
    tabs: [
      { id: "general", label: "General Info", icon: Building2 },
      { id: "branding", label: "Branding & Loader", icon: Sparkles },
      { id: "hours", label: "Working Hours", icon: Clock },
      { id: "sla-autoclose", label: "SLA & Auto-Close", icon: Clock },
      { id: "security", label: "Security", icon: Shield },
    ],
  },
  {
    label: "AI & Integrations",
    tabs: [
      { id: "ai-config", label: "AI Config", icon: Cpu },
      { id: "chatbot", label: "Chatbot", icon: Bot },
      { id: "rag", label: "RAG Settings", icon: Brain },
      { id: "smtp", label: "SMTP", icon: Server },
    ],
  },
  {
    label: "Templates & Notifications",
    tabs: [
      { id: "email", label: "Email Templates", icon: Mail },
      { id: "ticket-templates", label: "Ticket Templates", icon: FileText },
    ],
  },
  {
    label: "Management",
    tabs: [
      { id: "subscription", label: "Subscription", icon: Crown },
      { id: "storage", label: "Storage", icon: Database },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "api-keys", label: "API Keys", icon: KeyRound },
    ],
  },
  {
    label: "Analytics & Logs",
    tabs: [
      { id: "analytics", label: "Analytics", icon: LineChart },
      { id: "activity-log", label: "Activity Log", icon: ScrollText },
    ],
  },
];


export default function OrganizationSettingsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTabState] = useState<Tab>(() => {
    if (tabParam) return tabParam;
    return "general";
  });

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (tabParam) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setOrgSettings } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await AdminAPI.getOrgSettings();
      if (res.data.success) {
        const data = res.data.data;
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          domain: data.domain || "",
          customPrompt: data.customPrompt || "",
          chatbot_name: data.chatbot_name || "Support AI",
          default_language: data.default_language || "en",
          greeting_message: data.greeting_message || "",
          logo: data.logo || { url: "", public_id: "" },
          brand_colors: data.brand_colors || { primary: "#2563eb", secondary: "#7c3aed", accent: "#f59e0b" },
          loader_config: data.loader_config || {
            enabled: true,
            title: "",
            subtitle: "Build fast, ship faster",
            duration_ms: 2400,
            bg_theme: "dark",
          },
          ai_settings: data.ai_settings || DEFAULT_AI_SETTINGS,
          llm_config: data.llm_config || {},
          guardrails: data.guardrails?.length
            ? data.guardrails
            : DEFAULT_GUARDRAILS,
          working_hours: data.working_hours || DEFAULT_WORKING_HOURS,
          ai_session_logging: data.ai_session_logging !== undefined ? data.ai_session_logging : true,
          email_templates: data.email_templates || {
            ticket_assigned: { subject: "", body: "" },
            ticket_resolved: { subject: "", body: "" },
          },
          rag_config: data.rag_config || DEFAULT_RAG_CONFIG,
          smtp_config: data.smtp_config || DEFAULT_SMTP_CONFIG,
          sla_settings: data.sla_settings || {},
          auto_close_settings: data.auto_close_settings || { enabled: true, closing_period_hours: 48 },
        });
      }
    } catch (err) {
      toast.error("Error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await AdminAPI.updateOrgSettings(form);
      if (res.data.success) {
        toast.success("Success", "Settings saved successfully");
        safeSetItem(STORAGE_KEYS.ORG_SETTINGS, sanitizeOrgSettingsForStorage(res.data.data));
        setOrgSettings(res.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [form, setOrgSettings]);

  const updateField = (path: string, value: any) => {
    setForm((prev: any) => {
      const keys = path.split(".");
      const newForm = { ...prev };
      let obj: any = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage branding, AI behavior, integrations, and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save size={15} className="mr-1.5" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Vertical sidebar layout */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
        orientation="vertical"
        className="flex flex-col md:flex-row gap-6 items-start"
      >
        {/* ── Left nav sidebar ── */}
        <div className="w-full md:w-60 shrink-0 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl dark:bg-card/40 dark:border-white/[0.08] p-3 sticky top-4 shadow-sm">
          <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 gap-1 rounded-none">
            {TAB_GROUPS.map((group) => (
              <div key={group.label} className="mb-2 last:mb-0">
                {/* Group label */}
                <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
                  {group.label}
                </p>
                <div className="space-y-0.5 mt-0.5">
                  {group.tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="
                        w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-xl
                        font-medium text-muted-foreground
                        hover:text-foreground hover:bg-muted/60
                        data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold
                        data-[state=active]:shadow-sm
                        transition-all duration-150 justify-start h-auto border-0 outline-none
                      "
                    >
                      <tab.icon size={16} className="shrink-0 transition-transform duration-150 group-hover:scale-110" />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </div>
              </div>
            ))}
          </TabsList>
        </div>

        {/* ── Right content area ── */}
        <div className="flex-1 min-w-0 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <TabsContent value="general" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                General Information
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Organization name, contact details, and domain.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Domain / Subdomain</Label>
                <Input value={form.domain} onChange={(e) => updateField("domain", e.target.value)} placeholder="e.g. acme" />
                <p className="text-xs text-muted-foreground">Used to identify this organization from its subdomain (e.g. acme.yourdomain.com).</p>
              </div>
            </div>
          </TabsContent>

          {/* Branding & Animated Loader */}
          <TabsContent value="branding" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Branding & Splash Loader
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize brand colors, organization logo, and the 3D animated entrance loader.
              </p>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_colors?.primary || "#2563eb"}
                    onChange={(e) => updateField("brand_colors.primary", e.target.value)}
                    className="h-9 w-9 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={form.brand_colors?.primary || "#2563eb"}
                    onChange={(e) => updateField("brand_colors.primary", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Secondary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_colors?.secondary || "#7c3aed"}
                    onChange={(e) => updateField("brand_colors.secondary", e.target.value)}
                    className="h-9 w-9 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={form.brand_colors?.secondary || "#7c3aed"}
                    onChange={(e) => updateField("brand_colors.secondary", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Accent Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_colors?.accent || "#f59e0b"}
                    onChange={(e) => updateField("brand_colors.accent", e.target.value)}
                    className="h-9 w-9 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={form.brand_colors?.accent || "#f59e0b"}
                    onChange={(e) => updateField("brand_colors.accent", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tenant Animated Splash Loader Studio */}
            <TenantLoaderCustomizer
              config={
                form.loader_config || {
                  enabled: true,
                  title: "",
                  subtitle: "Build fast, ship faster",
                  duration_ms: 2400,
                  bg_theme: "dark",
                }
              }
              onChange={(newCfg) => updateField("loader_config", newCfg)}
              brandColor={form.brand_colors?.primary || "#2563eb"}
              secondaryColor={form.brand_colors?.secondary || "#7c3aed"}
              orgName={form.name}
            />
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="mt-0">
            <SubscriptionPanel />
          </TabsContent>

          {/* Storage */}
          <TabsContent value="storage" className="mt-0">
            <StoragePanel />
          </TabsContent>

          {/* AI Config */}
          <TabsContent value="ai-config" className="mt-0">
            <AIConfigPanel
              initialConfig={{
                customPrompt: form.customPrompt || "",
                provider: form.llm_config?.provider || "gemini",
                model_name: form.llm_config?.model_name || form.llm_config?.model || "gemini-2.5-flash",
                gemini_api_key: form.llm_config?.gemini_api_key || "",
                groq_api_key: form.llm_config?.groq_api_key || "",
                openai_api_key: form.llm_config?.openai_api_key || "",
                temperature: form.ai_settings?.temperature ?? form.llm_config?.temperature ?? 0.7,
                max_tokens: form.ai_settings?.max_tokens ?? form.llm_config?.max_tokens ?? 2048,
                top_k: form.ai_settings?.top_k ?? 40,
                similarity_threshold: form.ai_settings?.similarity_threshold ?? 0.75,
                response_style: form.ai_settings?.response_style || "balanced",
                chunk_size: form.rag_config?.chunk_size ?? 500,
                chunk_overlap: form.rag_config?.chunk_overlap ?? 100,
                rag_top_k: form.rag_config?.top_k ?? 5,
                bfs_max_depth: form.rag_config?.bfs_max_depth ?? 2,
                bfs_max_nodes: form.rag_config?.bfs_max_nodes ?? 30,
                query_cache_ttl_ms: form.rag_config?.query_cache_ttl_ms ?? 600000,
              }}
              onSave={async (newAiConfig: any) => {
                const updatedPayload = {
                  ...form,
                  customPrompt: newAiConfig.customPrompt,
                  ai_settings: {
                    ...(form.ai_settings || {}),
                    temperature: newAiConfig.temperature,
                    top_k: newAiConfig.top_k,
                    similarity_threshold: newAiConfig.similarity_threshold,
                    max_tokens: newAiConfig.max_tokens,
                    response_style: newAiConfig.response_style,
                    system_prompt: newAiConfig.customPrompt,
                  },
                  llm_config: {
                    ...(form.llm_config || {}),
                    provider: newAiConfig.provider,
                    model_name: newAiConfig.model_name,
                    model: newAiConfig.model_name,
                    gemini_api_key: newAiConfig.gemini_api_key,
                    groq_api_key: newAiConfig.groq_api_key,
                    openai_api_key: newAiConfig.openai_api_key,
                    temperature: newAiConfig.temperature,
                    max_tokens: newAiConfig.max_tokens,
                  },
                  rag_config: {
                    ...(form.rag_config || {}),
                    chunk_size: newAiConfig.chunk_size,
                    chunk_overlap: newAiConfig.chunk_overlap,
                    top_k: newAiConfig.rag_top_k,
                    bfs_max_depth: newAiConfig.bfs_max_depth,
                    bfs_max_nodes: newAiConfig.bfs_max_nodes,
                    query_cache_ttl_ms: newAiConfig.query_cache_ttl_ms,
                  },
                };
                setForm(updatedPayload);
                const res = await AdminAPI.updateOrgSettings(updatedPayload);
                if (res.data?.success) {
                  toast.success("Success", "AI & LLM Configuration saved successfully");
                  safeSetItem(STORAGE_KEYS.ORG_SETTINGS, sanitizeOrgSettingsForStorage(res.data.data));
                  setOrgSettings(res.data.data);
                }
              }}
            />
          </TabsContent>

          {/* RAG Settings */}
          <TabsContent value="rag" className="mt-0">
            <RagSettingsPanel form={form} updateField={updateField} />
          </TabsContent>

          {/* SMTP */}
          <TabsContent value="smtp" className="mt-0">
            <SmtpSettingsPanel form={form} updateField={updateField} />
          </TabsContent>

          {/* Chatbot */}
          <TabsContent value="chatbot" className="mt-0">
            <ChatbotPanel form={form} updateField={updateField} />
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api-keys" className="mt-0">
            <ApiKeysPanel />
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="mt-0">
            <BillingPanel />
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity-log" className="mt-0">
            <ActivityLogPanel />
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsPanel />
          </TabsContent>


          {/* Security */}
          <TabsContent value="security" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Security
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage security and compliance settings for your organization.
              </p>
            </div>

            <div className="rounded-xl border dark:border-white/[0.06] p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    <p className="text-sm font-semibold">AI Session Logging</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Record AI conversations, prompts, responses, and usage
                    for auditing, analytics, and troubleshooting.
                  </p>
                </div>
                <Switch
                  checked={form.ai_session_logging}
                  onCheckedChange={(checked) => updateField("ai_session_logging", checked)}
                  aria-label="Toggle AI session logging"
                />
              </div>

              {form.ai_session_logging ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Info size={14} />
                    When Enabled
                  </div>
                  <p className="text-xs text-muted-foreground">Log information such as:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                    {[
                      "User ID", "Organization ID", "Session ID", "Prompt",
                      "AI response", "Timestamp", "Model used", "Response time",
                      "Token usage", "Feedback", "Errors",
                    ].map((label) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                        {label}
                      </div>
                    ))}
                  </div>
                  <pre className="rounded-lg bg-background dark:bg-black/20 p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto border dark:border-white/[0.06]">
                    {`{
  "userId": "123",
  "organizationId": "456",
  "sessionId": "abc123",
  "prompt": "How do I reset my password?",
  "response": "You can reset your password by...",
  "model": "gpt-5.5",
  "tokens": 842,
  "responseTime": 1250,
  "createdAt": "2026-07-29T09:15:00Z"
}`}
                  </pre>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Info size={14} />
                    When Disabled
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prompts and responses will not be saved. Minimal operational data
                    such as request ID, timestamp, success/failure, and response time
                    may still be logged for monitoring.
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3 border dark:border-white/[0.06]">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">⚠️ Compliance notice:</span> When enabled, prompts and AI responses are securely stored and visible to administrators with the appropriate permissions. Disable this if your organization does not want conversation content retained.
                </p>
              </div>
            </div>
          </TabsContent>


          {/* Working Hours */}
          <TabsContent value="hours" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Working Hours
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set business hours for support availability.
              </p>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <Label>Timezone</Label>
              <select
                value={form.working_hours?.timezone || "UTC"}
                onChange={(e) => updateField("working_hours.timezone", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
              >
                {["UTC", "US/Eastern", "US/Central", "US/Mountain", "US/Pacific", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney"].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {DAYS.map((day) => {
                const wh = form.working_hours?.[day] || { open: "09:00", close: "17:00", enabled: true };
                return (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-lg border dark:border-white/[0.06]">
                    <div className="w-28">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={wh.enabled}
                        onChange={(e) => updateField(`working_hours.${day}.enabled`, e.target.checked)}
                      />
                      Open
                    </label>
                    {wh.enabled && (
                      <>
                        <input
                          type="time"
                          value={wh.open || "09:00"}
                          onChange={(e) => updateField(`working_hours.${day}.open`, e.target.value)}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm dark:border-white/[0.06]"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={wh.close || "17:00"}
                          onChange={(e) => updateField(`working_hours.${day}.close`, e.target.value)}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm dark:border-white/[0.06]"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Email Templates */}
          <TabsContent value="email" className="mt-0 space-y-6">
            <EmailTemplatesStudio
              initialTemplates={form.email_templates}
              brandColors={form.brand_colors}
              logoUrl={form.logo?.url}
              orgName={form.name}
              onSave={(newTemplates) => {
                updateField("email_templates", newTemplates);
                return handleSave();
              }}
            />
          </TabsContent>

          {/* Ticket Templates */}
          <TabsContent value="ticket-templates" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Ticket Templates
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Preconfigured templates that customers can choose from when creating a ticket.
              </p>
            </div>
            <TicketTemplatesManager />
          </TabsContent>

          {/* SLA & Auto-Close Settings */}
          <TabsContent value="sla-autoclose" className="mt-0">
            <SlaAutoClosePanel form={form} updateField={updateField} />
          </TabsContent>

          {/* Chart Settings */}
          <TabsContent value="charts" className="mt-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                Chart Settings
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize chart colors and visibility for analytics dashboards.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium">Show Charts</p>
                <p className="text-xs text-muted-foreground">Toggle visibility of all analytics charts across the dashboard.</p>
              </div>
              <Switch
                checked={form.show_charts ?? true}
                onCheckedChange={(v) => updateField("show_charts", v)}
                aria-label="Toggle chart visibility"
              />
            </div>

            <div className="border-t dark:border-white/[0.06] pt-6">
              <h4 className="text-sm font-semibold mb-4">Chart Color Palette</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: "primary", label: "Primary Series" },
                  { key: "secondary", label: "Secondary Series" },
                  { key: "tertiary", label: "Tertiary Series" },
                  { key: "quaternary", label: "Quaternary Series" },
                  { key: "grid", label: "Grid Lines" },
                  { key: "text", label: "Axis Text" },
                  { key: "background", label: "Chart Background" },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.chart_colors?.[key] || "#000000"}
                      onChange={(e) => updateField(`chart_colors.${key}`, e.target.value)}
                      className="w-10 h-10 rounded-md border cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        value={form.chart_colors?.[key] || ""}
                        onChange={(e) => updateField(`chart_colors.${key}`, e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-white/[0.06] pt-6">
              <h4 className="text-sm font-semibold mb-3">Preview</h4>
              <ChartPreview form={form} />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end pb-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save size={15} className="mr-1.5" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
