import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
export default function UsersPage() {
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    fetchUsers({ page, limit: 10, search: debouncedSearch, status: statusFilter });
  }, [page, debouncedSearch, statusFilter, fetchUsers]);

  useEffect(() => {
    fetchOrganizations({ limit: 100 });
  }, [fetchOrganizations]);

  const handleCreate = async (data: any) => {
    await createUser(data);
    fetchUsers({ page, limit: 10, search, status: statusFilter });
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    await updateUser(editingUser._id, data);
    fetchUsers({ page, limit: 10, search, status: statusFilter });
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Delete user "${user.name}"?`)) return;
    await deleteUser(user._id);
    fetchUsers({ page, limit: 10, search, status: statusFilter });
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "blocked" ? "active" : "blocked";
    await updateUserStatus(user._id, newStatus);
    fetchUsers({ page, limit: 10, search, status: statusFilter });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Users</h1>
          <p className="text-muted-foreground">Manage all system users.</p>
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

        <div className="rounded-lg border bg-card">
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
