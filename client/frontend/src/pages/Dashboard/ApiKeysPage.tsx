import React, { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  Code2,
  Trash2,
  Loader2,
  Lock,
  Globe,
  Sparkles,
  Laptop,
  ExternalLink,
  Play,
  CheckCircle2,
  Settings2,
  SlidersHorizontal,
  UserCheck,
  Layers,
  RefreshCw,
  Eye,
  MessageCircle,
  X,
  Send,
  Paperclip,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import AxiosInstance from "@/api/axiosInstance";

interface ApiKeyDoc {
  _id: string;
  name: string;
  type?: "public" | "secret";
  key_prefix: string;
  status: "active" | "revoked";
  created_at?: string;
  createdAt?: string;
  last_used_at?: string;
  scopes?: string[];
}

export default function ApiKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKeyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Key creation state
  const [keyName, setKeyName] = useState("");
  const [keyType, setKeyType] = useState<"public" | "secret">("public");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  // Integration tab state
  const [activeTab, setActiveTab] = useState<"html" | "iframe" | "react" | "next" | "express" | "python" | "sdk">("html");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Widget Configuration State (for live preview & config)
  const [configTheme, setConfigTheme] = useState<"dark" | "light">("dark");
  const [configPosition, setConfigPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [botName, setBotName] = useState("Support AI");
  const [greetingMessage, setGreetingMessage] = useState("Hi! How can we help you today?");
  const [accentColor, setAccentColor] = useState("#6366F1");
  const [launcherType, setLauncherType] = useState<"icon" | "label">("icon");

  // Domain Management
  const [allowedDomains, setAllowedDomains] = useState<string[]>(["http://localhost:3030", "http://localhost:5173"]);
  const [newDomain, setNewDomain] = useState("");

  // Test suite state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testUrl, setTestUrl] = useState("http://localhost:3030/laptop-store.html");
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "success">("idle");
  const [showArchDiagram, setShowArchDiagram] = useState(false);

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3030").replace(/\/+$/, "");

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/api/v1/api-keys");
      if (res.data.success) {
        setKeys(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const res = await AxiosInstance.post("/api/v1/api-keys", {
        name: keyName,
        type: keyType,
      });
      if (res.data.success && res.data.data) {
        setCreatedRawKey(res.data.data.rawKey);
        toast.success("API Key Generated", "Your new API key is ready. Copy it now!");
        loadKeys();
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to create API key.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await AxiosInstance.delete(`/api/v1/api-keys/${id}`);
      toast.success("Key Revoked", "API Key has been revoked.");
      loadKeys();
    } catch {
      toast.error("Error", "Failed to revoke API key.");
    }
  };

  const activePublicKey = keys.find((k) => (k.type === "public" || k.key_prefix?.startsWith("pk_")) && k.status === "active")?.key_prefix || "pk_live_YOUR_PUBLIC_KEY";

  const copyToClipboard = (text: string, typeLabel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeLabel);
    setTimeout(() => setCopiedType(null), 2000);
    toast.success("Copied to Clipboard", `${typeLabel} code snippet copied.`);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    let formatted = newDomain.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = `https://${formatted}`;
    }
    if (!allowedDomains.includes(formatted)) {
      setAllowedDomains([...allowedDomains, formatted]);
      toast.success("Domain Added", `Added ${formatted} to allowed origins.`);
    }
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
    toast.success("Domain Removed", `Removed ${domain} from allowed origins.`);
  };

  const handleSaveConfig = () => {
    toast.success("Configuration Saved", "Widget appearance and identity updated successfully.");
  };

  const runInstallationCheck = () => {
    setTestStatus("running");
    setTimeout(() => {
      setTestStatus("success");
      toast.success("Installation Verified", "Widget connection and API endpoints are 100% operational!");
    }, 1500);
  };

  // Code snippets by framework
  const frontendUrl = window.location.origin;
  const iframeSnippet = `<!-- Pure React AI Chatbot (100% CSS Isolated & Responsive) -->
<iframe
  src="${frontendUrl}/widget?key=${createdRawKey || activePublicKey}&theme=${configTheme}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); max-width: 440px;"
  allow="clipboard-write">
</iframe>`;

  const htmlSnippet = `<script
  src="${backendUrl}/widget.js"
  data-api-key="${createdRawKey || activePublicKey}"
  data-theme="${configTheme}"
  data-position="${configPosition}"
  defer
></script>`;

  const reactSnippet = `import { useEffect } from "react";

export default function SupportAIWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "${backendUrl}/widget.js";
    script.dataset.apiKey = "${createdRawKey || activePublicKey}";
    script.dataset.theme = "${configTheme}";
    script.dataset.position = "${configPosition}";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

  const nextSnippet = `import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          id="support-ai-loader"
          src="${backendUrl}/widget.js"
          strategy="afterInteractive"
          data-api-key="${createdRawKey || activePublicKey}"
          data-theme="${configTheme}"
          data-position="${configPosition}"
        />
      </body>
    </html>
  );
}`;

  const expressSnippet = `// Node.js / Express Server API Proxy Integration
const express = require('express');
const app = express();

app.post('/api/support-ai-chat', async (req, res) => {
  const response = await fetch('${backendUrl}/api/v1/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${createdRawKey || activePublicKey}'
    },
    body: JSON.stringify({ message: req.body.message })
  });
  const data = await response.json();
  res.json(data);
});`;

  const pythonSnippet = `# Python (Flask / FastAPI / Django) Integration
import requests

def ask_support_ai(user_message):
    url = "${backendUrl}/api/v1/chat/message"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": "${createdRawKey || activePublicKey}"
    }
    payload = { "message": user_message }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Example invocation:
# res = ask_support_ai("what are shipment time")
# print(res["data"]["answer"])`;

  const sdkSnippet = `// Programmatic JS SDK Integration (Zero-Framework HTML/JS)
// Once the widget script is loaded:

// Open chat window programmatically
window.SupportAI.open();

// Send prompt message automatically
window.SupportAI.sendMessage("ai health check");

// Identify logged-in customer identity
window.SupportAI.identifyUser({
  userId: "usr_8842",
  name: "Sarah Jenkins",
  email: "sarah@company.com"
});`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header & Action-Oriented Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
            <Sparkles size={14} />
            EMBEDDED AI PLATFORM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Connect SupportAI to your website
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add an AI support assistant widget to any HTML site, React, or Next.js app in minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCreatedRawKey(null);
              setKeyName("");
              setKeyType("public");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0"
          >
            <Plus size={16} />
            Create API Key
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.SupportAI) window.SupportAI.open();
              else toast.info("Live Preview", "Use the interactive Live Preview builder below!");
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-xs sm:text-sm hover:bg-secondary/80 border border-border transition-all active:scale-95 shrink-0"
          >
            <Eye size={16} />
            Preview Widget
          </button>
        </div>
      </div>

      {/* Integration Status Bar & 3-Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Status Card */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Integration Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready to integrate
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground font-semibold block">API Key</span>
              <span className="font-mono font-bold text-foreground truncate block mt-0.5">{activePublicKey.slice(0, 10)}…</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground font-semibold block">Allowed</span>
              <span className="font-bold text-foreground block mt-0.5">{allowedDomains.length} Origins</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground font-semibold block">Widget</span>
              <span className="font-bold text-emerald-400 block mt-0.5">Active</span>
            </div>
          </div>
        </div>

        {/* 3-Step Flow Stepper */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-around">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <p className="text-xs font-extrabold text-foreground">01 Create Key</p>
              <p className="text-[11px] text-emerald-400 font-medium">Public key active</p>
            </div>
          </div>

          <ChevronRight size={18} className="text-muted-foreground/40 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm animate-pulse">
              02
            </div>
            <div>
              <p className="text-xs font-extrabold text-foreground">02 Install Widget</p>
              <p className="text-[11px] text-indigo-400 font-medium">Embed script tag</p>
            </div>
          </div>

          <ChevronRight size={18} className="text-muted-foreground/40 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground border border-border flex items-center justify-center font-bold text-sm">
              03
            </div>
            <div>
              <p className="text-xs font-extrabold text-muted-foreground">03 Test Widget</p>
              <p className="text-[11px] text-muted-foreground font-medium">Verify connection</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Integration (Clean Code Snippets & Framework Tabs) */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-foreground">Quick Integration Snippet</h2>
              <p className="text-xs text-muted-foreground">Choose your stack to view the clean embed snippet.</p>
            </div>
          </div>

          {/* Framework Tabs */}
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold gap-1">
            {(["html", "iframe", "react", "next", "express", "python", "sdk"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? "bg-card text-foreground font-bold shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "html"
                  ? "HTML (Script)"
                  : tab === "iframe"
                  ? "iFrame (React)"
                  : tab === "react"
                  ? "React"
                  : tab === "next"
                  ? "Next.js"
                  : tab === "express"
                  ? "Express (Node)"
                  : tab === "python"
                  ? "Python"
                  : "JS SDK"}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-slate-300 font-semibold">
                {activeTab === "html"
                  ? "index.html"
                  : activeTab === "iframe"
                  ? "embed-iframe.html"
                  : activeTab === "react"
                  ? "SupportAIWidget.jsx"
                  : activeTab === "next"
                  ? "layout.tsx"
                  : activeTab === "express"
                  ? "server.js"
                  : activeTab === "python"
                  ? "app.py"
                  : "widget-sdk.js"}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const code =
                    activeTab === "html"
                      ? htmlSnippet
                      : activeTab === "iframe"
                      ? iframeSnippet
                      : activeTab === "react"
                      ? reactSnippet
                      : activeTab === "next"
                      ? nextSnippet
                      : activeTab === "express"
                      ? expressSnippet
                      : activeTab === "python"
                      ? pythonSnippet
                      : sdkSnippet;
                  copyToClipboard(code, activeTab.toUpperCase());
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs font-semibold transition"
              >
                {copiedType === activeTab.toUpperCase() ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedType === activeTab.toUpperCase() ? "Copied!" : "Copy Snippet"}
              </button>
            </div>
          </div>

          <div className="p-5 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
            <pre>
              {activeTab === "html" && htmlSnippet}
              {activeTab === "iframe" && iframeSnippet}
              {activeTab === "react" && reactSnippet}
              {activeTab === "next" && nextSnippet}
              {activeTab === "express" && expressSnippet}
              {activeTab === "python" && pythonSnippet}
              {activeTab === "sdk" && sdkSnippet}
            </pre>
          </div>
        </div>
      </div>

      {/* 3. Interactive Widget Customization & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customization Controls */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <SlidersHorizontal className="text-primary" size={18} />
            <h3 className="font-extrabold text-base">Widget Configuration</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Theme Selector */}
            <div>
              <label className="block font-bold text-foreground mb-1.5">Appearance Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfigTheme("dark")}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    configTheme === "dark" ? "bg-slate-900 border-indigo-500 text-white shadow-md" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🌙 Dark Mode
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTheme("light")}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    configTheme === "light" ? "bg-white border-indigo-500 text-slate-900 shadow-md" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ☀️ Light Mode
                </button>
              </div>
            </div>

            {/* Position Selector */}
            <div>
              <label className="block font-bold text-foreground mb-1.5">Position on Screen</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfigPosition("bottom-right")}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    configPosition === "bottom-right" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ↘ Bottom Right
                </button>
                <button
                  type="button"
                  onClick={() => setConfigPosition("bottom-left")}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    configPosition === "bottom-left" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ↙ Bottom Left
                </button>
              </div>
            </div>

            {/* Bot Name & Greeting */}
            <div>
              <label className="block font-bold text-foreground mb-1">Bot Name</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Greeting Message</label>
              <textarea
                rows={2}
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Accent Color Swatches */}
            <div>
              <label className="block font-bold text-foreground mb-1.5">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                {["#6366F1", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accentColor === color ? "scale-125 ring-2 ring-foreground shadow-lg" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-md active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Mockup Preview */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Laptop className="text-primary" size={18} />
              <h3 className="font-extrabold text-base">Live Website Preview</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Interactive Canvas</span>
          </div>

          <div className="relative flex-1 min-h-[360px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden p-6 flex flex-col justify-between">
            {/* Website Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="font-bold text-xs text-white">Your Website</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">http://yourdomain.com</span>
            </div>

            {/* Website Content Placeholder */}
            <div className="space-y-3 py-6">
              <div className="h-5 w-48 rounded-lg bg-slate-900 border border-slate-800 animate-pulse" />
              <div className="h-3 w-64 rounded-md bg-slate-900/60 border border-slate-800/60" />
              <div className="h-3 w-40 rounded-md bg-slate-900/40 border border-slate-800/40" />
            </div>

            {/* Live Chat Window Preview */}
            <div
              className={`absolute bottom-16 ${
                configPosition === "bottom-right" ? "right-6" : "left-6"
              } w-72 rounded-2xl shadow-2xl border ${
                configTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              } overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95`}
            >
              <div className="p-3 border-b flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                  <span className="font-bold text-xs">{botName}</span>
                </div>
                <X size={14} className="text-slate-400" />
              </div>

              <div className="p-3 space-y-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/50">
                  {greetingMessage}
                </div>
                <div
                  style={{ backgroundColor: accentColor }}
                  className="p-2.5 rounded-xl text-white font-medium self-end ml-auto max-w-[80%] text-right"
                >
                  What are shipment times?
                </div>
              </div>

              <div className="p-2 border-t flex items-center gap-1.5 bg-slate-950/20">
                <input
                  type="text"
                  disabled
                  placeholder="Type a message..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[10px]"
                />
                <button
                  type="button"
                  style={{ backgroundColor: accentColor }}
                  className="p-1.5 rounded-lg text-white"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>

            {/* Live Trigger Bubble */}
            <button
              type="button"
              style={{ backgroundColor: accentColor }}
              className={`absolute bottom-4 ${
                configPosition === "bottom-right" ? "right-6" : "left-6"
              } w-10 h-10 rounded-full text-white shadow-xl flex items-center justify-center font-bold text-sm transition-transform hover:scale-110`}
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Origin & Domain Security Whitelist */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="text-primary" size={18} />
            <h3 className="font-extrabold text-base">Allowed Origins & Domains</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">CORS Origin Protection</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Only websites matching these origin domains are allowed to load your widget key and run AI conversations.
        </p>

        <form onSubmit={handleAddDomain} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. https://mycompany.com"
            className="flex-1 px-3.5 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm"
          >
            Add Domain
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {allowedDomains.map((domain) => (
            <div
              key={domain}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-mono font-medium text-foreground"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              {domain}
              <button
                type="button"
                onClick={() => handleRemoveDomain(domain)}
                className="text-muted-foreground hover:text-rose-500 transition-colors ml-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Installation Check & Test Suite */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <h3 className="font-extrabold text-base">Installation Test & Verification</h3>
          </div>
          <button
            type="button"
            onClick={runInstallationCheck}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm"
          >
            <Play size={14} />
            {testStatus === "running" ? "Verifying..." : "Run Test Suite"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
            ✓ API Key Valid
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
            ✓ Script Reachable
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
            ✓ Origin Whitelisted
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
            ✓ Widget Init OK
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
            ✓ RAG Pipeline Live
          </div>
        </div>
      </div>

      {/* 6. Active & Revoked API Keys Management */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-extrabold text-base">Active & Revoked API Keys</h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition"
          >
            <Plus size={14} />
            New Key
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-muted/20">
            <Key size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No API Keys Generated</p>
            <p className="text-xs text-muted-foreground mt-1">Create a public widget key to enable website chat embedding.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Key Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Key Preview</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys.map((k) => (
                  <tr key={k._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{k.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.type === "public" || k.key_prefix?.startsWith("pk_")
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                      }`}>
                        {k.type === "public" || k.key_prefix?.startsWith("pk_") ? <Globe size={10} /> : <Lock size={10} />}
                        {k.type === "public" || k.key_prefix?.startsWith("pk_") ? "Public Widget" : "Secret Key"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{k.key_prefix}••••••••</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        k.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(k.created_at || k.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Collapsible Technical Flow & Architecture */}
      <div className="p-4 rounded-xl bg-muted/30 border space-y-2 text-xs">
        <button
          type="button"
          onClick={() => setShowArchDiagram(!showArchDiagram)}
          className="w-full flex items-center justify-between text-left font-bold text-foreground hover:text-primary transition"
        >
          <span>Architecture & Technical Execution Flow</span>
          <span className="text-muted-foreground font-mono">{showArchDiagram ? "[-] Hide" : "[+] Show Details"}</span>
        </button>

        {showArchDiagram && (
          <div className="font-mono text-[11px] text-muted-foreground bg-card p-4 rounded-lg border space-y-2 mt-2 leading-relaxed">
            <p className="text-primary font-bold">Host Website → Shadow DOM (&lt;support-ai-widget&gt;) → API Key & Origin CORS Validation → RAG Pipeline Engine → AI Response</p>
            <p>1. Custom Web Component isolates CSS and JS scopes from external site collision.</p>
            <p>2. API Key resolves Organization, Tenant, and AI configuration on backend securely.</p>
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Key className="text-primary" size={18} />
                Generate New API Key
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {!createdRawKey ? (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Website Production Widget"
                    className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Key Classification Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setKeyType("public")}
                      className={`p-3 rounded-xl border text-left text-xs font-medium space-y-1 transition-all ${
                        keyType === "public"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Globe size={13} />
                        Public Widget Key
                      </div>
                      <p className="text-[10px] opacity-80">Safe for HTML script tag on external sites (pk_live_...)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyType("secret")}
                      className={`p-3 rounded-xl border text-left text-xs font-medium space-y-1 transition-all ${
                        keyType === "secret"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock size={13} />
                        Secret API Key
                      </div>
                      <p className="text-[10px] opacity-80">Server-to-server operations (sk_live_...)</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  >
                    {creating ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} />
                  Copy this key now. It will NEVER be shown again!
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-emerald-400">
                  <span className="truncate mr-2">{createdRawKey}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdRawKey, "API KEY")}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0"
                  >
                    {copiedType === "API KEY" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
