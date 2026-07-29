import { useState } from "react";
import { Send, Bell, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { NotificationAPI } from "@/api/notification.api.js";

const types = [
  { value: "info", label: "Info", icon: Info, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
  { value: "success", label: "Success", icon: CheckCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  { value: "error", label: "Error", icon: AlertCircle, color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
] as const;

export default function SendNotificationPage() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Validation", "Title and message are required");
      return;
    }

    setSending(true);
    try {
      const res = await NotificationAPI.broadcastToOrg({ title, message, type, link: "" });
      toast.success("Sent", `Notification sent to ${res.data.count || "all"} users in your organization`);
      setTitle("");
      setMessage("");
      setType("info");
    } catch (err: any) {
      toast.error("Failed", err.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="text-primary" size={28} />
          Send Notification
        </h1>
        <p className="text-muted-foreground mt-1">
          Broadcast a notification to all users in your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Notification Type</label>
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => {
              const Icon = t.icon;
              const isActive = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive
                      ? "ring-2 ring-primary/40 border-primary shadow-sm"
                      : "border-transparent hover:border-border"
                  } ${t.color}`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. System Maintenance Tonight"
            maxLength={255}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your notification message here..."
            maxLength={2000}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/2000</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-4 py-3 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>This will send a notification to every active user in your organization.</span>
        </div>

        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
}
