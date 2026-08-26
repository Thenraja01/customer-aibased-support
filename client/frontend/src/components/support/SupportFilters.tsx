import React from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SupportFilterValues {
  search: string;
  status: string;
  priority: string;
  agentId: string;
  branchId: string;
  category: string;
}

interface SupportFiltersProps {
  filters: SupportFilterValues;
  onFilterChange: (updated: Partial<SupportFilterValues>) => void;
  onReset: () => void;
  showBranchFilter?: boolean;
  branches?: any[];
  agents?: any[];
  categories?: string[];
}

export const SupportFilters: React.FC<SupportFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showBranchFilter = false,
  branches = [],
  agents = [],
  categories = ["Billing", "Technical", "Payment", "General", "Escalated"],
}) => {
  return (
    <div className="p-3 border-b bg-card/40 space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search by customer, topic, ID..."
          className="w-full pl-8 pr-3 py-1.5 bg-background border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter Selects Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="bg-background border rounded px-2 py-1 text-xs focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="waiting">Waiting / Queued</option>
          <option value="active">Active / In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved / Closed</option>
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
          className="bg-background border rounded px-2 py-1 text-xs focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="high">High / Critical</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Branch (Admin Only) */}
        {showBranchFilter && (
          <select
            value={filters.branchId}
            onChange={(e) => onFilterChange({ branchId: e.target.value })}
            className="bg-background border rounded px-2 py-1 text-xs focus:outline-none col-span-2"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                🏢 {b.name}
              </option>
            ))}
          </select>
        )}

        {/* Agent Filter */}
        {agents.length > 0 && (
          <select
            value={filters.agentId}
            onChange={(e) => onFilterChange({ agentId: e.target.value })}
            className="bg-background border rounded px-2 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>
                👤 {a.name}
              </option>
            ))}
          </select>
        )}

        {/* Reset Button */}
        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 justify-center col-span-1"
        >
          <RefreshCw size={12} />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};
