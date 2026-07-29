import { useState, useRef, useEffect } from "react";
import { useFontSettings, type FontSize } from "@/context/FontSettingsContext";

const SIZE_CLASSES: Record<FontSize, string> = {
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
  "x-large": "text-lg",
};

export default function FontSizeToggle() {
  const { settings, setFontSize } = useFontSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const options: FontSize[] = ["small", "medium", "large", "x-large"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={`Font size: ${settings.fontSize}`}
        aria-expanded={open}
      >
        <span className={`font-bold ${SIZE_CLASSES[settings.fontSize]}`}>A</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border bg-card shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Font Size</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {options.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { setFontSize(size); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  settings.fontSize === size
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={`font-bold ${SIZE_CLASSES[size]} w-6 text-center`}>A</span>
                <span className="capitalize">{size.replace("-", " ")}</span>
                {settings.fontSize === size && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
