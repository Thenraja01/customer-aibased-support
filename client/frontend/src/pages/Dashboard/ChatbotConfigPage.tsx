import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Save, MessageSquare, Layout, Palette, CheckCircle2, Shield, Eye } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import AxiosInstance from "@/api/axiosInstance";

export default function ChatbotConfigPage() {
  const { user, orgSettings } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [botName, setBotName] = useState(orgSettings?.chatbot_name || "Support AI");
  const [greetingMessage, setGreetingMessage] = useState(
    orgSettings?.greeting_message || "Hello! How can I help you today?"
  );
  const [position, setPosition] = useState<"right" | "left">(
    (orgSettings?.widget_position as "right" | "left") || "right"
  );
  const [theme, setTheme] = useState<"dark" | "light">(
    (orgSettings?.widget_theme as "dark" | "light") || "dark"
  );
  const [primaryColor, setPrimaryColor] = useState(
    orgSettings?.brand_colors?.primary || "#2563eb"
  );
  const [enabled, setEnabled] = useState(orgSettings?.widget_enabled ?? true);

  useEffect(() => {
    if (orgSettings) {
      if (orgSettings.chatbot_name) setBotName(orgSettings.chatbot_name);
      if (orgSettings.greeting_message) setGreetingMessage(orgSettings.greeting_message);
      if (orgSettings.widget_position) setPosition(orgSettings.widget_position as any);
      if (orgSettings.widget_theme) setTheme(orgSettings.widget_theme as any);
      if (orgSettings.brand_colors?.primary) setPrimaryColor(orgSettings.brand_colors.primary);
      if (orgSettings.widget_enabled !== undefined) setEnabled(orgSettings.widget_enabled);
    }
  }, [orgSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AxiosInstance.put("/organization/settings", {
        chatbot_name: botName,
        greeting_message: greetingMessage,
        widget_position: position,
        widget_theme: theme,
        widget_enabled: enabled,
        brand_colors: {
          ...orgSettings?.brand_colors,
          primary: primaryColor,
        },
      });
      toast.success("Settings Saved", "Chatbot configuration updated successfully.");
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to update chatbot configuration.");
    } finally {
      setSaving(false);
    }
  };

  const [testInput, setTestInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<Array<{ text: string; isUser: boolean; citation?: string }>>([]);

  const handleSendTestMessage = () => {
    if (!testInput.trim()) return;
    const userMsg = testInput;
    setPreviewMessages((prev) => [...prev, { text: userMsg, isUser: true }]);
    setTestInput("");

    setTimeout(() => {
      setPreviewMessages((prev) => [
        ...prev,
        {
          text: `This is an automated preview response from ${botName || "Support AI"} generated using your configured brand theme and greeting settings.`,
          isUser: false,
          citation: "📄 Knowledge_Base_Guide.pdf",
        },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chatbot Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how your AI support assistant looks and behaves on your website.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Settings Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* General Branding */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Bot className="text-primary" size={20} />
              <h3 className="font-bold text-base">Identity & Messaging</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. Acme Support AI"
                  className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Welcome Greeting Message
                </label>
                <textarea
                  rows={3}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="e.g. Hi! How can I help you today?"
                  className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* Appearance & Layout */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Layout className="text-primary" size={20} />
              <h3 className="font-bold text-base">Widget Layout & Theme</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Screen Position
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPosition("right")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      position === "right"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Right Corner
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition("left")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      position === "left"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Left Corner
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Enable Embedded Widget</h4>
                <p className="text-xs text-muted-foreground">Allow external website visitors to load and chat with this bot.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Interactive Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              Live Interactive Emulator
            </div>
            {previewMessages.length > 0 && (
              <button onClick={() => setPreviewMessages([])} className="text-xs text-primary hover:underline">
                Reset Preview
              </button>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative min-h-[500px] flex flex-col justify-end overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />

            {/* Floating Widget Launcher Preview */}
            <div
              className={`absolute bottom-6 ${
                position === "right" ? "right-6" : "left-6"
              } transition-all duration-300`}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageSquare size={24} />
              </div>
            </div>

            {/* Widget Modal Window Preview */}
            <div
              className={`w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl bg-slate-900 text-slate-100 overflow-hidden flex flex-col h-[420px] mb-16 ${
                position === "right" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  {botName || "Support AI"}
                </div>
                <span className="text-slate-400 text-xs font-mono">V1 Widget</span>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                <div className="p-3.5 rounded-2xl bg-slate-800 text-xs leading-relaxed max-w-[85%] rounded-bl-xs text-slate-200">
                  {greetingMessage || "Hello! How can I help you today?"}
                </div>

                {previewMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                      msg.isUser
                        ? "ml-auto rounded-br-xs text-white"
                        : "bg-slate-800 rounded-bl-xs text-slate-200"
                    }`}
                    style={msg.isUser ? { backgroundColor: primaryColor } : undefined}
                  >
                    <p>{msg.text}</p>
                    {msg.citation && (
                      <div className="pt-1.5 mt-1 border-t border-slate-700 text-[10px] text-slate-400">
                        {msg.citation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendTestMessage()}
                  placeholder="Test live preview response..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                />
                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  className="p-2 rounded-xl text-white opacity-90 hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
