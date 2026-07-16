import { Badge } from "@/components/ui/badge";

interface LogEntry {
  _id: string;
  user_id?: { name: string; email: string } | string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
}

interface Props {
  logs: LogEntry[];
}

const actionColors: Record<string, string> = {
  CREATE: "bg-primary/10 text-primary",
  UPDATE: "bg-secondary/10 text-secondary",
  DELETE: "bg-destructive/10 text-destructive",
};

export default function AuditLogTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No audit logs found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
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
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log._id}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4 text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                {typeof log.user_id === "object"
                  ? log.user_id.name || log.user_id.email
                  : log.user_id || "-"}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
