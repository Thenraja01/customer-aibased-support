import { Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatbotPanelProps {
  form: any;
  updateField: (path: string, value: any) => void;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
];

export default function ChatbotPanel({ form, updateField }: ChatbotPanelProps) {
  const ai = form.ai_settings || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          Chatbot
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Name, language, greeting, and AI generation behavior of your assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="space-y-1.5">
          <Label>Chatbot Name</Label>
          <Input value={form.chatbot_name} onChange={(e) => updateField("chatbot_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default Language</Label>
          <select
            value={form.default_language}
            onChange={(e) => updateField("default_language", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5 max-w-2xl">
        <Label>Greeting Message</Label>
        <textarea
          value={form.greeting_message}
          onChange={(e) => updateField("greeting_message", e.target.value)}
          rows={2}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
        />
      </div>

      <div className="border-t dark:border-white/[0.06] pt-6">
        <h4 className="text-sm font-semibold mb-4">AI Generation Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          <div className="space-y-1.5">
            <Label className="text-xs">Temperature</Label>
            <Input type="number" step="0.1" min="0" max="2" value={ai.temperature ?? 0.7} onChange={(e) => updateField("ai_settings.temperature", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Tokens</Label>
            <Input type="number" min="1" value={ai.max_tokens ?? 2048} onChange={(e) => updateField("ai_settings.max_tokens", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Top K</Label>
            <Input type="number" min="1" value={ai.top_k ?? 40} onChange={(e) => updateField("ai_settings.top_k", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Similarity Threshold</Label>
            <Input type="number" step="0.05" min="0" max="1" value={ai.similarity_threshold ?? 0.75} onChange={(e) => updateField("ai_settings.similarity_threshold", Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5 mt-4 max-w-2xl">
          <Label className="text-xs">Response Style</Label>
          <select
            value={ai.response_style || "balanced"}
            onChange={(e) => updateField("ai_settings.response_style", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      <div className="border-t dark:border-white/[0.06] pt-6 max-w-2xl">
        <h4 className="text-sm font-semibold mb-3">Custom System Prompt</h4>
        <textarea
          value={form.customPrompt}
          onChange={(e) => updateField("customPrompt", e.target.value)}
          rows={5}
          placeholder="Enter custom system prompt instructions for the AI..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono dark:border-white/[0.06]"
        />
        <p className="text-xs text-muted-foreground">Use {'{ORGANIZATION_NAME}'} as a placeholder for the org name.</p>
      </div>
    </div>
  );
}