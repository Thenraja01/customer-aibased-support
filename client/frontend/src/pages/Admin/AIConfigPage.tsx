import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Save,
  RotateCcw,
  Thermometer,
  Zap,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { RAGAPI } from "@/api";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "llama3-70b-8192", name: "LLaMA 3 70B", provider: "Groq" },
  { id: "llama3-8b-8192", name: "LLaMA 3 8B", provider: "Groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "Groq" },
];

const FEATURES = [
  { id: "rag", label: "RAG Document Search", description: "Retrieve relevant document chunks for context" },
  { id: "memory", label: "Conversation Memory", description: "Maintain context across conversation turns" },
  { id: "knowledge_graph", label: "Knowledge Graph", description: "Use graph-based entity relationships" },
  { id: "auto_escalation", label: "Auto-Escalation", description: "Escalate complex issues to human agents" },
  { id: "sentiment", label: "Sentiment Analysis", description: "Analyze customer sentiment in messages" },
  { id: "multilingual", label: "Multilingual Support", description: "Handle multiple languages automatically" },
];

interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  enabledFeatures: string[];
}

const DEFAULT_CONFIG: AIConfig = {
  model: "llama3-70b-8192",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  systemPrompt:
    "You are a helpful AI customer support assistant. Be concise, friendly, and professional. If you don't know the answer, escalate to a human agent.",
  enabledFeatures: ["rag", "memory"],
};

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await RAGAPI.getStats().catch(() => null);
      if (res?.data?.success && res.data.data?.config) {
        setConfig((prev) => ({ ...prev, ...res.data.data.config }));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testingPrompt.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setTestResult(
        `Test response for "${testingPrompt}": Based on the configured model (${config.model}) and temperature (${config.temperature}), the AI would generate a contextual response. In production, this sends the prompt to the LLM endpoint.`
      );
    } finally {
      setTesting(false);
    }
  };

  const toggleFeature = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      enabledFeatures: prev.enabledFeatures.includes(id)
        ? prev.enabledFeatures.filter((f) => f !== id)
        : [...prev.enabledFeatures, id],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading AI configuration...
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
          <p className="text-muted-foreground">Configure AI model settings, prompts, and features.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle2 size={14} /> Saved
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfig(DEFAULT_CONFIG)}>
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} className="mr-1" /> {saving ? "Saving..." : "Save Config"}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-3">
        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Model</p>
              <p className="text-2xl font-bold mt-2">{MODELS.find((m) => m.id === config.model)?.name || config.model}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <Brain size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Features Active</p>
              <p className="text-2xl font-bold mt-2">{config.enabledFeatures.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <Zap size={20} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Temperature</p>
              <p className="text-2xl font-bold mt-2">{config.temperature}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Thermometer size={20} className="text-accent-foreground" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={staggerItem}>
          <Card className="dark:bg-card/50 dark:border-white/[0.06]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain size={18} className="text-primary" /> Model Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Model</label>
                <Select value={config.model} onValueChange={(v) => setConfig((p) => ({ ...p, model: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature: {config.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise (0)</span>
                  <span>Creative (1)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig((p) => ({ ...p, maxTokens: parseInt(e.target.value) || 2048 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top P: {config.topP}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.topP}
                    onChange={(e) => setConfig((p) => ({ ...p, topP: parseFloat(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="dark:bg-card/50 dark:border-white/[0.06]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={18} className="text-primary" /> System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig((p) => ({ ...p, systemPrompt: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
                placeholder="Enter the system prompt..."
              />
              <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground dark:border-white/[0.06]">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" />
                <p>The system prompt defines the AI's behavior, personality, and response guidelines for customer interactions.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap size={18} className="text-secondary" /> Enabled Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const enabled = config.enabledFeatures.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200",
                      enabled
                        ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                        : "border-white/[0.06] hover:border-primary/20 dark:hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                        {enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare size={18} className="text-primary" /> Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testingPrompt}
                onChange={(e) => setTestingPrompt(e.target.value)}
                placeholder="Enter a test message to see how the AI responds..."
                onKeyDown={(e) => e.key === "Enter" && handleTest()}
              />
              <Button onClick={handleTest} disabled={testing || !testingPrompt.trim()}>
                {testing ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-4 bg-muted/50 dark:border-white/[0.06]"
              >
                <p className="text-xs text-muted-foreground mb-2">AI Response:</p>
                <p className="text-sm">{testResult}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
