import { Palette, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandingPanelProps {
  form: any;
  updateField: (path: string, value: any) => void;
}

export default function BrandingPanel({ form, updateField }: BrandingPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const colors = form.brand_colors || { primary: "#2563eb", secondary: "#7c3aed", accent: "#f59e0b" };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette size={18} className="text-primary" />
          Branding
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Brand colors and logo used across the customer-facing assistant.
        </p>
      </div>

      <div className="space-y-1.5 max-w-md">
        <Label>Logo URL</Label>
        <Input value={form.logo?.url || ""} onChange={(e) => updateField("logo.url", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Palette size={16} className="text-primary" />
            Brand Colors
          </h4>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5 text-xs">
            <Eye size={14} />
            {showPreview ? "Hide Preview" : "Live Preview"}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg">
          {(["primary", "secondary", "accent"] as const).map((color) => (
            <div key={color} className="flex items-center gap-3">
              <input
                type="color"
                value={colors[color] || "#000000"}
                onChange={(e) => updateField(`brand_colors.${color}`, e.target.value)}
                className="w-10 h-10 rounded-md border cursor-pointer"
              />
              <div className="flex-1">
                <Label className="capitalize text-xs">{color}</Label>
                <Input
                  value={colors[color] || ""}
                  onChange={(e) => updateField(`brand_colors.${color}`, e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPreview && (
        <div className="rounded-xl border dark:border-white/[0.06] p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Live Preview</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
            >
              {form.logo?.url ? "✓" : "AI"}
            </div>
            <div className="flex-1 h-9 rounded-lg border px-3 text-xs text-muted-foreground flex items-center">
              {form.chatbot_name || "Support AI"} greeting preview
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}