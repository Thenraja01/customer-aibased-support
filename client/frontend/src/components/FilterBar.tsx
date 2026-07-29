import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions = [],
  placeholder = "Search...",
  className = "",
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 400);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleClear = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 pr-8"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {onStatusChange && statusOptions.length > 0 && (
        <select
          value={statusFilter || ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
        >
          <option value="">All Status</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
