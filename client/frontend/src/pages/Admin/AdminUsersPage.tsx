import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";
import { useDebounce } from "@/hooks/useDebounce";
import { useBranchScope } from "@/hooks/useBranchScope";
import BranchAPI from "@/api/branch.api";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const {
    users,
    userPagination,
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
  } = useAdminUsers();

  const { organizations, fetchOrganizations } = useAdminOrganizations();
  const { branchId: activeBranchId, changeBranch, isBranchLocked } = useBranchScope();

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    fetchUsers({ page, limit: 10, search: debouncedSearch, status: statusFilter, branchId: activeBranchId || undefined });
  }, [page, debouncedSearch, statusFilter, activeBranchId, fetchUsers]);

  useEffect(() => {
    fetchOrganizations({ limit: 100 });
  }, [fetchOrganizations]);

  useEffect(() => {
    if (isBranchLocked && activeBranchId) return;
    setLoadingBranches(true);
    BranchAPI.getAll({ limit: 100 })
      .then((res: any) => setBranches(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoadingBranches(false));
  }, [isBranchLocked, activeBranchId]);

  const refresh = useCallback(() => {
    fetchUsers({ page, limit: 10, search, status: statusFilter, branchId: activeBranchId || undefined });
  }, [fetchUsers, page, search, statusFilter, activeBranchId]);

  const handleCreate = async (data: any) => {
    await createUser(data);
    refresh();
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    await updateUser(editingUser._id, data);
    refresh();
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Delete user "${user.name}"?`)) return;
    await deleteUser(user._id);
    refresh();
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "blocked" ? "active" : "blocked";
    await updateUserStatus(user._id, newStatus);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Users</h1>
          <p className="text-muted-foreground">Manage users across your organization and its branches.</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          New User
        </Button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "blocked", label: "Blocked" },
        ]}
        placeholder="Search users..."
      />

      {!isBranchLocked && (
        <div className="flex items-center gap-2 max-w-xs">
          <select
            value={activeBranchId || ""}
            onChange={(e) => { changeBranch(e.target.value || null); setPage(1); }}
            className="select-field w-full"
            aria-label="Filter by branch"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          {loadingBranches && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}

      <div>
        <UserTable
          users={users}
          onEdit={(user) => { setEditingUser(user); setShowForm(true); }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <Pagination
        page={page}
        totalPages={userPagination?.totalPages || 1}
        total={userPagination?.total || 0}
        pageSize={10}
        onPageChange={setPage}
      />

      {showForm && (
        <UserForm
          user={editingUser}
          organizations={organizations}
          onSubmit={editingUser ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}
