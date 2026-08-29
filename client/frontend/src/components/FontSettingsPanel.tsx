import { useFontSettings, type FontSize, type FontFamily } from "@/context/FontSettingsContext";
import { RotateCcw, Type, AlignLeft, LetterText, TextSelect, Check } from "lucide-react";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "X-Large" },
];

const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "system", label: "System" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
  { value: "dyslexic", label: "Dyslexic" },
];

const FONT_PREVIEW = "The quick brown fox jumps over the lazy dog. 1234567890";

export default function FontSettingsPanel() {
  const { settings, setFontSize, setFontFamily, setLineHeight, setLetterSpacing, resetToDefaults } = useFontSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Type size={14} />
          </span>
          Font Settings
        </div>
        <button
          type="button"
          onClick={resetToDefaults}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          <RotateCcw size={12} />
          Reset to Default
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TextSelect size={12} />
            Font Size
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {FONT_SIZE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFontSize(value)}
                className={`relative flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                  settings.fontSize === value
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {settings.fontSize === value && (
                  <Check size={10} className="absolute top-1 right-1 text-primary" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <LetterText size={12} />
            Font Family
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {FONT_FAMILY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFontFamily(value)}
                className={`relative flex items-center justify-center rounded-lg border px-1.5 py-2 text-xs font-medium transition-all ${
                  settings.fontFamily === value
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {settings.fontFamily === value && (
                  <Check size={10} className="absolute top-1 right-1 text-primary" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlignLeft size={12} />
            Line Height: {settings.lineHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
            aria-label="Line height"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1.0</span>
            <span>2.5</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className=" text-xs">A A</span>
            Letter Spacing: {settings.letterSpacing}px
          </label>
          <input
            type="range"
            min="-1"
            max="2"
            step="0.5"
            value={settings.letterSpacing}
            onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
            aria-label="Letter spacing"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>-1px</span>
            <span>2px</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase">Preview</p>
        <p
          className="text-sm"
          style={{
            fontFamily: "var(--font-family-custom)",
            lineHeight: "var(--line-height-custom)",
            letterSpacing: "var(--letter-spacing-custom)",
          }}
        >
          {FONT_PREVIEW}
        </p>
        <p
          className="text-xs text-muted-foreground"
          style={{
            fontFamily: "var(--font-family-custom)",
            lineHeight: "var(--line-height-custom)",
            letterSpacing: "var(--letter-spacing-custom)",
          }}
        >
          Adjust the settings above to customize your reading experience. These preferences are saved locally.
        </p>
      </div>
    </div>
  );
}
