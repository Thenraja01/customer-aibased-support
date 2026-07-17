import { useState } from "react";
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
  Settings,
  Brain,
  Cpu,
  Thermometer,
  Hash,
  FileSearch,
  Save,
  RotateCcw,
  Play,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface AIConfig {
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  ragChunkSize: number;
  embeddingModel: string;
  topK: number;
  systemPrompt: string;
}

const DEFAULT_CONFIG: AIConfig = {
  defaultModel: "gpt-4o-mini",
  maxTokens: 2048,
  temperature: 0.7,
  ragChunkSize: 512,
  embeddingModel: "text-embedding-3-small",
  topK: 5,
  systemPrompt: "You are a helpful AI assistant for customer support.",
};

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", desc: "Most capable, highest cost" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast and cost-effective" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", desc: "Legacy, lowest cost" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", desc: "Anthropic's latest" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", desc: "Fast and affordable" },
];

const EMBEDDING_MODELS = [
  { id: "text-embedding-3-small", name: "OpenAI text-embedding-3-small" },
  { id: "text-embedding-3-large", name: "OpenAI text-embedding-3-large" },
  { id: "text-embedding-ada-002", name: "OpenAI text-embedding-ada-002" },
  { id: "nomic-embed-text", name: "Nomic Embed Text (Ollama)" },
];

const STORAGE_KEY = "ai_config_settings";

function loadConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function AIConfigurationPage() {
  const [config, setConfig] = useState<AIConfig>(loadConfig);
  const [saved, setSaved] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testing, setTesting] = useState(false);
  const [testHistory, setTestHistory] = useState<{ query: string; response: string; tokens: number; latency: number }[]>([]);

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleTestQuery = async () => {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResponse("");

    // Simulate AI response since we're mocking
    const latency = Math.floor(Math.random() * 800) + 400;
    const tokens = Math.floor(Math.random() * 300) + 50;

    await new Promise((r) => setTimeout(r, latency));

    const mockResponses = [
      `Based on the knowledge base, I can help you with that. Here's what I found regarding "${testQuery.slice(0, 30)}..."\n\nThe relevant information suggests that our product supports multiple integration options including REST APIs, WebSocket connections, and SDK implementations for Python, JavaScript, and Go.`,
      `Great question! Regarding "${testQuery.slice(0, 30)}..." - our documentation covers this in detail.\n\nKey points:\n• The system processes documents in real-time\n• Token limits can be configured per organization\n• RAG retrieval uses semantic similarity with configurable top-K`,
      `I'd be happy to assist with that query. Here's a comprehensive answer based on our knowledge base:\n\n"${testQuery.slice(0, 40)}" is covered under our standard support documentation. The recommended approach involves setting up the embedding pipeline first, then configuring the retrieval parameters.`,
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    setTestResponse(response);

    setTestHistory((prev) => [
      { query: testQuery, response, tokens, latency },
      ...prev.slice(0, 9),
    ]);

    setTesting(false);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
          <p className="text-muted-foreground">Configure global AI model settings and parameters.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle2 size={14} /> Saved
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save size={14} className="mr-1" /> Save Settings
          </Button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground bg-muted/30 dark:border-white/[0.06]">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Settings are stored locally in your browser. These are global defaults applied to all new AI
          sessions. Changes take effect immediately for new queries.
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain size={18} className="text-primary" /> Model Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Cpu size={14} className="text-muted-foreground" />
                Default LLM Model
              </label>
              <Select
                value={config.defaultModel}
                onValueChange={(v) => setConfig({ ...config, defaultModel: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">— {m.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Hash size={14} className="text-muted-foreground" />
                Max Tokens per Request
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={256}
                  max={8192}
                  step={256}
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <Input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                  className="w-24 text-center"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Higher values allow longer responses but increase cost.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Thermometer size={14} className="text-muted-foreground" />
                Temperature
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <Input
                  type="number"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                  className="w-24 text-center"
                  step={0.1}
                  min={0}
                  max={2}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lower = more focused, higher = more creative.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSearch size={18} className="text-secondary" /> RAG Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Embedding Model</label>
              <Select
                value={config.embeddingModel}
                onValueChange={(v) => setConfig({ ...config, embeddingModel: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select embedding model" />
                </SelectTrigger>
                <SelectContent>
                  {EMBEDDING_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Hash size={14} className="text-muted-foreground" />
                Chunk Size (tokens)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={128}
                  max={2048}
                  step={64}
                  value={config.ragChunkSize}
                  onChange={(e) => setConfig({ ...config, ragChunkSize: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <Input
                  type="number"
                  value={config.ragChunkSize}
                  onChange={(e) => setConfig({ ...config, ragChunkSize: Number(e.target.value) })}
                  className="w-24 text-center"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Size of text chunks used for embedding and retrieval.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Top K Results</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={config.topK}
                  onChange={(e) => setConfig({ ...config, topK: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <Input
                  type="number"
                  value={config.topK}
                  onChange={(e) => setConfig({ ...config, topK: Number(e.target.value) })}
                  className="w-24 text-center"
                  min={1}
                  max={20}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Number of relevant chunks to retrieve for each query.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              rows={4}
              placeholder="Enter the system prompt for AI responses..."
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Play size={18} className="text-green-500" /> Test Query
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter a test query to evaluate AI responses..."
                onKeyDown={(e) => e.key === "Enter" && handleTestQuery()}
                className="flex-1"
              />
              <Button onClick={handleTestQuery} disabled={testing || !testQuery.trim()}>
                {testing ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Play size={14} className="mr-1" />
                )}
                {testing ? "Testing..." : "Run Test"}
              </Button>
            </div>

            {testResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-4 bg-muted/30 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="text-xs">Response</Badge>
                  <span className="text-xs text-muted-foreground">
                    Model: {config.defaultModel} | Temp: {config.temperature}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
              </motion.div>
            )}

            {testHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Tests
                </p>
                {testHistory.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 dark:bg-white/[0.02]"
                  >
                    <span className="truncate max-w-[200px] text-muted-foreground">
                      {t.query}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{t.tokens} tokens</Badge>
                      <Badge variant="secondary" className="text-[10px]">{t.latency}ms</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings size={18} className="text-muted-foreground" /> Current Configuration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Model</span>
                <Badge variant="default">{config.defaultModel}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Max Tokens</span>
                <Badge variant="secondary">{config.maxTokens}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Temperature</span>
                <Badge variant="secondary">{config.temperature}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Embedding</span>
                <Badge variant="outline">{config.embeddingModel}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Chunk Size</span>
                <Badge variant="secondary">{config.ragChunkSize}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Top K</span>
                <Badge variant="secondary">{config.topK}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
