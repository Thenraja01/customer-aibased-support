import { useId } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function Switch({ checked, onCheckedChange, disabled, loading, id: externalId, "aria-label": ariaLabel }: SwitchProps) {
  const generatedId = useId();
  const id = externalId || generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        checked ? "bg-emerald-500" : "bg-muted-foreground/30",
        (disabled || loading) && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled || loading}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
        aria-checked={checked}
        aria-label={ariaLabel}
      />
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
          loading && "animate-pulse"
        )}
      />
    </label>
  );
}
