import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OrgUsersPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id?._id || user?.organization_id;
  const orgName = user?.organization_id?.name;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await AdminAPI.getOrgUsers(orgId, { page, limit, search });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch org users", error);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, search]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await AdminAPI.getRoles({ limit: 100 });
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = async (data: any) => {
    await AdminAPI.createUser({ ...data, organization_id: orgId });
    fetchUsers();
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    await AdminAPI.updateUser(editingUser._id, { ...data, organization_id: orgId });
    fetchUsers();
  };

  const handleDelete = async (u: any) => {
    setConfirmAction(() => async () => {
      await AdminAPI.deleteUser(u._id);
      fetchUsers();
    });
    setConfirmOpen(true);
  };

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === "blocked" ? "active" : "blocked";
    await AdminAPI.updateUserStatus(u._id, newStatus);
    fetchUsers();
  };

  const orgsForForm = orgId
    ? [{ _id: orgId, organization_id: orgId, name: orgName || "My Organization" }]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Users</h1>
          <p className="text-muted-foreground">
            Manage users in {orgName || "your organization"}.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          New User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <UserTable
            users={users}
            onEdit={(u) => { setEditingUser(u); setShowForm(true); }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          organizations={orgsForForm}
          roles={roles}
          onSubmit={editingUser ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
