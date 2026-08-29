import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import { AdminAPI } from "@/api/admin.api";
import BranchAPI from "@/api/branch.api";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/hooks/useBranchScope";

export default function OrgUsersPage() {
  const { user } = useAuth();
  const { isSuperAdmin, isOrgAdmin } = usePermissions();
  const { branchId: activeBranchId, changeBranch, isBranchLocked } = useBranchScope();
  const orgId = user?.organization_id?._id || user?.organization_id;
  const orgName = user?.organization_id?.name;

  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const limit = 10;

  // Org admins / super admins can scope the list to a branch; branch admins
  // are locked to their own branch by useBranchScope.
  const canSelectBranch = isSuperAdmin || isOrgAdmin;

  useEffect(() => {
    if (!orgId) return;
    setLoadingBranches(true);
    BranchAPI.getAll({ organization_id: orgId, limit: 100 })
      .then((res: any) => setBranches(res.data?.data || []))
      .catch((error) => console.error("Failed to fetch branches", error))
      .finally(() => setLoadingBranches(false));
  }, [orgId]);

  const fetchUsers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params: any = { page, limit, search, role: "staff" };
      if (activeBranchId) {
        params.branchId = activeBranchId;
      }
      const res = await AdminAPI.getOrgUsers(orgId, params);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch org users", error);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, search, activeBranchId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeBranch(e.target.value || null);
    setPage(1);
  };

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
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Organization Users</h1>
          <p className="text-muted-foreground">
            Manage users in {orgName || "your organization"}
            {canSelectBranch && activeBranchId
              ? ` · ${branches.find((b) => b._id === activeBranchId)?.name || "selected branch"}`
              : ""}
            .
          </p>
        </div>
        {(isSuperAdmin || isOrgAdmin || (activeBranchId && !canSelectBranch)) && (
          <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1" />
            New User
          </Button>
        )}
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

        {canSelectBranch && (
          <div className="relative min-w-[200px]">
            <select
              value={activeBranchId || ""}
              onChange={handleBranchChange}
              className="select-field w-full pr-8"
              aria-label="Filter by branch"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            {loadingBranches && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        )}

        {isBranchLocked && activeBranchId && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            Branch: {branches.find((b) => b._id === activeBranchId)?.name || "My branch"}
          </span>
        )}
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
          initialBranchId={canSelectBranch ? activeBranchId : null}
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
