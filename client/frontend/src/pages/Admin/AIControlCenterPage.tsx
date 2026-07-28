import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  Bot,
  Shield,
  Play,
  History,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminAPI } from "@/api/admin.api";
import AxiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/toast";

type Tab = "prompt" | "settings" | "guardrails" | "playground";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "prompt", label: "Prompt Editor", icon: Bot },
  { id: "settings", label: "AI Settings", icon: Sparkles },
  { id: "guardrails", label: "Guardrails", icon: Shield },
  { id: "playground", label: "Playground", icon: Play },
];

const DEFAULT_GUARDRAILS = [
  "Answer only from approved documents",
  "Don't answer unrelated questions",
  "Always cite document sources",
  "Escalate to a ticket if confidence is low",
];

export default function AIControlCenterPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("prompt");
  const [promptData, setPromptData] = useState<any>({ published: null, draft: null, customPrompt: "" });
  const [draftText, setDraftText] = useState("");
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AI Settings form
  const [aiSettings, setAiSettings] = useState<any>({
    temperature: 0.7,
    top_k: 40,
    similarity_threshold: 0.75,
    max_tokens: 2048,
    response_style: "balanced",
  });

  // Guardrails
  const [guardrails, setGuardrails] = useState<Array<{ rule: string; enabled: boolean }>>(
    DEFAULT_GUARDRAILS.map((r) => ({ rule: r, enabled: true }))
  );

  // Playground
  const [testQuestion, setTestQuestion] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promptRes, historyRes, settingsRes] = await Promise.all([
        AxiosInstance.get("/admin/v1/prompt"),
        AxiosInstance.get("/admin/v1/prompt/history"),
        AdminAPI.getOrgSettings(),
      ]);

      if (promptRes.data.success) {
        setPromptData(promptRes.data.data);
        setDraftText(promptRes.data.data.draft?.system_prompt || promptRes.data.data.customPrompt || "");
      }
      if (historyRes.data.success) setVersionHistory(historyRes.data.data);
      if (settingsRes.data.success) {
        if (settingsRes.data.data.ai_settings) setAiSettings(settingsRes.data.data.ai_settings);
        if (settingsRes.data.data.guardrails?.length) setGuardrails(settingsRes.data.data.guardrails);
      }
    } catch {
      toast.error("Error", "Failed to load AI configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await AxiosInstance.post("/admin/v1/prompt/draft", { system_prompt: draftText });
      toast.success("Success", "Draft saved");
      loadData();
    } catch {
      toast.error("Error", "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const publishPrompt = async () => {
    setSaving(true);
    try {
      await AxiosInstance.post("/admin/v1/prompt/publish");
      toast.success("Success", "Prompt published successfully");
      loadData();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const rollbackPrompt = async (version: number) => {
    if (!confirm(`Rollback to version ${version}? Current draft will be overwritten.`)) return;
    setSaving(true);
    try {
      await AxiosInstance.post(`/admin/v1/prompt/rollback/${version}`);
      toast.success("Success", `Rolled back to version ${version}`);
      loadData();
    } catch {
      toast.error("Error", "Failed to rollback");
    } finally {
      setSaving(false);
    }
  };

  const saveAiSettings = async () => {
    setSaving(true);
    try {
      await AdminAPI.updateOrgSettings({ ai_settings: aiSettings });
      toast.success("Success", "AI settings saved");
    } catch {
      toast.error("Error", "Failed to save AI settings");
    } finally {
      setSaving(false);
    }
  };

  const saveGuardrails = async () => {
    setSaving(true);
    try {
      await AdminAPI.updateOrgSettings({ guardrails });
      toast.success("Success", "Guardrails saved");
    } catch {
      toast.error("Error", "Failed to save guardrails");
    } finally {
      setSaving(false);
    }
  };

  const testPrompt = async () => {
    if (!testQuestion.trim()) return;
    setTestLoading(true);
    setTestResponse("");
    try {
      const res = await AxiosInstance.post("/rag/query", {
        query: testQuestion,
        chatId: "test-playground",
      });
      const data = res.data.data;
      if (!data || data.document_results?.length === 0) {
        setTestResponse("No matching documents found. Try ingesting documents first or adjust your query / similarity threshold.");
      } else {
        const parts = [`Found ${data.total} result(s):`, ""];
        data.document_results?.forEach((d: any, i: number) => {
          const score = (d.score * 100).toFixed(0);
          parts.push(`[${i + 1}] (${score}% match) ${d.content?.substring(0, 300)}`);
        });
        if (data.memory_context) {
          parts.push("", "--- Memory Context ---", data.memory_context);
        }
        setTestResponse(parts.join("\n"));
      }
    } catch (err: any) {
      setTestResponse(`Error: ${err?.response?.data?.message || err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading AI Control Center...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="text-primary" size={28} />
          AI Control Center
        </h1>
        <p className="text-muted-foreground">Manage prompts, AI behavior, guardrails, and test responses.</p>
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
        {activeTab === "prompt" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">System Prompt</h3>
                <p className="text-sm text-muted-foreground">
                  {promptData.published
                    ? `Published v${promptData.published.version}`
                    : "No published version"}
                  {promptData.draft ? ` · Draft v${promptData.draft.version} unsaved` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  <History size={14} className="mr-1" />
                  History
                </Button>
                <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
                  <Save size={14} className="mr-1" />
                  Save Draft
                </Button>
                <Button size="sm" onClick={publishPrompt} disabled={saving}>
                  <CheckCircle2 size={14} className="mr-1" />
                  Publish
                </Button>
              </div>
            </div>

            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono dark:border-white/[0.06] leading-relaxed"
              placeholder="Enter system prompt for the AI..."
            />

            {showHistory && (
              <div className="rounded-lg border dark:border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Version History</h4>
                  <button onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    Close
                  </button>
                </div>
                <div className="divide-y dark:divide-white/[0.04] max-h-64 overflow-y-auto">
                  {versionHistory.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">No versions yet</div>
                  ) : (
                    versionHistory.map((v: any) => (
                      <div key={v._id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            v{v.version}
                            <span
                              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                v.status === "published"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                              }`}
                            >
                              {v.status}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.published_by?.name || v.created_by?.name || "Unknown"} ·{" "}
                            {new Date(v.published_at || v.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {v.status === "published" && (
                          <Button variant="outline" size="sm" onClick={() => rollbackPrompt(v.version)}>
                            <RotateCcw size={12} className="mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">AI Configuration</h3>
              <p className="text-sm text-muted-foreground">Control how the AI behaves when responding to users.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Temperature ({aiSettings.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise (0)</span>
                  <span>Creative (2)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Top-K ({aiSettings.top_k})</Label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={aiSettings.top_k}
                  onChange={(e) => setAiSettings({ ...aiSettings, top_k: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused (1)</span>
                  <span>Diverse (100)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Similarity Threshold ({aiSettings.similarity_threshold})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiSettings.similarity_threshold}
                  onChange={(e) => setAiSettings({ ...aiSettings, similarity_threshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Loose (0)</span>
                  <span>Strict (1)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Max Tokens ({aiSettings.max_tokens})</Label>
                <input
                  type="range"
                  min="64"
                  max="8192"
                  step="64"
                  value={aiSettings.max_tokens}
                  onChange={(e) => setAiSettings({ ...aiSettings, max_tokens: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short (64)</span>
                  <span>Long (8192)</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Response Style</Label>
              <select
                value={aiSettings.response_style}
                onChange={(e) => setAiSettings({ ...aiSettings, response_style: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
              >
                <option value="concise">Concise — Short, direct answers</option>
                <option value="balanced">Balanced — Moderate detail</option>
                <option value="detailed">Detailed — Comprehensive explanations</option>
              </select>
            </div>

            <Button onClick={saveAiSettings} disabled={saving}>
              <Save size={14} className="mr-1" />
              {saving ? "Saving..." : "Save AI Settings"}
            </Button>
          </div>
        )}

        {activeTab === "guardrails" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">AI Guardrails</h3>
              <p className="text-sm text-muted-foreground">
                Set boundaries for the AI assistant. Enabled guardrails are injected into the system prompt.
              </p>
            </div>

            <div className="space-y-3">
              {guardrails.map((g, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border dark:border-white/[0.06]">
                  <input
                    type="checkbox"
                    checked={g.enabled}
                    onChange={(e) => {
                      const updated = [...guardrails];
                      updated[i] = { ...updated[i], enabled: e.target.checked };
                      setGuardrails(updated);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <input
                    value={g.rule}
                    onChange={(e) => {
                      const updated = [...guardrails];
                      updated[i] = { ...updated[i], rule: e.target.value };
                      setGuardrails(updated);
                    }}
                    className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0"
                    placeholder="Enter guardrail rule..."
                  />
                  <button
                    onClick={() => setGuardrails(guardrails.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuardrails([...guardrails, { rule: "", enabled: true }])}
              >
                + Add Guardrail
              </Button>
            </div>

            <Button onClick={saveGuardrails} disabled={saving}>
              <Save size={14} className="mr-1" />
              {saving ? "Saving..." : "Save Guardrails"}
            </Button>
          </div>
        )}

        {activeTab === "playground" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">AI Playground</h3>
              <p className="text-sm text-muted-foreground">
                Test a question against the AI before publishing changes. Uses the current draft prompt.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Test Question</Label>
              <div className="flex gap-2">
                <input
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && testPrompt()}
                  placeholder="Type a question to test..."
                  className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
                />
                <Button onClick={testPrompt} disabled={testLoading}>
                  <Send size={14} className="mr-1" />
                  {testLoading ? "Thinking..." : "Send"}
                </Button>
              </div>
            </div>

            {testResponse && (
              <div className="rounded-lg border dark:border-white/[0.06] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className="text-primary" />
                  <span className="text-sm font-medium">
                    {testResponse.startsWith("No matching") ? "No Results" : "RAG Retrieval Output"}
                  </span>
                </div>
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">{testResponse}</pre>
              </div>
            )}

            {!testResponse && !testLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Play size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">Enter a question and hit Send to test the AI response.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
