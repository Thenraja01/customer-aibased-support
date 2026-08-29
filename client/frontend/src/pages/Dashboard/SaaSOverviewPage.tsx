import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Circle, ArrowRight, Bot, Database, Key, MessageSquare, Code2, Copy, Check, Sparkles, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import DocumentAPI from "@/api/document.api.js";
import { ChatAPI } from "@/api";
import AxiosInstance from "@/api/axiosInstance";

export default function SaaSOverviewPage() {
  const { user, orgSettings } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [docCount, setDocCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3030").replace(/\/+$/, "");

  useEffect(() => {
    loadOverviewStats();
  }, []);

  const loadOverviewStats = async () => {
    try {
      const [docsRes, chatsRes, keysRes] = await Promise.all([
        DocumentAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        ChatAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        AxiosInstance.get("/api/v1/api-keys").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (docsRes.data?.success) setDocCount(docsRes.data.data.length);
      if (chatsRes.data?.success) setChatCount(chatsRes.data.data.length);
      if (keysRes.data?.success && keysRes.data.data.length > 0) setHasApiKey(true);
    } catch (err) {
      console.warn("Stats load notice:", err);
    }
  };

  const steps = [
    { title: "Register Account", desc: "Account setup & authentication", done: true },
    { title: "Create Organization / Website Project", desc: `Project: ${user?.organization_id?.name || "Support AI Project"}`, done: true },
    { title: "Upload Knowledge Base Documents", desc: `${docCount} documents uploaded and indexed`, done: docCount > 0, link: "/admin/embedded-knowledge" },
    { title: "Configure AI Support Chatbot", desc: `Bot: ${orgSettings?.chatbot_name || "Support AI"}`, done: !!orgSettings?.chatbot_name, link: "/admin/embedded-chatbot" },
    { title: "Generate Public Widget API Key", desc: hasApiKey ? "Widget key generated" : "Create widget API key", done: hasApiKey, link: "/admin/api-keys" },
    { title: "Install <script> Tag on External Website", desc: "Embed floating chatbot launcher", done: false, link: "/admin/api-keys" },
  ];

  const embedScriptCode = `<script\n  src="${backendUrl}/widget.js"\n  data-api-key="YOUR_PUBLIC_WIDGET_KEY">\n</script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Copied", "Embed script copied to clipboard!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            SaaS Website Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-foreground">{user?.name}</span>! Embed your custom AI support chatbot into any website in minutes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-semibold text-xs border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck size={16} />
            Platform Status: Live
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Base</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Database size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{docCount}</div>
          <p className="text-[11px] text-muted-foreground">Uploaded Documents</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversations</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{chatCount}</div>
          <p className="text-[11px] text-muted-foreground">Customer Sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Bot Name</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Bot size={18} />
            </div>
          </div>
          <div className="text-lg font-bold truncate">{orgSettings?.chatbot_name || "Support AI"}</div>
          <p className="text-[11px] text-muted-foreground">Active Configuration</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Widget Status</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Code2 size={18} />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-500">Ready to Embed</div>
          <p className="text-[11px] text-muted-foreground">Script Tag Available</p>
        </div>
      </div>

      {/* Onboarding Workflow Steps */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5">
        <h3 className="font-bold text-base flex items-center gap-2">
          <CheckCircle2 className="text-primary" size={20} />
          Website Integration Onboarding Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                s.done
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-muted/30 border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {s.done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-bold text-muted-foreground">Step {idx + 1}</span>
                </div>
                {s.link && (
                  <button
                    type="button"
                    onClick={() => navigate(s.link)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Go <ArrowRight size={12} />
                  </button>
                )}
              </div>
              <h4 className="font-bold text-xs mt-2 text-foreground">{s.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Website Script Code Box */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Code2 className="text-primary" size={20} />
            Quick Website Script Tag
          </h3>
          <button
            type="button"
            onClick={copyEmbedCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold border border-primary/20 transition-all active:scale-95"
          >
            {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copiedCode ? "Copied" : "Copy Snippet"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Copy and paste this script tag into any HTML website to instantly launch your floating AI support widget:
        </p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto">
          <pre>{embedScriptCode}</pre>
        </div>
      </div>
    </div>
  );
}
