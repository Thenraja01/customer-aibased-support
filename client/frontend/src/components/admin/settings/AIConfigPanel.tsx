import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Plug, Star, StarOff, Loader2, Cpu, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "ollama", label: "Ollama (Local)" },
  { value: "gemini", label: "Google Gemini (legacy)" },
  { value: "groq", label: "Groq" },
  { value: "google", label: "Google AI (Gemini)" },
  { value: "grok", label: "Grok (xAI)" },
  { value: "claude", label: "Claude (Anthropic)" },
];

interface AIConfig {
  _id: string;
  provider: string;
  model: string;
  display_name: string;
  enabled: boolean;
  default: boolean;
  apiKey: string | null;
  configured: boolean;
  configuration?: {
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
  };
}

const emptyForm = {
  provider: "google",
  model: "",
  display_name: "",
  apiKey: "",
  enabled: true,
  default: false,
  temperature: 0.7,
  max_tokens: 2048,
  system_prompt: "You are a helpful customer support assistant.",
};

export default function AIConfigPanel() {
  const toast = useToast();
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AIConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AIConfig | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.getAIConfigs();
      setConfigs(res.data.data || []);
    } catch {
      toast.error("Error", "Failed to load AI configurations");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setTestResult(null);
    setFormOpen(true);
  };

  const openEdit = (cfg: AIConfig) => {
    setEditing(cfg);
    setForm({
      provider: cfg.provider,
      model: cfg.model,
      display_name: cfg.display_name,
      apiKey: "",
      enabled: cfg.enabled,
      default: cfg.default,
      temperature: cfg.configuration?.temperature ?? 0.7,
      max_tokens: cfg.configuration?.max_tokens ?? 2048,
      system_prompt: cfg.configuration?.system_prompt || "You are a helpful customer support assistant.",
    });
    setTestResult(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.provider || !form.model || !form.display_name) {
      toast.error("Validation", "Provider, model, and display name are required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        provider: form.provider,
        model: form.model,
        display_name: form.display_name,
        enabled: form.enabled,
        default: form.default,
        configuration: {
          temperature: Number(form.temperature),
          max_tokens: Number(form.max_tokens),
          system_prompt: form.system_prompt,
        },
      };
      if (form.apiKey) payload.apiKey = form.apiKey;

      if (editing) {
        await AdminAPI.updateAIConfig(editing._id, payload);
        toast.success("Success", "AI provider updated");
      } else {
        await AdminAPI.createAIConfig(payload);
        toast.success("Success", "AI provider added");
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await AdminAPI.testAIConfig(id);
      const data = res.data.data;
      setTestResult({ id, status: data.status, error: data.error || "", latency: data.latencyMs });
      if (data.status === "healthy") {
        toast.success("Healthy", `Connection OK${data.latencyMs ? ` (${data.latencyMs}ms)` : ""}`);
      } else {
        toast.error("Connection failed", data.error || data.status);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleSetDefault = async (cfg: AIConfig) => {
    try {
      await AdminAPI.updateAIConfig(cfg._id, { default: !cfg.default });
      toast.success("Success", cfg.default ? "Default removed" : "Set as default model");
      load();
    } catch {
      toast.error("Error", "Failed to update default");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await AdminAPI.deleteAIConfig(deleteTarget._id);
      toast.success("Deleted", "AI provider removed");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Error", "Failed to delete provider");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading AI configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cpu size={18} className="text-primary" />
            AI Provider Configuration
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure which LLM provider powers your assistant. API keys are encrypted at rest and never returned to the client.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} className="mr-1" />
          Add Provider
        </Button>
      </div>

      {configs.length === 0 && (
        <div className="rounded-xl border border-dashed dark:border-white/[0.1] p-8 text-center text-sm text-muted-foreground">
          No AI providers configured yet. Add one to enable the assistant — the first enabled provider becomes the active model.
        </div>
      )}

      <div className="space-y-3">
        {configs.map((cfg) => (
          <div key={cfg._id} className="rounded-xl border dark:border-white/[0.06] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{cfg.display_name}</p>
                  <Badge variant={cfg.enabled ? "default" : "secondary"}>
                    {cfg.enabled ? "Active" : "Disabled"}
                  </Badge>
                  {cfg.default && <Badge variant="outline">Default</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono">{cfg.provider}</span>
                  <span className="opacity-40">/</span>
                  <span className="font-mono">{cfg.model}</span>
                  <span className="flex items-center gap-1">
                    <KeyRound size={11} />
                    {cfg.configured ? cfg.apiKey : "No API key"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleSetDefault(cfg)} title={cfg.default ? "Remove default" : "Set as default"}>
                  {cfg.default ? <StarOff size={14} /> : <Star size={14} />}
                  <span className="hidden sm:inline ml-1 text-xs">{cfg.default ? "Unset Default" : "Set Default"}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTest(cfg._id)} disabled={testingId === cfg._id}>
                  {testingId === cfg._id ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                  <span className="hidden sm:inline ml-1 text-xs">Test</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(cfg)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(cfg)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            {testResult?.id === cfg._id && (
              <div className={`mt-3 rounded-lg border p-3 text-xs ${
                testResult.status === "healthy"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}>
                <span className="font-semibold capitalize">{testResult.status}</span>
                {testResult.latency && ` · ${testResult.latency}ms`}
                {testResult.error && <span className="block mt-1 font-mono break-all">{testResult.error}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold mb-4">{editing ? "Edit AI Provider" : "Add AI Provider"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v ?? "" })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Display Name</Label>
                  <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Primary Assistant" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Model ID</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. gemini-2.0-flash, grok-3-mini, claude-sonnet-4-20250514" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>API Key {editing?.configured && <span className="text-xs text-muted-foreground">(leave blank to keep existing)</span>}</Label>
                <Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={editing?.configured ? "••••••••" : "Paste provider API key"} className="font-mono" />
                <p className="text-xs text-muted-foreground">Encrypted with AES-256 at rest. Never displayed in full.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Temperature</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Tokens</Label>
                  <Input type="number" min="1" value={form.max_tokens} onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>System Prompt</Label>
                <textarea
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono dark:border-white/[0.06]"
                />
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.enabled} onCheckedChange={(c) => setForm({ ...form, enabled: c })} />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.default} onCheckedChange={(c) => setForm({ ...form, default: c })} />
                  Set as default
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {editing ? "Save Changes" : "Add Provider"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove AI provider?"
        message={`This will remove "${deleteTarget?.display_name}" (${deleteTarget?.provider}/${deleteTarget?.model}). The assistant will fall back to the next enabled provider.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}