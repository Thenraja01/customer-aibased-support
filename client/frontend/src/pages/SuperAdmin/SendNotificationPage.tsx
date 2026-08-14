import { useState, useEffect, useMemo } from "react";
import { 
  Send, Bell, AlertTriangle, Info, CheckCircle, AlertCircle, 
  Smartphone, Mail, MessageSquare, Laptop, Radio, Search, 
  Users, Sliders, History,
  Plus, Calendar
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { NotificationAPI } from "@/api/notification.api.js";
import { AdminAPI } from "@/api";
import BranchAPI from "@/api/branch.api.js";

const types = [
  { value: "info", label: "Info", icon: Info, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "success", label: "Success", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { value: "error", label: "Error", icon: AlertCircle, color: "text-red-400 bg-red-500/10 border-red-500/20" },
] as const;

const DELIVERY_METHODS = [
  { id: "in_app", label: "In-App Notification", icon: Bell, desc: "Deliver to in-app bell notification hub" },
  { id: "email", label: "Email Broadcast", icon: Mail, desc: "Send an email alert to recipients" },
  { id: "push", label: "Push Notification", icon: Smartphone, desc: "Trigger mobile or desktop push banner" },
  { id: "sms", label: "SMS Text", icon: MessageSquare, desc: "Send SMS message directly to mobile numbers" },
  { id: "system", label: "System Announcement", icon: Laptop, desc: "Display a persistent modal on next login" },
];

const STATIC_TEMPLATES = [
  { id: "maint", name: "🔧 System Maintenance", title: "Upcoming System Maintenance", message: "The platform will undergo scheduled maintenance on Sunday from 2:00 AM to 4:00 AM UTC.", type: "warning" as const, ctaText: "View Schedule", ctaUrl: "https://example.com/maintenance" },
  { id: "feat", name: "✨ New Feature Announcement", title: "New Feature Available", message: "You can now secure your account with Two-Factor Authentication. Enable it in your profile settings.", type: "success" as const, ctaText: "Enable 2FA", ctaUrl: "/profile" },
  { id: "sec", name: "🔒 Security Alert", title: "Security Alert: Update Password", message: "We recommend periodically updating your account password to maintain maximum security.", type: "error" as const, ctaText: "Update Now", ctaUrl: "/profile" },
];

export default function SendNotificationPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"send" | "history">("send");

  // Form Fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  // Audience Configuration
  const [audienceType, setAudienceType] = useState<"all" | "branch" | "role" | "branch_role">("role");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedBranchForRole, setSelectedBranchForRole] = useState<string>("");
  const [selectedRoleForBranch, setSelectedRoleForBranch] = useState<string>("");

  // Delivery Method Toggles
  const [activeDeliveryMethods, setActiveDeliveryMethods] = useState<string[]>(["in_app"]);

  // DB resources
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  
  // Recipient Count (Fetched from Server)
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [calculatingCount, setCalculatingCount] = useState(false);

  // Pagination & Campaign History
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignPagination, setCampaignPagination] = useState<any>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search queries & states
  const [branchSearch, setBranchSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // Fetch initial branches & roles & templates
  useEffect(() => {
    const initData = async () => {
      try {
        const [branchesRes, rolesRes, templatesRes] = await Promise.allSettled([
          BranchAPI.getAll({ limit: 1000 }),
          AdminAPI.getRoles(),
          NotificationAPI.getTemplates(),
        ]);

        if (branchesRes.status === "fulfilled" && branchesRes.value.data?.success) {
          setBranches(branchesRes.value.data.data || []);
        } else {
          setBranches([
            { _id: "b1", name: "Headquarters (HQ)" },
            { _id: "b2", name: "Downtown Branch" },
            { _id: "b3", name: "West Side Branch" },
          ]);
        }

        if (rolesRes.status === "fulfilled" && rolesRes.value.data?.success) {
          setRoles(rolesRes.value.data.data || []);
        } else {
          setRoles([
            { _id: "r1", name: "Admin", role_name: "admin" },
            { _id: "r2", name: "Support Staff", role_name: "support" },
            { _id: "r3", name: "Customer", role_name: "customer" },
          ]);
        }

        if (templatesRes.status === "fulfilled" && templatesRes.value.data?.success) {
          setDbTemplates(templatesRes.value.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load select parameters", err);
      }
    };
    initData();
  }, []);

  // Fetch campaign history when history tab is active
  useEffect(() => {
    if (activeTab !== "history") return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await NotificationAPI.getCampaigns({ page: historyPage, limit: 8 });
        if (res.data?.success) {
          setCampaigns(res.data.items || []);
          setCampaignPagination(res.data.pagination);
        }
      } catch (err) {
        toast.error("Error", "Failed to load notification campaign history");
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [activeTab, historyPage]);

  // Secure Server-side preview calculation (never trust client)
  useEffect(() => {
    const resolveCount = async () => {
      setCalculatingCount(true);
      try {
        const res = await NotificationAPI.getPreviewCount({
          audienceType,
          branchIds: audienceType === "branch" ? selectedBranches : (audienceType === "branch_role" && selectedBranchForRole ? [selectedBranchForRole] : []),
          roleIds: audienceType === "role" ? selectedRoles : (audienceType === "branch_role" && selectedRoleForBranch ? [selectedRoleForBranch] : []),
        });
        if (res.data?.success) {
          setRecipientCount(res.data.count ?? 0);
        }
      } catch (err) {
        setRecipientCount(0);
      } finally {
        setCalculatingCount(false);
      }
    };

    const delay = setTimeout(resolveCount, 300);
    return () => clearTimeout(delay);
  }, [audienceType, selectedBranches, selectedRoles, selectedBranchForRole, selectedRoleForBranch]);

  // Combined Templates List
  const allTemplatesList = useMemo(() => {
    return [
      ...STATIC_TEMPLATES.map(t => ({ ...t, isDb: false })),
      ...dbTemplates.map(t => ({ id: t._id, name: `📁 ${t.name}`, title: t.title, message: t.message, type: t.type, ctaText: t.cta_text, ctaUrl: t.cta_url, isDb: true }))
    ];
  }, [dbTemplates]);

  // Load Template action
  const handleSelectTemplate = (templateId: string) => {
    const found = allTemplatesList.find(t => t.id === templateId);
    if (!found) return;
    setTitle(found.title);
    setMessage(found.message);
    setType(found.type as any);
    setCtaText(found.ctaText || "");
    setCtaUrl(found.ctaUrl || "");
  };

  // Create Template action
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Validation", "Please specify a template name");
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await NotificationAPI.createTemplate({
        name: templateName,
        title,
        message,
        type,
        cta_text: ctaText,
        cta_url: ctaUrl,
      });
      if (res.data?.success) {
        toast.success("Template Saved", `"${templateName}" is now available in your templates list.`);
        setDbTemplates(prev => [res.data.data, ...prev]);
        setTemplateName("");
        setShowSaveTemplateModal(false);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };



  const handleToggleBranch = (id: string) => {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((item) => item !== roleName) : [...prev, roleName]
    );
  };

  const handleToggleDeliveryMethod = (id: string) => {
    setActiveDeliveryMethods((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter lists
  const filteredBranchesList = useMemo(() => {
    return branches.filter((b) => b.name.toLowerCase().includes(branchSearch.toLowerCase()));
  }, [branches, branchSearch]);

  const filteredRolesList = useMemo(() => {
    return roles.filter((r) => (r.name || r.role_name).toLowerCase().includes(roleSearch.toLowerCase()));
  }, [roles, roleSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Validation", "Title and message are required");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title,
        message,
        type,
        link: ctaUrl || "",
        audienceType,
        branchIds: audienceType === "branch" ? selectedBranches : (audienceType === "branch_role" && selectedBranchForRole ? [selectedBranchForRole] : []),
        roleIds: audienceType === "role" ? selectedRoles : (audienceType === "branch_role" && selectedRoleForBranch ? [selectedRoleForBranch] : []),
        deliveryMethods: activeDeliveryMethods,
        ctaText,
        ctaUrl,
      };

      const res = await NotificationAPI.broadcastToOrg(payload);
      if (res.data?.success) {
        toast.success("Sent Successfully", `Notification broadcasted to ${recipientCount} recipients.`);
        
        // Reset form fields
        setTitle("");
        setMessage("");
        setType("info");
        setCtaText("");
        setCtaUrl("");
        setSelectedBranches([]);
        setSelectedRoles([]);
        setSelectedBranchForRole("");
        setSelectedRoleForBranch("");
      }
    } catch (err: any) {
      toast.error("Failed", err.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      
      {/* Tab Header Selector */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("send")}
            className={`text-sm font-semibold pb-3 border-b-2 px-1 transition-all ${
              activeTab === "send"
                ? "border-orange-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            New Broadcast
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`text-sm font-semibold pb-3 border-b-2 px-1 transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-orange-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={14} />
            Campaigns History
          </button>
        </div>
      </div>

      {activeTab === "send" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Configuration side */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header / Template Selector */}
            <div className="flex items-center justify-between gap-4 bg-card/40 p-4 border border-border/40 rounded-xl">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase ">Choose Template</h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  defaultValue=""
                  className="appearance-none h-8 px-3 pr-8 rounded-lg border border-border bg-card text-xs font-medium text-foreground outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 cursor-pointer min-w-[180px]"
                >
                  <option value="">Load from list...</option>
                  {allTemplatesList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={!title.trim() || !message.trim()}
                  className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <Plus size={12} />
                  Save
                </button>
              </div>
            </div>

            {/* Target selector */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Audience */}
              <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase  text-muted-foreground flex items-center gap-1.5">
                  <Users size={14} className="text-orange-500" />
                  Target Audience
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: "all", label: "All Users" },
                    { id: "branch", label: "Branches" },
                    { id: "role", label: "Roles" },
                    { id: "branch_role", label: "Branch & Role" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAudienceType(opt.id as any)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-center flex flex-col justify-center items-center gap-0.5 min-h-[50px] ${
                        audienceType === opt.id
                          ? "border-orange-500/50 bg-orange-500/5 text-orange-400 font-semibold"
                          : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Sub selectors */}
                {audienceType === "all" && (
                  <div className="p-3 bg-muted/30 rounded-lg text-xs border border-border/40 text-muted-foreground">
                    Sends to all active staff and customer accounts within your organization.
                  </div>
                )}

                {audienceType === "branch" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="Search branches..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="max-h-[120px] overflow-y-auto border border-border/40 rounded-lg p-2 bg-background/30 space-y-1 sidebar-scrollbar">
                      {filteredBranchesList.map((b) => (
                        <label key={b._id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(b._id)}
                            onChange={() => handleToggleBranch(b._id)}
                            className="rounded border-border text-orange-500 focus:ring-orange-500/20"
                          />
                          <span className="truncate">{b.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {audienceType === "role" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="Search roles..."
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="max-h-[120px] overflow-y-auto border border-border/40 rounded-lg p-2 bg-background/30 space-y-1 sidebar-scrollbar">
                      {filteredRolesList.map((r) => {
                        const rName = r.role_name || r.name || "";
                        return (
                          <label key={r._id || rName} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(rName)}
                              onChange={() => handleToggleRole(rName)}
                              className="rounded border-border text-orange-500 focus:ring-orange-500/20"
                            />
                            <span className="capitalize">{rName.replace("_", " ")}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {audienceType === "branch_role" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Branch</label>
                      <select
                        value={selectedBranchForRole}
                        onChange={(e) => setSelectedBranchForRole(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border bg-background text-xs focus:outline-none"
                      >
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Role</label>
                      <select
                        value={selectedRoleForBranch}
                        onChange={(e) => setSelectedRoleForBranch(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border bg-background text-xs focus:outline-none"
                      >
                        <option value="">Select role...</option>
                        {roles.map(r => {
                          const name = r.role_name || r.name;
                          return <option key={r._id || name} value={name}>{name.replace("_", " ")}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {/* Recipient Count Badge */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-foreground">
                      {calculatingCount ? "Calculating target..." : `${recipientCount} active recipients resolved`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Details */}
              <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase  text-muted-foreground flex items-center gap-1.5">
                  <Sliders size={14} className="text-orange-500" />
                  Details
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {types.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === t.value
                            ? `${t.color} border-current ring-1 ring-orange-500/20`
                            : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent"
                        }`}
                      >
                        <Icon size={12} className="shrink-0" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="title" className="block text-xs font-semibold text-muted-foreground">Title</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter broadcast title..."
                    maxLength={255}
                    className="w-full h-8 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-xs font-semibold text-muted-foreground">Message Body</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your announcement text here..."
                    maxLength={2000}
                    rows={4}
                    className="w-full p-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20 resize-none"
                    required
                  />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                    <span>Target users will be logged and dispatched in-app automatically.</span>
                    <span>{message.length} / 2000 chars</span>
                  </div>
                </div>

                {/* Optional CTA */}
                <div className="grid grid-cols-2 gap-3 border-t border-border/30 pt-3">
                  <div className="space-y-1">
                    <label htmlFor="ctaText" className="text-[10px] font-bold text-muted-foreground uppercase">CTA Text</label>
                    <input
                      id="ctaText"
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Action Required"
                      className="w-full h-8 px-2 rounded-lg border bg-background text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="ctaUrl" className="text-[10px] font-bold text-muted-foreground uppercase">CTA Link</label>
                    <input
                      id="ctaUrl"
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="e.g. /profile"
                      className="w-full h-8 px-2 rounded-lg border bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery channel selectors */}
              <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase  text-muted-foreground flex items-center gap-1.5">
                  <Radio size={14} className="text-orange-500" />
                  Delivery Channels
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {DELIVERY_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isActive = activeDeliveryMethods.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleDeliveryMethod(m.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                          isActive
                            ? "border-orange-500/50 bg-orange-500/5 ring-1 ring-orange-500/20"
                            : "border-border/50 hover:bg-muted/50 text-muted-foreground bg-transparent"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border ${isActive ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-muted border-border"}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-foreground leading-none">{m.label}</span>
                          <p className="text-[9.5px] text-muted-foreground/80 mt-0.5 leading-normal truncate">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending || !title.trim() || !message.trim()}
                  className="h-10 px-6 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-orange-600/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {sending ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  {sending ? "Broadcasting..." : "Broadcast Announcement"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Live Preview */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase  text-muted-foreground flex items-center gap-1.5">
                <Laptop size={14} className="text-orange-500" />
                Live Notification Preview
              </h2>

              <div className="border border-border/60 bg-background/50 rounded-xl p-4 relative overflow-hidden shadow-inner min-h-[130px]">
                <div className="absolute top-2 right-3 text-[9px] text-muted-foreground/60 font-mono">
                  In-App Toast
                </div>

                <div className="flex gap-3 pt-2">
                  <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border shadow-sm ${
                    type === "info" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                    type === "success" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    type === "warning" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" :
                    "text-red-400 bg-red-500/10 border-red-500/20"
                  }`}>
                    {type === "info" && <Info size={16} />}
                    {type === "success" && <CheckCircle size={16} />}
                    {type === "warning" && <AlertTriangle size={16} />}
                    {type === "error" && <AlertCircle size={16} />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground leading-tight truncate">
                        {title.trim() || "Sample Broadcast Title"}
                      </h4>
                      <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">Just now</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                      {message.trim() || "Notification body text template rendering preview here..."}
                    </p>

                    {ctaText.trim() && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-7 px-3 rounded bg-orange-500/10 border border-orange-500/25 text-[10.5px] font-semibold text-orange-400"
                        >
                          {ctaText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Distribution Stats */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border/40 space-y-3">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase ">
                  Target Information
                </h5>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9.5px]">Filter Type</span>
                    <span className="font-semibold capitalize text-foreground">
                      {audienceType.replace("_", " + ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px]">Recipients</span>
                    <span className="font-semibold text-foreground">
                      {recipientCount} resolved users
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9.5px] mb-1">Active Deliveries</span>
                    <div className="flex flex-wrap gap-1">
                      {activeDeliveryMethods.map((m) => {
                        const method = DELIVERY_METHODS.find((dm) => dm.id === m);
                        return (
                          <span key={m} className="px-2 py-0.5 bg-background border border-border/80 text-[10px] text-muted-foreground rounded-full flex items-center gap-1.5 font-medium shadow-sm">
                            {method && <method.icon size={10} className="text-orange-500" />}
                            {method?.label.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email preview details */}
              {activeDeliveryMethods.includes("email") && (
                <div className="border border-border/60 bg-background/50 rounded-xl p-4 relative overflow-hidden shadow-inner space-y-2">
                  <div className="absolute top-2 right-3 text-[9px] text-muted-foreground/60 font-mono">
                    Email copy
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1">
                    <span className="font-semibold text-foreground">To:</span> {audienceType === "all" ? "Whole Org Broadcast" : `${recipientCount} targeted users`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Subject:</span> {title || "(no subject)"}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground/80 leading-relaxed border border-border/30 rounded-lg p-2.5 bg-card/40 whitespace-pre-wrap">
                    {message || "Email body content mock text..."}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        /* Campaigns History Tab */
        <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase  text-muted-foreground flex items-center gap-1.5">
            <History size={14} className="text-orange-500" />
            Sent Campaigns Archive
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <span className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No notifications have been broadcasted yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-bold">
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Audience</th>
                      <th className="py-2.5 px-3">Delivery Channels</th>
                      <th className="py-2.5 px-3">Sent By</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-semibold truncate max-w-[180px]">{c.title}</td>
                        <td className="py-3 px-3 capitalize">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                            c.type === "warning" ? "bg-orange-500/10 text-orange-400" :
                            c.type === "error" ? "bg-red-500/10 text-red-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 capitalize text-muted-foreground">{c.audience_type.replace("_", " & ")}</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1 flex-wrap">
                            {c.delivery_methods.map((m: string) => (
                              <span key={m} className="px-1.5 py-0.5 bg-background border rounded text-[9.5px] uppercase">
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{c.created_by?.name || "System"}</td>
                        <td className="py-3 px-3 text-muted-foreground flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded">
                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                            {c.status || "delivered"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Row */}
              {campaignPagination && campaignPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    Page {campaignPagination.page} of {campaignPagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                      className="px-2.5 py-1 border rounded bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(campaignPagination.totalPages, prev + 1))}
                      disabled={historyPage === campaignPagination.totalPages}
                      className="px-2.5 py-1 border rounded bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-semibold">Save notification as template</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Saved templates are visible to all admins in your organization.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="tempName" className="text-[10px] font-bold text-muted-foreground uppercase">Template Name</label>
              <input
                id="tempName"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Q3 Branch Security Update"
                className="w-full h-8 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="h-8 px-4 border rounded-lg bg-transparent hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="h-8 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {savingTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
