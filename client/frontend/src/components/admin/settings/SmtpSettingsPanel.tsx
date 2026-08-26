import { useState } from "react";
import { Mail, Send, Info, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import AxiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/toast";

interface SmtpSettingsPanelProps {
  form: any;
  updateField: (path: string, value: any) => void;
}

export default function SmtpSettingsPanel({ form, updateField }: SmtpSettingsPanelProps) {
  const toast = useToast();
  const smtp = form.smtp_config || {};
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Missing", "Please enter a recipient email for the test.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await AxiosInstance.post("/admin/smtp/test", {
        to: testEmail,
        smtp_config: smtp,
      });
      setTestResult({ ok: true, message: res.data?.message || "Test email sent successfully." });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.response?.data?.message || "Failed to send test email.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail size={18} className="text-primary" />
          SMTP Configuration
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a custom SMTP server for outbound email notifications. When enabled, this
          overrides the platform-level email settings for this organization.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-xl border dark:border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Enable Custom SMTP</p>
          <p className="text-xs text-muted-foreground">
            Use a dedicated mail server for this organization's notifications.
          </p>
        </div>
        <Switch
          checked={smtp.enabled ?? false}
          onCheckedChange={(v) => updateField("smtp_config.enabled", v)}
          aria-label="Enable custom SMTP"
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>SMTP Host</Label>
          <Input
            value={smtp.host || ""}
            onChange={(e) => updateField("smtp_config.host", e.target.value)}
            placeholder="smtp.gmail.com"
            disabled={!smtp.enabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Port</Label>
          <Input
            type="number"
            value={smtp.port ?? 587}
            onChange={(e) => updateField("smtp_config.port", Number(e.target.value))}
            placeholder="587"
            disabled={!smtp.enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            Common ports: 25 (plain), 465 (SSL), 587 (TLS/STARTTLS)
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Username / Email</Label>
          <Input
            value={smtp.user || ""}
            onChange={(e) => updateField("smtp_config.user", e.target.value)}
            placeholder="your@gmail.com"
            autoComplete="off"
            disabled={!smtp.enabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Password / App Password</Label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={smtp.pass || ""}
              onChange={(e) => updateField("smtp_config.pass", e.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              disabled={!smtp.enabled}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            For Gmail, use an App Password instead of your Google account password.
          </p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label>From Address</Label>
          <Input
            value={smtp.from || ""}
            onChange={(e) => updateField("smtp_config.from", e.target.value)}
            placeholder='SupportAI <noreply@yourdomain.com>'
            disabled={!smtp.enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            The "From" display name and address shown in recipients' inboxes.
          </p>
        </div>

        {/* Secure toggle */}
        <div className="md:col-span-2 flex items-center justify-between rounded-lg border dark:border-white/[0.06] px-4 py-2.5">
          <div>
            <p className="text-sm font-medium">Use SSL (port 465)</p>
            <p className="text-xs text-muted-foreground">
              Enable if your SMTP server requires a direct SSL connection.
              Leave off to use STARTTLS (port 587).
            </p>
          </div>
          <Switch
            checked={smtp.secure ?? false}
            onCheckedChange={(v) => updateField("smtp_config.secure", v)}
            disabled={!smtp.enabled}
            aria-label="Use SSL"
          />
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <span>
          SMTP credentials are stored encrypted. Ensure you use App Passwords or OAuth tokens
          where available. Never share your primary email account password.
        </span>
      </div>

      {/* Test email */}
      <div className="rounded-xl border dark:border-white/[0.06] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Send size={15} className="text-primary" />
          <h4 className="text-sm font-semibold">Send Test Email</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Send a test message using the SMTP settings above to verify the configuration.
          Remember to <strong>save settings</strong> first.
        </p>

        <div className="flex gap-2">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1"
            disabled={!smtp.enabled}
          />
          <Button
            onClick={handleTestEmail}
            disabled={testing || !smtp.enabled || !smtp.host}
            size="sm"
            variant="outline"
          >
            {testing ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <Send size={14} className="mr-1.5" />
            )}
            {testing ? "Sending..." : "Send Test"}
          </Button>
        </div>

        {testResult && (
          <div
            className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
              testResult.ok
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30"
                : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            ) : (
              <XCircle size={14} className="mt-0.5 shrink-0" />
            )}
            {testResult.message}
          </div>
        )}
      </div>

      {/* Fallback notice */}
      <div className="flex items-start gap-3 rounded-xl border dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          If custom SMTP is disabled or misconfigured, the platform falls back to the global
          SMTP settings defined in the server environment variables.
        </span>
      </div>
    </div>
  );
}
