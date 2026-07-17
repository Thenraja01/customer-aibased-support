import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";
import { useAdminRoles } from "@/hooks/useAdminRoles";
import { staggerContainer, staggerItem } from "@/lib/animations";

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
  const { roles, fetchRoles } = useAdminRoles();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers({ page, limit: 10, search, status: statusFilter });
  }, [page, search, statusFilter, fetchUsers]);

  useEffect(() => {
    fetchOrganizations({ limit: 100 });
    fetchRoles({ limit: 100 });
  }, [fetchOrganizations, fetchRoles]);

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
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all system users.</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          New User
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="select-field"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card">
        <UserTable
          users={users}
          onEdit={(user) => { setEditingUser(user); setShowForm(true); }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </motion.div>

      {userPagination && userPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, userPagination.total)} of{" "}
            {userPagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= userPagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <UserForm
          user={editingUser}
          organizations={organizations}
          roles={roles}
          onSubmit={editingUser ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
    </motion.div>
  );
}
