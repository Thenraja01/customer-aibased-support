import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { IRole } from "@/types";

interface Props {
  roles: IRole[];
  onCreate: (data: { role_name: string }) => Promise<void>;
  onUpdate: (id: string, data: { role_name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function RoleManager({
  roles,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [newRole, setNewRole] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const excludedRoles = ["super_admin", "super admin"];

  const filteredRoles = roles.filter(
    (role) => !excludedRoles.includes(role.role_name)
  );
  const handleCreate = async () => {
    if (!newRole.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ role_name: newRole.trim() });
      setNewRole("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      await onUpdate(id, { role_name: editName.trim() });
      setEditingId(null);
      setEditName("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    await onDelete(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="New role name"
          className="max-w-xs"
        />
        <Button
          onClick={handleCreate}
          disabled={submitting || !newRole.trim()}
        >
          <Plus size={14} className="mr-1" />
          Add Role
        </Button>
      </div>

      <div className="space-y-2">
        {filteredRoles.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">
            No roles found.
          </p>
        ) : (
          filteredRoles.map((role) => (
            <div
              key={role._id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              {editingId === role._id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="max-w-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(role._id!)}
                    disabled={submitting}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className=""></div>
                  {role.role_name}


                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingId(role._id!);
                        setEditName(role.role_name);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleDelete(role._id!)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}