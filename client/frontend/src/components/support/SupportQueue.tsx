import React, { useState } from "react";
import { UserCheck, Clock, CheckCircle2, AlertTriangle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupportFilters, SupportFilterValues } from "./SupportFilters";
import { SLAIndicator } from "./SLAIndicator";

interface SupportQueueProps {
  conversations: any[];
  selectedId?: string;
  onSelect: (conv: any) => void;
  onAcceptHandoff?: (conv: any) => void;
  loading?: boolean;
  showBranchFilter?: boolean;
  branches?: any[];
  agents?: any[];
}

export const SupportQueue: React.FC<SupportQueueProps> = ({
  conversations,
  selectedId,
  onSelect,
  onAcceptHandoff,
  loading = false,
  showBranchFilter = false,
  branches = [],
  agents = [],
}) => {
  const [activeTab, setActiveTab] = useState<"waiting" | "active" | "escalated" | "resolved">("waiting");
  const [filters, setFilters] = useState<SupportFilterValues>({
    search: "",
    status: "all",
    priority: "all",
    agentId: "all",
    branchId: "all",
    category: "all",
  });

  const handleFilterChange = (updated: Partial<SupportFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      agentId: "all",
      branchId: "all",
      category: "all",
    });
  };

  // Categorize
  const waitingChats = conversations.filter(
    (c) =>
      c.status === "escalated" ||
      c.status === "HUMAN_QUEUED" ||
      c.status === "waiting_for_agent" ||
      (c.is_escalated && c.status === "open")
  );
  const activeChats = conversations.filter(
    (c) => c.status === "in_progress" || c.status === "HUMAN_ACTIVE"
  );
  const escalatedChats = conversations.filter(
    (c) => c.is_escalated || c.status === "escalated"
  );
  const resolvedChats = conversations.filter(
    (c) => c.status === "closed" || c.status === "HUMAN_RESOLVED" || c.status === "CONVERTED_TO_TICKET"
  );

  let currentTabChats =
    activeTab === "waiting"
      ? waitingChats
      : activeTab === "active"
      ? activeChats
      : activeTab === "escalated"
      ? escalatedChats
      : resolvedChats;

  // Apply search & filters
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    currentTabChats = currentTabChats.filter((c) => {
      const name = c.user_id?.name || c.customer_name || "";
      const topic = c.topic || c.subject || "";
      const id = c._id || "";
      return (
        name.toLowerCase().includes(q) ||
        topic.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q)
      );
    });
  }

  if (filters.priority !== "all") {
    currentTabChats = currentTabChats.filter(
      (c) => (c.priority || "medium").toLowerCase() === filters.priority
    );
  }

  if (filters.branchId !== "all") {
    currentTabChats = currentTabChats.filter(
      (c) => (c.branch_id?._id || c.branch_id) === filters.branchId
    );
  }

  if (filters.agentId !== "all") {
    if (filters.agentId === "unassigned") {
      currentTabChats = currentTabChats.filter((c) => !c.agent_id);
    } else {
      currentTabChats = currentTabChats.filter(
        (c) => (c.agent_id?._id || c.agent_id) === filters.agentId
      );
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-card/40 divide-y dark:divide-white/[0.05]">
      {/* Category Tabs */}
      <div className="p-2.5 grid grid-cols-4 gap-1 bg-muted/40 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab("waiting")}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "waiting"
              ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Waiting</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.2 rounded-full">
            {waitingChats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Active</span>
          <span className="bg-white/20 text-[9px] px-1.5 py-0.2 rounded-full">
            {activeChats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("escalated")}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "escalated"
              ? "bg-rose-500 text-white font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Escalated</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.2 rounded-full">
            {escalatedChats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("resolved")}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "resolved"
              ? "bg-muted text-foreground font-bold border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Done</span>
        </button>
      </div>

      {/* Filter Component */}
      <SupportFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        showBranchFilter={showBranchFilter}
        branches={branches}
        agents={agents}
      />

      {/* List items */}
      <div className="flex-1 overflow-y-auto divide-y dark:divide-white/[0.05]">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading queue...
          </div>
        ) : currentTabChats.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <UserCheck size={32} className="mx-auto text-muted-foreground/30" />
            <p className="text-xs font-semibold text-muted-foreground">
              No {activeTab} conversations found
            </p>
          </div>
        ) : (
          currentTabChats.map((chat) => {
            const isSelected = selectedId === chat._id;
            const customerName =
              chat.user_id?.name || chat.customer_name || `Customer #${chat._id.slice(-6)}`;
            const topic = chat.topic || "Support Handoff";
            const branchName = chat.branch_id?.name || "";

            return (
              <div
                key={chat._id}
                onClick={() => onSelect(chat)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-muted/60 space-y-1.5 ${
                  isSelected ? "bg-muted border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs truncate">{customerName}</span>
                  <SLAIndicator createdAt={chat.created_at} compact />
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">{topic}</p>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    {branchName && (
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                        {branchName}
                      </span>
                    )}
                    <span>{new Date(chat.created_at || Date.now()).toLocaleTimeString()}</span>
                  </div>

                  {activeTab === "waiting" && onAcceptHandoff && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptHandoff(chat);
                      }}
                      size="sm"
                      className="h-6 text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 shadow-sm"
                    >
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
