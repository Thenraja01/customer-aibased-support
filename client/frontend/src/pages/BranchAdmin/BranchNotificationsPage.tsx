import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";

export default function BranchNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientGroup, setRecipientGroup] = useState("branch_support");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);
    try {
      await AxiosInstance.post("/notifications", {
        title,
        message,
        type: "announcement",
        recipientGroup,
      });
      setSent(true);
      setTitle("");
      setMessage("");
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Failed to send notification:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Branch Notifications & Broadcasts</h1>
          <p className="text-slate-400 text-sm mt-1">Send announcements, urgent alerts, and operational notifications to branch support agents or customers.</p>
        </div>
      </div>

      {sent && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Notification broadcasted successfully!
        </div>
      )}

      <form onSubmit={handleSendNotification} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1">Target Audience</label>
          <select
            value={recipientGroup}
            onChange={(e) => setRecipientGroup(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="branch_support">Branch Support Agents</option>
            <option value="branch_customers">Branch Customers</option>
            <option value="all_branch_users">All Branch Users</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1">Notification Title</label>
          <input
            type="text"
            placeholder="e.g. Scheduled System Maintenance at 10 PM"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1">Message Content</label>
          <textarea
            rows={4}
            placeholder="Provide details about the operational alert or announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 transition"
        >
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Broadcast"}
        </button>
      </form>
    </div>
  );
}
