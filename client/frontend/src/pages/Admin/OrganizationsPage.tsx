import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import OrganizationTable from "@/components/admin/OrganizationTable";
import OrganizationForm from "@/components/admin/OrganizationForm";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";

export default function OrganizationsPage() {
  const {
    organizations,
    orgPagination,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrgUsers,
    orgUsers,
  } = useAdminOrganizations();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [viewingOrgUsers, setViewingOrgUsers] = useState<any>(null);

  useEffect(() => {
    fetchOrganizations({ page, limit: 10, search });
  }, [page, search, fetchOrganizations]);

  const handleCreate = async (data: any) => {
    await createOrganization(data);
    fetchOrganizations({ page, limit: 10, search });
  };

  const handleUpdate = async (data: any) => {
    if (!editingOrg) return;
    await updateOrganization(editingOrg._id, data);
    fetchOrganizations({ page, limit: 10, search });
  };

  const handleDelete = async (org: any) => {
    if (!confirm(`Delete organization "${org.name}"?`)) return;
    await deleteOrganization(org._id);
    fetchOrganizations({ page, limit: 10, search });
  };

  const handleViewUsers = async (org: any) => {
    setViewingOrgUsers(org);
    await fetchOrgUsers(org._id, { page: 1, limit: 10 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage multi-tenant organizations.</p>
        </div>
        <Button onClick={() => { setEditingOrg(null); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          New Organization
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search organizations..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <OrganizationTable
          organizations={organizations}
          onEdit={(org) => { setEditingOrg(org); setShowForm(true); }}
          onDelete={handleDelete}
          onViewUsers={handleViewUsers}
        />
      </div>

      {orgPagination && orgPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, orgPagination.total)} of{" "}
            {orgPagination.total}
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
              disabled={page >= orgPagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <OrganizationForm
          organization={editingOrg}
          onSubmit={editingOrg ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingOrg(null); }}
        />
      )}

      {viewingOrgUsers && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Users in {viewingOrgUsers.name}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setViewingOrgUsers(null)}>
                Close
              </Button>
            </div>
            {orgUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users in this organization.</p>
            ) : (
              <div className="space-y-2">
                {orgUsers.map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "active" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {user.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
