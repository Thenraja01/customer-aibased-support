import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2, Image, HardDrive, Bot, MessageSquare, Clock, Mail,
  Key, CreditCard, Activity, LineChart as LineChartIcon, ArrowLeft, Save, Plus,
  RefreshCw, Trash2, Copy, Check, Globe, Sparkles, CheckCircle2, Zap,
  UploadCloud, Link2, Palette, GitBranch, Search, FileText, Download, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  TenantHealthWidget, TenantProfitMarginWidget, TenantExpansionVelocityWidget
} from "@/components/admin/AdvancedDashboardCharts";
import AIConfigPanel from "@/components/admin/settings/AIConfigPanel";
import EmailTemplatesStudio from "@/components/admin/settings/EmailTemplatesStudio";
import TenantLoaderCustomizer from "@/components/branding/TenantLoaderCustomizer";

export default function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    | "general"
    | "branding"
    | "subscription"
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
  const [branches, setBranches] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [generalForm, setGeneralForm] = useState<any>({
    name: "",
    domain: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    default_branch_id: "",
    allowed_registration_roles: ["admin", "branch_admin", "support", "customer"],
  });

  const [brandingForm, setBrandingForm] = useState<any>({
    logoUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#7c3aed",
    accentColor: "#f59e0b",
  });

  const [loaderForm, setLoaderForm] = useState<any>({
    enabled: true,
    title: "",
    subtitle: "Build fast, ship faster",
    duration_ms: 2400,
    bg_theme: "dark",
  });

  const [planForm, setPlanForm] = useState<any>({
    plan: "free",
    custom_price: 0,
    custom_name: "",
    custom_storage_mb: 500,
    custom_ai_requests: 1000,
    features: "",
  });

  const [aiForm, setAiForm] = useState<any>({});
  const [chatbotForm, setChatbotForm] = useState<any>({});
  const [workingHoursForm, setWorkingHoursForm] = useState<any>({});

  // API Keys & Allowed Domains State
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"public" | "secret">("public");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);
  const [logoMode, setLogoMode] = useState<"upload" | "url">("upload");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Tenant Logs Filter State
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [fullRes, analyticsRes, branchRes] = await Promise.all([
        AdminAPI.getOrgFullDetails(id).catch(() => ({ data: { success: false, data: null } })),
        AdminAPI.getOrgAnalytics(id).catch(() => ({ data: { success: false, data: null } })),
        AdminAPI.getBranches({ organization_id: id }).catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (fullRes.data?.success && fullRes.data.data?.organization) {
        const org = fullRes.data.data.organization;
        setOrgData(org);
        setActivityLogs(fullRes.data.data.activityLogs || []);
        setInvoices(fullRes.data.data.invoices || []);

        setGeneralForm({
          name: org.name || "",
          domain: org.domain || "",
          email: org.email || "",
          phone: org.phone || "",
          address: org.address || "",
          status: org.status || "active",
          default_branch_id: org.default_branch_id?._id || org.default_branch_id || "",
          allowed_registration_roles: org.allowed_registration_roles && org.allowed_registration_roles.length > 0
            ? org.allowed_registration_roles
            : ["admin", "branch_admin", "support", "customer"],
        });

        setBrandingForm({
          logoUrl: org.logo?.url || (typeof org.logo === "string" ? org.logo : ""),
          primaryColor: org.brand_colors?.primary || "#2563eb",
          secondaryColor: org.brand_colors?.secondary || "#7c3aed",
          accentColor: org.brand_colors?.accent || "#f59e0b",
        });

        setLoaderForm({
          enabled: org.loader_config?.enabled ?? true,
          title: org.loader_config?.title || "",
          subtitle: org.loader_config?.subtitle || "Build fast, ship faster",
          duration_ms: org.loader_config?.duration_ms || 2400,
          bg_theme: org.loader_config?.bg_theme || "dark",
        });

        setPlanForm({
          plan: org.plan || "free",
          custom_price: org.plan_customization?.custom_price ?? (org.plan === "enterprise" ? 499 : org.plan === "business" ? 199 : org.plan === "starter" ? 49 : 0),
          custom_name: org.plan_customization?.custom_name || "",
          custom_storage_mb: org.plan_customization?.custom_storage_mb ?? Math.round((org.storage_limit || 524288000) / (1024 * 1024)),
          custom_ai_requests: org.plan_customization?.custom_ai_requests ?? (org.ai_requests_limit || 1000),
          features: Array.isArray(org.plan_customization?.features) ? org.plan_customization.features.join("\n") : "",
        });

        setAllowedDomains(Array.isArray(org.allowed_domains) ? org.allowed_domains : []);

        setAiForm({
          customPrompt: org.customPrompt || "",
          temperature: org.ai_settings?.temperature ?? 0.7,
          top_k: org.ai_settings?.top_k ?? 40,
          similarity_threshold: org.ai_settings?.similarity_threshold ?? 0.75,
          max_tokens: org.ai_settings?.max_tokens ?? 2048,
          response_style: org.ai_settings?.response_style || "balanced",
          provider: org.llm_config?.provider || "ollama",
          model_name: org.llm_config?.model_name || "llama3.2:3b",
          gemini_api_key: org.llm_config?.gemini_api_key || "",
          groq_api_key: org.llm_config?.groq_api_key || "",
          openai_api_key: org.llm_config?.openai_api_key || "",
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
          widget_position: org.widget_position || "right",
          widget_theme: org.widget_theme || "dark",
          widget_enabled: org.widget_enabled ?? true,
        });

        setWorkingHoursForm(org.working_hours || {});
      }

      if (branchRes.data?.success) {
        setBranches(branchRes.data.data || []);
      }

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to load organization details");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

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

  const handleSavePlanCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      plan: planForm.plan,
      storage_limit: Number(planForm.custom_storage_mb) * 1024 * 1024,
      ai_requests_limit: Number(planForm.custom_ai_requests),
      plan_customization: {
        custom_price: Number(planForm.custom_price),
        custom_name: planForm.custom_name.trim(),
        custom_storage_mb: Number(planForm.custom_storage_mb),
        custom_ai_requests: Number(planForm.custom_ai_requests),
        features: planForm.features
          .split("\n")
          .map((f: string) => f.trim())
          .filter(Boolean),
      },
    };
    await handleSaveSettings(payload);
  };

  const handleAddAllowedDomain = async () => {
    const clean = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!clean) return;
    if (allowedDomains.includes(clean)) {
      toast.error("Duplicate Domain", "This domain is already in the allowed list.");
      return;
    }
    const updated = [...allowedDomains, clean];
    setAllowedDomains(updated);
    setNewDomainInput("");
    await handleSaveSettings({ allowed_domains: updated });
  };

  const handleRemoveAllowedDomain = async (dom: string) => {
    const updated = allowedDomains.filter((d) => d !== dom);
    setAllowedDomains(updated);
    await handleSaveSettings({ allowed_domains: updated });
  };

  const handleLogoFileUpload = async (file: File) => {
    if (!id || !file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", "Please select a valid image file (PNG, JPG, SVG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File Too Large", "Maximum allowed image size is 5MB.");
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await AdminAPI.uploadOrgLogo(id, file);
      if (res.data?.success && res.data.data?.logoUrl) {
        const newUrl = res.data.data.logoUrl;
        setBrandingForm((prev: any) => ({ ...prev, logoUrl: newUrl }));
        toast.success("Logo Uploaded", "Organization logo image uploaded and applied successfully.");
        loadData();
      }
    } catch (err: any) {
      toast.error("Upload Failed", err?.response?.data?.message || "Failed to upload logo image.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!id || !newKeyName.trim()) return;
    try {
      setSaving(true);
      const res = await AdminAPI.createOrgApiKey(id, newKeyName.trim(), newKeyType);
      if (res.data?.success) {
        toast.success("Success", "New API key generated successfully. Copy it now!");
        setRevealedKey(res.data.data.key);
        setNewKeyName("");
        loadData();
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to generate API key");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = async (keyText: string) => {
    try {
      await navigator.clipboard.writeText(keyText);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success("Copied", "API key copied to clipboard");
    } catch {
      toast.error("Error", "Copy failed");
    }
  };

  const handleRevokeApiKey = async () => {
    if (!id || !revokeTarget) return;
    const keyId = revokeTarget._id || revokeTarget.key;
    try {
      setSaving(true);
      const res = await AdminAPI.revokeOrgApiKey(id, keyId);
      if (res.data?.success) {
        toast.success("Success", "API key revoked successfully.");
        setRevokeTarget(null);
        loadData();
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to revoke API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const url = AdminAPI.downloadInvoiceUrl(invoiceId);
    window.open(url, "_blank");
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

  // Filtered tenant activity logs
  const filteredLogs = activityLogs.filter((log) => {
    const matchSearch =
      !logSearch ||
      log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.user_id?.name?.toLowerCase().includes(logSearch.toLowerCase());
    const matchAction = logActionFilter === "ALL" || log.action === logActionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/organizations")} className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
          {orgData?.logo?.url && (
            <img
              src={orgData.logo.url}
              alt={orgData.name}
              className="h-10 w-10 object-contain rounded-lg border bg-background p-1 shadow-sm"
            />
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{orgData?.name || "Organization"}</h1>
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                {orgData?.plan || "Free"} Plan
              </Badge>
              <Badge
                className={`text-[10px] font-bold ${
                  orgData?.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                {orgData?.status?.toUpperCase() || "ACTIVE"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              ID: {orgData?.organization_id || orgData?._id} · Domain: {orgData?.domain || "custom-domain.com"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-2">
        {[
          { id: "general", label: "General & Branches", icon: Building2 },
          { id: "branding", label: "Branding & Loader", icon: Image },
          { id: "subscription", label: "Plan Customization", icon: CreditCard },
          { id: "ai_config", label: "AI Config", icon: Bot },
          { id: "chatbot", label: "Chatbot Widget", icon: MessageSquare },
          { id: "working_hours", label: "Working Hours", icon: Clock },
          { id: "email_templates", label: "Email Templates", icon: Mail },
          { id: "api_keys", label: "API & Integrations", icon: Key },
          { id: "billing", label: "Invoices", icon: FileText },
          { id: "activity", label: "Tenant Audit Logs", icon: Activity },
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

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL & BRANCHES + OPERATIONAL USE CASES DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Tenant Operational Use Cases Dashboard */}
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                  <Sparkles size={18} className="text-primary" /> Tenant Operational Use Cases Overview
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live deployment topology and active multi-tenant feature utilization for {orgData?.name}.
                </p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-mono">
                Multi-Branch SaaS Active
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Bot size={12} className="text-primary" /> AI Assistant
                </span>
                <p className="text-sm font-bold">{orgData?.chatbot_name || "Support AI"}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">Active & Ingesting</p>
              </div>

              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <GitBranch size={12} className="text-primary" /> Total Branches
                </span>
                <p className="text-sm font-bold">{branches.length} Assigned</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Default: {branches.find((b) => b._id === generalForm.default_branch_id)?.name || "Headquarters"}
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Globe size={12} className="text-primary" /> Embed Origins
                </span>
                <p className="text-sm font-bold">{allowedDomains.length} Whitelisted</p>
                <p className="text-[10px] text-muted-foreground">CORS Protected</p>
              </div>

              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <HardDrive size={12} className="text-primary" /> Storage Used
                </span>
                <p className="text-sm font-bold">
                  {(Number(orgData?.storage_used || 0) / (1024 * 1024)).toFixed(1)} MB
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Limit: {Math.round((orgData?.storage_limit || 524288000) / (1024 * 1024))} MB
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Zap size={12} className="text-primary" /> AI Quota
                </span>
                <p className="text-sm font-bold">{orgData?.ai_requests_month || 0} req</p>
                <p className="text-[10px] text-muted-foreground">
                  Limit: {orgData?.ai_requests_limit || 1000} / mo
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-card/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Key size={12} className="text-primary" /> API Keys
                </span>
                <p className="text-sm font-bold">{orgData?.api_keys?.length || 0} Keys</p>
                <p className="text-[10px] text-emerald-500 font-semibold">Active Rest & Embed</p>
              </div>
            </div>
          </div>

          {/* General Information Form */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="text-primary" size={18} /> Organization Information & Default Branch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Organization Name</label>
                <Input
                  value={generalForm.name}
                  onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Domain</label>
                <Input
                  value={generalForm.domain}
                  onChange={(e) => setGeneralForm({ ...generalForm, domain: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Primary Contact Email</label>
                <Input
                  value={generalForm.email}
                  onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                <Input
                  value={generalForm.phone}
                  onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Default Branch Selection */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <GitBranch size={13} className="text-primary" /> Default Branch (Primary Dispatch Location)
                </label>
                <select
                  value={generalForm.default_branch_id}
                  onChange={(e) => setGeneralForm({ ...generalForm, default_branch_id: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border bg-background text-sm font-medium"
                >
                  <option value="">-- No Specific Default (First Available) --</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.code ? `(${b.code})` : ""} {b.is_default ? "★ Default" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Customer tickets without branch tags are automatically routed to this default branch.
                </p>
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

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
                <Input
                  value={generalForm.address}
                  onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Allowed Self-Registration Roles */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> Allowed Self-Registration Roles
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure which user roles are available on the public registration page for this organization.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setGeneralForm({
                        ...generalForm,
                        allowed_registration_roles: ["admin", "branch_admin", "support", "customer"],
                      })
                    }
                    className="text-[11px] h-7 px-2"
                  >
                    Select All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: "admin", label: "Admin", desc: "Organization Administrator", badge: "Org Admin" },
                  { id: "branch_admin", label: "Branch Admin", desc: "Branch Manager & Staff", badge: "Branch" },
                  { id: "support", label: "Support", desc: "Support Agent / Operator", badge: "Agent" },
                  { id: "customer", label: "Customer", desc: "Portal End User", badge: "Customer" },
                ].map((r) => {
                  const currentRoles = generalForm.allowed_registration_roles || [];
                  const isChecked = currentRoles.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary bg-primary/[0.04] shadow-xs"
                          : "border-border hover:bg-muted/50 opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked
                            ? currentRoles.filter((item: string) => item !== r.id)
                            : [...currentRoles, r.id];
                          setGeneralForm({ ...generalForm, allowed_registration_roles: updated });
                        }}
                        className="mt-0.5 rounded border-muted-foreground text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground">{r.label}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                            {r.badge}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button onClick={() => handleSaveSettings(generalForm)} disabled={saving} className="gap-2">
                <Save size={14} /> {saving ? "Saving..." : "Save General Info & Branch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BRANDING & ANIMATED LOADER */}
      {/* ========================================================================= */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="text-primary" size={18} /> Organization Branding & Visual Identity
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize your organization logo image or URL, brand color palette, and visual identity.
                </p>
              </div>
              <Button
                onClick={() =>
                  handleSaveSettings({
                    logo: { url: brandingForm.logoUrl },
                    brand_colors: {
                      primary: brandingForm.primaryColor,
                      secondary: brandingForm.secondaryColor,
                      accent: brandingForm.accentColor,
                    },
                    loader_config: loaderForm,
                  })
                }
                disabled={saving}
                size="sm"
              >
                <Save size={14} className="mr-1.5" /> Save Branding & Loader
              </Button>
            </div>

            <div className="space-y-6">
              {/* Logo Section */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Image size={16} className="text-primary" /> Organization Logo
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload an image file directly or paste an external image URL.
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setLogoMode("upload")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        logoMode === "upload"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <UploadCloud size={13} /> Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode("url")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        logoMode === "url"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Link2 size={13} /> Image URL
                    </button>
                  </div>
                </div>

                {logoMode === "upload" ? (
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors">
                    <div className="h-20 w-20 rounded-xl border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                      {brandingForm.logoUrl ? (
                        <img src={brandingForm.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                      ) : (
                        <Image size={28} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <p className="text-xs font-semibold text-foreground">Upload Organization Logo</p>
                      <p className="text-[11px] text-muted-foreground">PNG, JPG, SVG, WEBP up to 5MB.</p>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer hover:bg-muted transition-colors">
                        <UploadCloud size={13} className="text-primary" />
                        {uploadingLogo ? "Uploading..." : "Browse File..."}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoFileUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Direct Image URL</label>
                    <Input
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                )}
              </div>

              {/* Colors Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="h-9 w-9 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Secondary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="h-9 w-9 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Accent Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.accentColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                      className="h-9 w-9 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={brandingForm.accentColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TenantLoaderCustomizer
            config={loaderForm}
            onChange={setLoaderForm}
            brandColor={brandingForm.primaryColor}
            secondaryColor={brandingForm.secondaryColor}
            orgName={orgData?.name}
          />
        </div>
      )}
     {activeTab === "subscription" && (
        <form onSubmit={handleSavePlanCustomization} className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="text-primary" size={18} /> Tenant Plan Customization & Quota Overrides
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Override pricing tiers, monthly AI token allowances, and storage limits specifically for this tenant.
              </p>
            </div>
            <Button type="submit" disabled={saving} size="sm" className="gap-1.5">
              <Save size={14} /> {saving ? "Saving..." : "Save Custom Plan Limits"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Assigned Plan Tier</label>
              <select
                value={planForm.plan}
                onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                className="w-full p-2.5 rounded-lg border bg-background text-sm font-semibold capitalize"
              >
                <option value="free">Free Tier ($0/mo)</option>
                <option value="starter">Starter Tier ($49/mo)</option>
                <option value="business">Business Tier ($199/mo)</option>
                <option value="enterprise">Enterprise Tier ($499/mo)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Custom Monthly Price ($ USD)</label>
              <Input
                type="number"
                min={0}
                value={planForm.custom_price}
                onChange={(e) => setPlanForm({ ...planForm, custom_price: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Custom Tier Alias / Label</label>
              <Input
                value={planForm.custom_name}
                onChange={(e) => setPlanForm({ ...planForm, custom_name: e.target.value })}
                placeholder="e.g. VIP Enterprise Scale"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly AI Requests Quota</label>
              <Input
                type="number"
                min={100}
                value={planForm.custom_ai_requests}
                onChange={(e) => setPlanForm({ ...planForm, custom_ai_requests: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-muted-foreground">Tokens / AI chat queries allowed per monthly cycle.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Storage Limit (MB)</label>
              <Input
                type="number"
                min={50}
                value={planForm.custom_storage_mb}
                onChange={(e) => setPlanForm({ ...planForm, custom_storage_mb: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-muted-foreground">Maximum total file & document storage bytes.</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Custom Entitlement Features (One per line)
            </label>
            <Textarea
              rows={4}
              value={planForm.features}
              onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
              placeholder="Dedicated Vector Database Cluster&#10;Custom LLM Fine-Tuning&#10;24/7 SLA Priority Routing"
            />
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === "ai_config" && (
        <AIConfigPanel
          initialConfig={aiForm}
          onSave={async (newAiConfig) => {
            const payload = {
              customPrompt: newAiConfig.customPrompt,
              ai_settings: {
                temperature: newAiConfig.temperature,
                top_k: newAiConfig.top_k,
                similarity_threshold: newAiConfig.similarity_threshold,
                max_tokens: newAiConfig.max_tokens,
                response_style: newAiConfig.response_style,
                system_prompt: newAiConfig.customPrompt,
              },
              llm_config: {
                provider: newAiConfig.provider,
                model_name: newAiConfig.model_name,
                gemini_api_key: newAiConfig.gemini_api_key,
                groq_api_key: newAiConfig.groq_api_key,
                openai_api_key: newAiConfig.openai_api_key,
              },
              rag_config: {
                chunk_size: newAiConfig.chunk_size,
                chunk_overlap: newAiConfig.chunk_overlap,
                bfs_max_depth: newAiConfig.bfs_max_depth,
                bfs_max_nodes: newAiConfig.bfs_max_nodes,
                top_k: newAiConfig.rag_top_k,
                query_cache_ttl_ms: newAiConfig.query_cache_ttl_ms,
              },
            };
            await handleSaveSettings(payload);
          }}
          isSuperAdmin={true}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CHATBOT WIDGET */}
      {/* ========================================================================= */}
      {activeTab === "chatbot" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="text-primary" size={18} /> Chatbot & Embedded Widget Settings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure the customer-facing AI widget name, default greeting message, theme, and placement.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSettings(chatbotForm)}
              disabled={saving}
              size="sm"
            >
              <Save size={14} className="mr-1.5" /> Save Chatbot Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Bot Display Name</label>
              <Input
                value={chatbotForm.chatbot_name}
                onChange={(e) => setChatbotForm({ ...chatbotForm, chatbot_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Default Language</label>
              <select
                value={chatbotForm.default_language}
                onChange={(e) => setChatbotForm({ ...chatbotForm, default_language: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Widget Placement</label>
              <select
                value={chatbotForm.widget_position}
                onChange={(e) => setChatbotForm({ ...chatbotForm, widget_position: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
              >
                <option value="right">Bottom Right Corner</option>
                <option value="left">Bottom Left Corner</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Widget Theme</label>
              <select
                value={chatbotForm.widget_theme}
                onChange={(e) => setChatbotForm({ ...chatbotForm, widget_theme: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="custom">Brand Custom</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Greeting Message</label>
              <Textarea
                rows={3}
                value={chatbotForm.greeting_message}
                onChange={(e) => setChatbotForm({ ...chatbotForm, greeting_message: e.target.value })}
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: WORKING HOURS */}
      {/* ========================================================================= */}
      {activeTab === "working_hours" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-primary" size={18} /> Support Operating Hours
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set active live support hours for SLA calculations and bot offline auto-responders.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSettings({ working_hours: workingHoursForm })}
              disabled={saving}
              size="sm"
            >
              <Save size={14} className="mr-1.5" /> Save Operating Hours
            </Button>
          </div>

          <div className="space-y-3">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
              const config = workingHoursForm[day] || { enabled: day !== "saturday" && day !== "sunday", open: "09:00", close: "17:00" };
              return (
                <div key={day} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <span className="font-semibold text-xs capitalize w-28">{day}</span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) =>
                          setWorkingHoursForm({
                            ...workingHoursForm,
                            [day]: { ...config, enabled: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      Open
                    </label>
                    <Input
                      type="time"
                      value={config.open || "09:00"}
                      disabled={!config.enabled}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          [day]: { ...config, open: e.target.value },
                        })
                      }
                      className="h-8 w-28 text-xs font-mono"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={config.close || "17:00"}
                      disabled={!config.enabled}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          [day]: { ...config, close: e.target.value },
                        })
                      }
                      className="h-8 w-28 text-xs font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: EMAIL TEMPLATES (FULLY BRANDED WITH LOGO & NAME) */}
      {/* ========================================================================= */}
      {activeTab === "email_templates" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail className="text-primary" size={18} /> Branded Email Templates Studio
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize lifecycle email notifications for {orgData?.name || "this organization"} with automatic logo and name branding.
            </p>
          </div>

          <EmailTemplatesStudio
            organizationId={id}
            orgName={orgData?.name || "SupportAI Tenant"}
            logoUrl={brandingForm.logoUrl}
            brandColors={{
              primary: brandingForm.primaryColor,
              secondary: brandingForm.secondaryColor,
            }}
            initialTemplates={orgData?.email_templates}
            onSave={async (templates) => {
              await handleSaveSettings({ email_templates: templates });
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: API KEYS & ALLOWED DOMAINS WHITELIST */}
      {/* ========================================================================= */}
      {activeTab === "api_keys" && (
        <div className="space-y-6">
          {/* Allowed Integration Domains Whitelist */}
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe className="text-primary" size={18} /> Allowed Integration Domains (CORS Security)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Specify web domains and origins where this tenant is authorized to embed the AI widget and invoke API keys.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder="e.g. app.mycompany.com, localhost:3000, shopify-store.com"
                className="text-xs font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAllowedDomain();
                  }
                }}
              />
              <Button onClick={handleAddAllowedDomain} disabled={saving} size="sm" className="gap-1.5 shrink-0">
                <Plus size={14} /> Add Domain
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Active Whitelisted Domains ({allowedDomains.length})
              </label>
              {allowedDomains.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-xs text-muted-foreground text-center">
                  No specific domains restricted. (Widget accepts requests from any origin by default).
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allowedDomains.map((dom) => (
                    <div
                      key={dom}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/40 font-mono text-xs font-semibold"
                    >
                      <Globe size={13} className="text-primary" />
                      <span>{dom}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllowedDomain(dom)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Remove domain"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API Keys Table & Generation */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Key className="text-primary" size={18} /> Organization API Keys
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate public and secret credentials for widget embeds, webhook dispatch, and SDK integrations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Website Widget)"
                  className="h-8 text-xs w-48"
                />
                <select
                  value={newKeyType}
                  onChange={(e) => setNewKeyType(e.target.value as any)}
                  className="h-8 rounded-lg border bg-background text-xs px-2"
                >
                  <option value="public">Public (pk_)</option>
                  <option value="secret">Secret (sk_)</option>
                </select>
                <Button size="sm" onClick={handleCreateApiKey} disabled={saving || !newKeyName.trim()} className="gap-1.5 h-8 text-xs">
                  <Plus size={13} /> Generate Key
                </Button>
              </div>
            </div>

            {/* Revealed Key Banner */}
            {revealedKey && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> New API Key Generated - Copy Now
                  </span>
                  <button
                    onClick={() => handleCopyKey(revealedKey)}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    {copiedKey ? <Check size={13} /> : <Copy size={13} />} {copiedKey ? "Copied" : "Copy Key"}
                  </button>
                </div>
                <p className="font-mono text-xs p-2 rounded bg-background border select-all break-all text-foreground">
                  {revealedKey}
                </p>
              </div>
            )}

            {/* Existing Keys Table */}
            <div className="divide-y border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 font-semibold text-xs text-muted-foreground flex items-center justify-between">
                <span>Key Details & Identifier</span>
                <span>Status & Actions</span>
              </div>

              {orgData?.api_keys && orgData.api_keys.length > 0 ? (
                orgData.api_keys.map((k: any) => (
                  <div key={k._id || k.key} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{k.name}</p>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {k.key?.startsWith("pk_") || k.type === "public" ? "Public" : "Secret"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs text-muted-foreground truncate select-all">{k.key}</p>
                        <button
                          onClick={() => handleCopyKey(k.key)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copy Key"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used ? ` • Last used ${new Date(k.last_used).toLocaleString()}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={k.is_active ? "bg-emerald-500" : "bg-rose-500"}>
                        {k.is_active ? "Active" : "Revoked"}
                      </Badge>
                      {k.is_active && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => setRevokeTarget(k)}
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
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No active API keys found for this organization. Generate one above to enable the embedded widget or REST API.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: BILLING & INVOICES */}
      {/* ========================================================================= */}
      {activeTab === "billing" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-primary" size={18} /> Tenant Invoices & Receipts
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download generated invoice receipts for this specific tenant organization.
              </p>
            </div>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground grid grid-cols-6 gap-2">
              <span className="col-span-2">Invoice #</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Date</span>
              <span className="text-right">Download</span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No invoices recorded for this tenant.
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv._id} className="p-4 grid grid-cols-6 gap-2 items-center text-xs hover:bg-muted/20 transition-colors">
                  <span className="col-span-2 font-mono font-bold text-foreground truncate">{inv.invoice_number}</span>
                  <span className="capitalize font-semibold text-muted-foreground">{inv.plan}</span>
                  <span className="font-bold text-foreground">${Number(inv.amount_usd || 0).toFixed(2)}</span>
                  <span className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</span>
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(inv._id)}
                      className="h-8 gap-1.5 text-xs text-primary"
                    >
                      <Download size={13} /> PDF
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: SPECIFIC TENANT AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === "activity" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="text-primary" size={18} /> Tenant Audit & Activity Logs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit trail of administrative actions, user changes, and API events for {orgData?.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                <Input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter events..."
                  className="pl-8 h-8 text-xs w-48 font-mono"
                />
              </div>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="h-8 rounded-lg border bg-background text-xs px-2"
              >
                <option value="ALL">All Actions</option>
                <option value="USER_CREATED">User Created</option>
                <option value="SETTINGS_UPDATED">Settings Updated</option>
                <option value="KEY_GENERATED">Key Generated</option>
                <option value="AUTH_LOGIN">Login</option>
              </select>
            </div>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 font-semibold text-xs text-muted-foreground flex items-center justify-between">
              <span>Event & Actor</span>
              <span>Timestamp & Details</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No activity logs found for this tenant matching your search criteria.
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={log._id || i} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {log.action || "EVENT"}
                      </Badge>
                      <span className="font-semibold text-xs text-foreground">
                        {log.user_id?.name || log.user_name || "System Actor"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.details || log.description || "Action recorded"}</p>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "Recently"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: ANALYTICS SUITE */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TenantHealthWidget data={analytics?.health} />
            <TenantProfitMarginWidget data={analytics?.margin} />
            <TenantExpansionVelocityWidget data={analytics?.expansion} />
          </div>
        </div>
      )}

      {/* Revoke API Key Confirmation Dialog */}
      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke Organization API Key"
        message={`Are you sure you want to permanently revoke key "${revokeTarget?.name}"? Any active widgets using this key will immediately fail.`}
        confirmLabel="Revoke Key"
        variant="danger"
        onConfirm={handleRevokeApiKey}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
