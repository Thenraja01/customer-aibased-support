import { useState } from "react";
import { Sparkles, RotateCcw, Sliders, Palette, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import TenantAppLoader from "./TenantAppLoader";

export interface LoaderConfigState {
  enabled: boolean;
  title: string;
  subtitle: string;
  duration_ms: number;
  bg_theme: "dark" | "light" | "brand" | "glass";
}

interface TenantLoaderCustomizerProps {
  config: LoaderConfigState;
  onChange: (newConfig: LoaderConfigState) => void;
  brandColor?: string;
  secondaryColor?: string;
  orgName?: string;
}

export default function TenantLoaderCustomizer({
  config,
  onChange,
  brandColor = "#2563eb",
  secondaryColor = "#7c3aed",
  orgName = "SupportAI",
}: TenantLoaderCustomizerProps) {
  const [replayKey, setReplayKey] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const displayTitle = config.title.trim() || orgName;

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={18} /> Tenant Animated Splash Loader Studio
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the 3D staggered perspective opening animation displayed when customers or staff load the portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReplay}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <RotateCcw size={13} className="text-primary" /> Replay Animation
          </Button>
        </div>
      </div>

      {/* Live Sandbox Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase flex items-center gap-1.5 text-muted-foreground">
            <Eye size={13} className="text-primary" /> Live Interactive Preview Sandbox
          </Label>
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSkeleton}
                onChange={(e) => setShowSkeleton(e.target.checked)}
                className="rounded"
              />
              Background Skeleton Grid
            </label>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Theme: {config.bg_theme}
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 overflow-hidden bg-muted/20 shadow-inner relative">
          <TenantAppLoader
            key={replayKey}
            title={displayTitle}
            orgName={orgName}
            subtitle={config.subtitle}
            brandColor={brandColor}
            secondaryColor={secondaryColor}
            bgTheme={config.bg_theme}
            duration={config.duration_ms}
            isInlinePreview={true}
            skeletonMode={showSkeleton}
          />
        </div>
      </div>

      {/* Form Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase">Loader Main Title</Label>
          <Input
            value={config.title}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            placeholder={orgName || "e.g. Supernova AI"}
            className="text-xs font-semibold"
          />
          <p className="text-[11px] text-muted-foreground">
            Leave blank to automatically use your organization name ({orgName}).
          </p>
        </div>

        {/* Subtitle Words */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase">Loader Subtitle / Tagline</Label>
          <Input
            value={config.subtitle}
            onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
            placeholder="Build fast, ship faster"
            className="text-xs font-medium"
          />
          <p className="text-[11px] text-muted-foreground">
            Each word drops with animated perspective delay.
          </p>
        </div>

        {/* Background Theme Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase flex items-center gap-1.5">
            <Palette size={13} className="text-primary" /> Backdrop Style & Contrast
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "dark", label: "Midnight Dark" },
              { id: "light", label: "Daylight Clean" },
              { id: "brand", label: "Brand Gradient" },
              { id: "glass", label: "Frosted Glass" },
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => onChange({ ...config, bg_theme: th.id as any })}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                  config.bg_theme === th.id
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span>{th.label}</span>
                {config.bg_theme === th.id && <Check size={12} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Slider */}
        <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase flex items-center gap-1.5">
              <Sliders size={13} className="text-primary" /> Splash Duration
            </Label>
            <span className="font-mono text-xs font-bold text-primary">
              {(config.duration_ms / 1000).toFixed(1)} seconds
            </span>
          </div>
          <input
            type="range"
            min="1200"
            max="4000"
            step="200"
            value={config.duration_ms}
            onChange={(e) => onChange({ ...config, duration_ms: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
          <p className="text-[10px] text-muted-foreground">
            Controls how long the intro animation is visible before smoothly revealing the portal.
          </p>
        </div>
      </div>
    </div>
  );
}
