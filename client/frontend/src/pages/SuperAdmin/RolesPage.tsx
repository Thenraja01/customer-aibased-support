import { useEffect } from "react";
import RoleManager from "@/components/admin/RoleManager";
import { useAdminRoles } from "@/hooks/useAdminRoles";

export default function RolesPage() {
  const { roles, fetchRoles, createRole, updateRole, deleteRole } =
    useAdminRoles();

  useEffect(() => {
    fetchRoles({ limit: 100 });
  }, [fetchRoles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground">
          Manage access control roles for the system.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <RoleManager
          roles={roles}
          onCreate={createRole}
          onUpdate={updateRole}
          onDelete={deleteRole}
        />
      </div>
    </div>
  );
}
