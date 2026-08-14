import { Badge } from "@/components/ui/badge";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { AuditLogEntry } from "@/api/admin.api";

interface Props {
  logs: AuditLogEntry[];
  onViewDetail?: (log: AuditLogEntry) => void;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-primary/10 text-primary",
  UPDATE: "bg-secondary/10 text-secondary",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-green/10 text-green",
  LOGOUT: "bg-orange/10 text-orange",
  EXPORT: "bg-blue/10 text-blue",
  IMPORT: "bg-purple/10 text-purple",
  APPROVE: "bg-emerald/10 text-emerald",
  REJECT: "bg-red/10 text-red",
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export default function AuditLogTable({ logs, onViewDetail }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No audit logs found.
      </div>
    );
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getUserDisplay = (user: AuditLogEntry["user_id"]): string => {
    if (typeof user === "object" && user !== null) {
      return user.name || user.email || "-";
    }
    return user || "-";
  };

  const getUserEmail = (user: AuditLogEntry["user_id"]): string => {
    if (typeof user === "object" && user !== null) {
      return user.email || "";
    }
    return "";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground w-8">
              {" "}
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Timestamp
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              User
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Action
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Table
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Record ID
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground w-8">
              {" "}
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log._id);
            return (
              <>
                <tr
                  key={log._id}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleRow(log._id)}
                >
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(log._id);
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{getUserDisplay(log.user_id)}</div>
                    {getUserEmail(log.user_id) && (
                      <div className="text-xs text-muted-foreground">{getUserEmail(log.user_id)}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{log.table_name}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                    {log.record_id}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {onViewDetail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(log);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="View details"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-muted/30">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-3 bg-background rounded border">
                          <div className="font-medium text-muted-foreground mb-1">Old Value</div>
                          <pre className="whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto">
                            {formatValue(log.old_value)}
                          </pre>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <div className="font-medium text-muted-foreground mb-1">New Value</div>
                          <pre className="whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto">
                            {formatValue(log.new_value)}
                          </pre>
                        </div>
                        {log.ip_address && (
                          <div className="p-3 bg-background rounded border">
                            <div className="font-medium text-muted-foreground mb-1">IP Address</div>
                            <div className="text-muted-foreground">{log.ip_address}</div>
                          </div>
                        )}
                        {log.user_agent && (
                          <div className="p-3 bg-background rounded border">
                            <div className="font-medium text-muted-foreground mb-1">User Agent</div>
                            <pre className="whitespace-pre-wrap text-muted-foreground max-h-32 overflow-auto">
                              {log.user_agent}
                            </pre>
                          </div>
                        )}
                        {log.organization_id && (
                          <div className="p-3 bg-background rounded border">
                            <div className="font-medium text-muted-foreground mb-1">Organization ID</div>
                            <div className="text-muted-foreground font-mono">{log.organization_id}</div>
                          </div>
                        )}
                        {log.branch_id && (
                          <div className="p-3 bg-background rounded border">
                            <div className="font-medium text-muted-foreground mb-1">Branch ID</div>
                            <div className="text-muted-foreground font-mono">{log.branch_id}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}