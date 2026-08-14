import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Ban, CheckCircle } from "lucide-react";
import type { IUser } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface Props {
  users: IUser[];
  onEdit: (user: IUser) => void;
  onDelete: (user: IUser) => void;
  onToggleStatus: (user: IUser) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
};

export default function UserTable({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
}: Props) {
  const columns: ColumnDef<IUser>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "organization_id.name",
      header: "Organization",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.organization_id?.name || "-"}</span>,
    },
    {
      accessorKey: "branch_id.name",
      header: "Branch",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.branch_id?.name || row.original.branchName || "-"}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const u = row.original;
        return <span>{u.roleName || u.role || (typeof u.role_id === "object" ? u.role_id?.role_name : "") || "-"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "inactive";
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || ""}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleStatus(user)}
              title={user.status === "blocked" ? "Unblock" : "Block"}
            >
              {user.status === "blocked" ? (
                <CheckCircle size={14} />
              ) : (
                <Ban size={14} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(user)}
              title="Edit"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => onDelete(user)}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        );
      },
    },
  ], [onDelete, onEdit, onToggleStatus]);

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card">
        No users found.
      </div>
    );
  }

  return <DataTable columns={columns} data={users} />;
}
