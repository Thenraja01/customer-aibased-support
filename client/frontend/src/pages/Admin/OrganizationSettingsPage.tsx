import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Save, Palette, Bot, Clock, Mail, Building2, FileText, BarChart3, Shield, Info, Database, Crown, Cpu, KeyRound, CreditCard, ScrollText, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import BrandingPanel from "@/components/admin/settings/BrandingPanel";
import ChatbotPanel from "@/components/admin/settings/ChatbotPanel";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const DEFAULT_GUARDRAILS = [
  "Answer only from approved documents",
  "Don't answer unrelated questions",
  "Always cite document sources",
  "Escalate to a ticket if confidence is low",
];

type Tab = "general" | "branding" | "subscription" | "storage" | "ai-config" | "chatbot" | "hours" | "email" | "api-keys" | "billing" | "activity-log" | "analytics" | "security" | "ticket-templates" | "charts";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "general", label: "General Info", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "subscription", label: "Subscription", icon: Crown },
  { id: "storage", label: "Storage", icon: Database },
  { id: "ai-config", label: "AI Config", icon: Cpu },
  { id: "chatbot", label: "Chatbot", icon: Bot },
  { id: "hours", label: "Working Hours", icon: Clock },
  { id: "email", label: "Email Templates", icon: Mail },
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "activity-log", label: "Activity Log", icon: ScrollText },
  { id: "analytics", label: "Analytics Suite", icon: LineChart },
  { id: "security", label: "Security", icon: Shield },
  { id: "ticket-templates", label: "Ticket Templates", icon: FileText },
  { id: "charts", label: "Chart Settings", icon: BarChart3 },
];

export default function OrganizationSettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("general");
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
          chart_colors: data.chart_colors || {
            primary: "#2563eb",
            secondary: "#7c3aed",
            tertiary: "#059669",
            quaternary: "#f59e0b",
            grid: "#e2e8f0",
            text: "#64748b",
            background: "#ffffff",
          },
          show_charts: data.show_charts !== undefined ? data.show_charts : true,
          ai_settings: data.ai_settings || {
            temperature: 0.7,
            top_k: 40,
            similarity_threshold: 0.75,
            max_tokens: 2048,
            response_style: "balanced",
          },
          guardrails: data.guardrails?.length
            ? data.guardrails
            : DEFAULT_GUARDRAILS.map((rule) => ({ rule, enabled: true })),
          working_hours: data.working_hours || {
            timezone: "UTC",
            ...Object.fromEntries(DAYS.map((d) => [d, { open: "09:00", close: "17:00", enabled: d === "saturday" || d === "sunday" ? false : true }])),
          },
          ai_session_logging: data.ai_session_logging !== undefined ? data.ai_session_logging : true,
          email_templates: data.email_templates || {
            ticket_assigned: { subject: "", body: "" },
            ticket_resolved: { subject: "", body: "" },
          },
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
        localStorage.setItem("orgSettings", JSON.stringify(res.data.data));
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization branding, AI behavior, and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex gap-1 border-b dark:border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
        {activeTab === "general" && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeTab === "branding" && (
          <BrandingPanel form={form} updateField={updateField} />
        )}

        {activeTab === "subscription" && (
          <SubscriptionPanel />
        )}

        {activeTab === "storage" && (
          <StoragePanel />
        )}

        {activeTab === "ai-config" && (
          <AIConfigPanel />
        )}

        {activeTab === "chatbot" && (
          <ChatbotPanel form={form} updateField={updateField} />
        )}

        {activeTab === "api-keys" && (
          <ApiKeysPanel />
        )}

        {activeTab === "billing" && (
          <BillingPanel />
        )}

        {activeTab === "activity-log" && (
          <ActivityLogPanel />
        )}

        {activeTab === "analytics" && (
          <AnalyticsPanel />
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeTab === "hours" && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail size={18} className="text-primary" />
                Email Templates
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize email notifications sent to users and agents.
              </p>
            </div>

            {(["ticket_assigned", "ticket_resolved"] as const).map((template) => (
              <div key={template} className="rounded-lg border dark:border-white/[0.06] p-4 space-y-3">
                <h4 className="text-sm font-semibold capitalize">
                  {template.replace("_", " ")}
                </h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subject</Label>
                  <Input
                    value={form.email_templates?.[template]?.subject || ""}
                    onChange={(e) => updateField(`email_templates.${template}.subject`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Body</Label>
                  <textarea
                    value={form.email_templates?.[template]?.body || ""}
                    onChange={(e) => updateField(`email_templates.${template}.body`, e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono dark:border-white/[0.06]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {'{{customer_name}}'}, {'{{agent_name}}'}, {'{{ticket_id}}'}, {'{{subject}}'}, {'{{priority}}'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "ticket-templates" && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeTab === "charts" && (
          <div className="space-y-6">
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
              <button
                onClick={() => updateField("show_charts", !form.show_charts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.show_charts ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.show_charts ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
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
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save size={16} className="mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function ChartPreview({ form }: { form: any }) {
  const colors = form.chart_colors || {};
  const sampleData = [
    { name: "Jan", tickets: 40, chats: 24 },
    { name: "Feb", tickets: 30, chats: 38 },
    { name: "Mar", tickets: 20, chats: 28 },
    { name: "Apr", tickets: 27, chats: 39 },
    { name: "May", tickets: 18, chats: 30 },
  ];
  const pieData = [
    { name: "Open", value: 35 },
    { name: "Resolved", value: 55 },
    { name: "Pending", value: 10 },
  ];

  return (
    <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 dark:bg-white/[0.03] border-b dark:border-white/[0.06]">
        <span className="text-xs font-medium text-muted-foreground">Chart Preview</span>
        {form.show_charts === false && (
          <span className="text-xs font-medium text-destructive">Charts are hidden</span>
        )}
      </div>
      {form.show_charts !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="rounded-lg border dark:border-white/[0.06] p-3">
            <p className="text-xs font-medium mb-2" style={{ color: colors.text || "#64748b" }}>Bar Chart</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sampleData}>
                <CartesianGrid stroke={colors.grid || "#e2e8f0"} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.text || "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: colors.text || "#64748b" }} />
                <Tooltip />
                <Bar dataKey="tickets" fill={colors.primary || "#2563eb"} radius={[4, 4, 0, 0]} />
                <Bar dataKey="chats" fill={colors.secondary || "#7c3aed"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border dark:border-white/[0.06] p-3">
            <p className="text-xs font-medium mb-2" style={{ color: colors.text || "#64748b" }}>Pie Chart</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {pieData.map((_, index) => {
                    const palette = [colors.primary || "#2563eb", colors.tertiary || "#059669", colors.quaternary || "#f59e0b"];
                    return <Cell key={index} fill={palette[index]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
