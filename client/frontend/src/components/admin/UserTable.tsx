import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Ban, CheckCircle } from "lucide-react";
import type { IUser } from "@/types";

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
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Name
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Email
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Organization
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Role
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Status
            </th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4 font-medium">{user.name}</td>
              <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {user.organization_id?.name || "-"}
              </td>
              <td className="py-3 px-4">
           
                  {user.role_id?.role_name || "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || ""}`}
                >
                  {user.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onToggleStatus(user)}
                    title={
                      user.status === "blocked" ? "Unblock" : "Block"
                    }
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
