import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import CreateTicketDialog from "@/components/ticket/CreateTicketDialog";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

const statusFilters = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_for_customer", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "open": return "badge-open";
    case "in_progress": return "badge-in-progress";
    case "waiting_for_customer": return "badge-waiting";
    case "resolved": return "badge-resolved";
    default: return "badge-closed";
  }
};

const getPriorityStyle = (priority: string) => {
  if (priority === "urgent" || priority === "high") return "badge-urgent";
  if (priority === "medium") return "surface-warning";
  return "bg-muted text-muted-foreground";
};

export default function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, loading, loadUserTickets, loadAllTickets } = useTickets();

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isSupport = user?.role === "support" || user?.roleName === "support" || user?.role_id?.role_name === "support";

  useEffect(() => {
    if (isSupport) {
      loadAllTickets();
    } else if (user?._id) {
      loadUserTickets();
    }
  }, [isSupport, user, loadAllTickets, loadUserTickets]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t: any) => !statusFilter || t.status === statusFilter)
      .filter((t: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (t.subject || t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
        );
      });
  }, [tickets, statusFilter, searchQuery]);

  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div 
              className="cursor-pointer"
              onClick={() => navigate(isSupport ? `/support/tickets/${t._id}` : `/tickets/${t._id}`)}
            >
              <p className="font-medium truncate max-w-[300px]">{t.subject || t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{t.description}</p>
              )}
            </div>
          );
        },
      }
    ];

    if (isSupport) {
      cols.push({
        accessorKey: "user_id.name",
        header: "Customer",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-[13px]">
            {row.original.user_id?.name || "—"}
          </span>
        ),
      });
    }

    cols.push({
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        if (!priority) return null;
        return (
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", getPriorityStyle(priority))}>
            {priority}
          </span>
        );
      },
    });

    cols.push({
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", getStatusStyle(status))}>
            {status?.replace("_", " ")}
          </span>
        );
      },
    });

    cols.push({
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        return <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleDateString()}</span>;
      },
    });

    return cols;
  }, [isSupport, navigate]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold ">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSupport ? "Manage all support tickets" : "View and track your support tickets"}
          </p>
        </div>
        {!isSupport && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus size={16} />
            New Ticket
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                statusFilter === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        {loading ? (
          <div className="text-center py-16 rounded-lg border border-border bg-card">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 rounded-lg border border-border bg-card">
            <Ticket size={28} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {statusFilter ? "No tickets with this status" : searchQuery ? "No matching tickets" : "No tickets yet"}
            </p>
            {!isSupport && !statusFilter && !searchQuery && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={14} />
                Create your first ticket
              </button>
            )}
          </div>
        ) : (
          <DataTable columns={columns} data={filteredTickets} />
        )}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
