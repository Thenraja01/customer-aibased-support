import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Sparkles,
  Send,
  Save,
  RotateCcw,
  Check,
  Smartphone,
  Monitor,
  User,
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

export interface EmailTemplateItem {
  subject: string;
  body: string;
}

export type EmailTemplateKey =
  | "ticket_created"
  | "ticket_assigned"
  | "ticket_resolved"
  | "ai_escalation"
  | "sla_warning"
  | "announcement_update";

interface TemplateMeta {
  key: EmailTemplateKey;
  label: string;
  roleBadge: string;
  roleType: "customer" | "agent" | "branch" | "all";
  description: string;
  icon: any;
  defaultSubject: string;
  defaultBody: string;
}

const TEMPLATES_META: TemplateMeta[] = [
  {
    key: "ticket_created",
    label: "Ticket Created",
    roleBadge: "Customer",
    roleType: "customer",
    description: "Sent to the customer immediately when a new support ticket is submitted.",
    icon: CheckCircle2,
    defaultSubject: "Ticket #{{ticket_id}} Created: {{subject}}",
    defaultBody:
      "Hello {{customer_name}},\n\nThank you for reaching out. We have received your support ticket #{{ticket_id}} regarding \"{{subject}}\".\n\nPriority: {{priority}}\nBranch: {{branch_name}}\n\nOur support team is reviewing your request and will get back to you shortly.\n\nBest regards,\n{{org_name}} Support Team",
  },
  {
    key: "ticket_assigned",
    label: "Ticket Assigned",
    roleBadge: "Support Agent",
    roleType: "agent",
    description: "Sent to the support agent or branch staff when a ticket is assigned.",
    icon: User,
    defaultSubject: "Ticket Assigned: #{{ticket_id}} - {{subject}}",
    defaultBody:
      "Hello {{agent_name}},\n\nTicket #{{ticket_id}} has been assigned to you.\n\nSubject: {{subject}}\nCustomer: {{customer_name}}\nPriority: {{priority}}\nBranch: {{branch_name}}\n\nPlease review and respond within the SLA deadline.\n\nPortal: {{portal_url}}",
  },
  {
    key: "ticket_resolved",
    label: "Ticket Resolved",
    roleBadge: "Customer",
    roleType: "customer",
    description: "Sent to the customer when their support ticket is marked as resolved.",
    icon: Check,
    defaultSubject: "Ticket #{{ticket_id}} Resolved: {{subject}}",
    defaultBody:
      "Hello {{customer_name}},\n\nYour support ticket #{{ticket_id}} has been marked as resolved.\n\nResolution Summary:\n{{ai_summary}}\n\nIf you have any further questions or if your issue persists, please reply to this email or visit our portal.\n\nBest regards,\n{{org_name}} Customer Care",
  },
  {
    key: "ai_escalation",
    label: "AI Escalation Alert",
    roleBadge: "Agent & Manager",
    roleType: "agent",
    description: "Sent when the AI chatbot encounters a complex request and escalates to a human.",
    icon: ShieldAlert,
    defaultSubject: "⚠️ AI Escalation Alert: Ticket #{{ticket_id}} requires human assistance",
    defaultBody:
      "Hello Support Team,\n\nA customer chat session has been escalated by the AI assistant and requires human agent takeover.\n\nTicket: #{{ticket_id}}\nCustomer: {{customer_name}}\nTopic: {{subject}}\nBranch: {{branch_name}}\n\nPlease open the ticket immediately to assist the customer.\n\nPortal: {{portal_url}}",
  },
  {
    key: "sla_warning",
    label: "SLA Warning",
    roleBadge: "Branch Admin",
    roleType: "branch",
    description: "Sent when an open ticket is close to violating its first response or resolution SLA.",
    icon: Clock,
    defaultSubject: "⏰ SLA Deadline Warning: Ticket #{{ticket_id}} is approaching breach",
    defaultBody:
      "Attention {{agent_name}},\n\nSupport Ticket #{{ticket_id}} (Priority: {{priority}}) is approaching its SLA response/resolution deadline.\n\nSubject: {{subject}}\nCustomer: {{customer_name}}\nBranch: {{branch_name}}\n\nPlease take immediate action to avoid an SLA breach.",
  },
  {
    key: "announcement_update",
    label: "Announcement Broadcast",
    roleBadge: "All Users",
    roleType: "all",
    description: "Sent when an organization or platform-wide broadcast announcement is dispatched.",
    icon: Users,
    defaultSubject: "📢 Announcement from {{org_name}}: {{subject}}",
    defaultBody:
      "Dear {{customer_name}},\n\nWe would like to share an important update regarding {{org_name}}:\n\n{{subject}}\n\nIf you have any questions or need assistance, our support team is always here to help.\n\nBest regards,\n{{org_name}} Team",
  },
];

const AVAILABLE_VARIABLES = [
  { tag: "{{customer_name}}", label: "Customer Name", sample: "Jane Doe" },
  { tag: "{{ticket_id}}", label: "Ticket ID", sample: "TCK-89241" },
  { tag: "{{subject}}", label: "Subject", sample: "Account Verification Issue" },
  { tag: "{{priority}}", label: "Priority", sample: "HIGH" },
  { tag: "{{agent_name}}", label: "Agent Name", sample: "Alex Rivera" },
  { tag: "{{branch_name}}", label: "Branch Name", sample: "Downtown Branch" },
  { tag: "{{org_name}}", label: "Org Name", sample: "Supernova Care" },
  { tag: "{{portal_url}}", label: "Portal URL", sample: "https://support.app/tickets/TCK-89241" },
  { tag: "{{ai_summary}}", label: "AI Summary", sample: "Verified account identity and unlocked billing portal." },
];

interface EmailTemplatesStudioProps {
  organizationId?: string;
  initialTemplates?: Record<string, EmailTemplateItem>;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  logoUrl?: string;
  orgName?: string;
  onSave?: (templates: Record<string, EmailTemplateItem>) => Promise<void> | void;
}

export default function EmailTemplatesStudio({
  organizationId,
  initialTemplates,
  brandColors,
  logoUrl,
  orgName = "Support AI",
  onSave,
}: EmailTemplatesStudioProps) {
  const toast = useToast();
  const { user } = useAuth();

  const [activeKey, setActiveKey] = useState<EmailTemplateKey>("ticket_created");
  const [templates, setTemplates] = useState<Record<string, EmailTemplateItem>>({});
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState(user?.email || "");

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Initialize templates with defaults merged with incoming data
  useEffect(() => {
    const initialized: Record<string, EmailTemplateItem> = {};
    TEMPLATES_META.forEach((meta) => {
      initialized[meta.key] = {
        subject: initialTemplates?.[meta.key]?.subject || meta.defaultSubject,
        body: initialTemplates?.[meta.key]?.body || meta.defaultBody,
      };
    });
    setTemplates(initialized);
  }, [initialTemplates]);

  const currentMeta = TEMPLATES_META.find((m) => m.key === activeKey) || TEMPLATES_META[0];
  const currentTemplate = templates[activeKey] || {
    subject: currentMeta.defaultSubject,
    body: currentMeta.defaultBody,
  };

  const handleFieldChange = (field: "subject" | "body", value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        [field]: value,
      },
    }));
  };

  const handleInsertVariable = (tag: string) => {
    if (!bodyRef.current) return;
    const textarea = bodyRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentTemplate.body || "";
    const updated = text.substring(0, start) + tag + text.substring(end);

    handleFieldChange("body", updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleResetToDefault = () => {
    setTemplates((prev) => ({
      ...prev,
      [activeKey]: {
        subject: currentMeta.defaultSubject,
        body: currentMeta.defaultBody,
      },
    }));
    toast.info("Reset", `Reset "${currentMeta.label}" to default wording.`);
  };

  const handlePolishWithAI = async (tone: "empathetic" | "professional" | "concise" | "friendly") => {
    setPolishing(true);
    try {
      const res = await AdminAPI.polishEmailTemplate({
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        tone,
        organizationId,
      });

      if (res.data?.success && res.data.data) {
        setTemplates((prev) => ({
          ...prev,
          [activeKey]: {
            subject: res.data.data.subject || currentTemplate.subject,
            body: res.data.data.body || currentTemplate.body,
          },
        }));
        toast.success("AI Polish Applied", `Refined template with "${tone}" tone.`);
      }
    } catch (err: any) {
      toast.error("AI Polish Failed", err?.response?.data?.message || "Could not polish template.");
    } finally {
      setPolishing(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(templates);
      } else if (organizationId) {
        await AdminAPI.updateOrganization(organizationId, { email_templates: templates });
      } else {
        await AdminAPI.updateOrgSettings({ email_templates: templates });
      }
      toast.success("Templates Saved", "Email templates updated successfully.");
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save email templates.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      toast.error("Validation", "Enter a recipient email address.");
      return;
    }
    setTesting(true);
    try {
      await AdminAPI.testEmailTemplate({
        templateKey: activeKey,
        recipientEmail: testRecipient,
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        organizationId,
      });
      toast.success("Test Email Sent", `Sent test email to ${testRecipient}`);
      setTestEmailModal(false);
    } catch (err: any) {
      toast.error("Test Failed", err?.response?.data?.message || "Failed to send test email.");
    } finally {
      setTesting(false);
    }
  };

  // Interpolate mock data for live responsive preview
  const renderPreviewText = (text: string) => {
    let result = text || "";
    AVAILABLE_VARIABLES.forEach((v) => {
      result = result.split(v.tag).join(v.sample);
    });
    return result;
  };

  const previewSubject = renderPreviewText(currentTemplate.subject);
  const previewBody = renderPreviewText(currentTemplate.body);
  const primaryColor = brandColors?.primary || "#2563eb";

  return (
    <div className="space-y-6">
      {/* Top Banner & Save Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Mail className="text-primary" size={20} />
            Multi-Tenant Email Template Studio
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated transactional email notifications triggered across ticket lifecycles, SLA alerts, and escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTestEmailModal(true)}>
            <Send size={14} className="mr-1.5" /> Send Test Email
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save All Templates
          </Button>
        </div>
      </div>

      {/* Lifecycle Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {TEMPLATES_META.map((meta) => {
          const Icon = meta.icon;
          const isSelected = activeKey === meta.key;
          return (
            <button
              key={meta.key}
              onClick={() => setActiveKey(meta.key)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                  : "border-border/60 bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 uppercase font-bold ${
                    meta.roleType === "customer"
                      ? "text-emerald-500 border-emerald-500/30"
                      : meta.roleType === "agent"
                      ? "text-blue-500 border-blue-500/30"
                      : meta.roleType === "branch"
                      ? "text-amber-500 border-amber-500/30"
                      : "text-purple-500 border-purple-500/30"
                  }`}
                >
                  {meta.roleBadge}
                </Badge>
              </div>
              <p className="text-xs font-bold truncate text-foreground">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid: Left = Editor, Right = Live Responsive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Template Editor */}
        <div className="lg:col-span-7 space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{currentMeta.label}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  Target: {currentMeta.roleBadge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{currentMeta.description}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={handleResetToDefault}
              title="Reset current template to default"
            >
              <RotateCcw size={13} className="mr-1" /> Reset Default
            </Button>
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Subject Line</span>
              <span className="text-[11px] font-normal lowercase">supports dynamic tags</span>
            </label>
            <Input
              value={currentTemplate.subject}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
              placeholder="Email subject..."
              className="font-medium text-xs sm:text-sm"
            />
          </div>

          {/* 1-Click Variable Insert Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              1-Click Insert Variables (Click to add at cursor)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2 py-1 rounded-md text-[11px] font-mono bg-muted/60 hover:bg-primary/20 hover:text-primary border border-border/60 transition-all"
                  title={`Sample value: "${v.sample}"`}
                >
                  + {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* AI Polish Toolbar */}
          <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles size={14} /> AI Tone Refiner & Copy Polish
              </span>
              {polishing && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Rewriting copy...
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                disabled={polishing}
                onClick={() => handlePolishWithAI("empathetic")}
              >
                💛 Warm & Empathetic
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                disabled={polishing}
                onClick={() => handlePolishWithAI("professional")}
              >
                💼 Professional & Crisp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                disabled={polishing}
                onClick={() => handlePolishWithAI("concise")}
              >
                ⚡ Ultra-Concise
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                disabled={polishing}
                onClick={() => handlePolishWithAI("friendly")}
              >
                😊 Friendly
              </Button>
            </div>
          </div>

          {/* Body Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Email Body Copy</label>
            <textarea
              ref={bodyRef}
              value={currentTemplate.body}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              rows={8}
              placeholder="Email body text..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Live Responsive Preview */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Monitor size={15} className="text-primary" /> Live HTML Preview
            </h3>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded transition-all ${
                  previewDevice === "desktop" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                }`}
                title="Desktop View"
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded transition-all ${
                  previewDevice === "mobile" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                }`}
                title="Mobile View"
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          {/* Rendered Email Frame */}
          <div
            className={`mx-auto rounded-xl border bg-white text-zinc-900 shadow-sm overflow-hidden transition-all ${
              previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
            }`}
          >
            {/* Branded Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%)`,
              }}
              className="p-4 text-white"
            >
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={orgName}
                  className="max-h-7 max-w-[120px] object-contain mb-2 brightness-0 invert"
                />
              )}
              <h4 className="font-bold text-sm tracking-tight text-white">{orgName}</h4>
            </div>

            {/* Email Body Content */}
            <div className="p-4 space-y-3 bg-white text-zinc-800">
              <h5 className="font-bold text-sm text-zinc-900 leading-snug">{previewSubject}</h5>

              <div className="text-xs text-zinc-700 space-y-2 whitespace-pre-wrap font-sans leading-relaxed border-t pt-3">
                {previewBody}
              </div>

              {/* Portal CTA Button */}
              <div className="pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 cursor-default"
                >
                  View in Portal <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Email Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center text-[10px] text-zinc-500">
              <p>This email was sent by <strong>{orgName}</strong> automated support system.</p>
              <p>&copy; {new Date().getFullYear()} {orgName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Test Email Modal */}
      {testEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Send size={16} className="text-primary" /> Send Real Test Email
            </h3>
            <p className="text-xs text-muted-foreground">
              Verify your SMTP connection and see the exact rendered HTML layout in your real email client.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Recipient Email</label>
              <Input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="admin@example.com"
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setTestEmailModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendTestEmail} disabled={testing}>
                {testing ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                Send Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
