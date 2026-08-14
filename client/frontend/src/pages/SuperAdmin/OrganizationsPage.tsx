import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import OrganizationTable from "@/components/admin/OrganizationTable";
import OrganizationForm from "@/components/admin/OrganizationForm";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OrganizationsPage() {
  const navigate = useNavigate();
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
  const [actionError, setActionError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<(() => void) | null>(null);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleConfirmAction, setToggleConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    fetchOrganizations({ page, limit: 10, search });
  }, [page, search, fetchOrganizations]);

  const refresh = useCallback(() => {
    fetchOrganizations({ page, limit: 10, search });
  }, [fetchOrganizations, page, search]);

  const handleCreate = async (data: any) => {
    await createOrganization(data);
    refresh();
  };

  const handleUpdate = async (data: any) => {
    if (!editingOrg) return;
    await updateOrganization(editingOrg._id, data);
    refresh();
  };

  const handleDelete = async (org: any) => {
    setDeleteConfirmAction(() => async () => {
      setActionError("");
      try {
        await deleteOrganization(org._id);
        refresh();
      } catch (err: any) {
        setActionError(err?.response?.data?.message || err?.message || "Failed to delete organization");
      }
    });
    setDeleteConfirmOpen(true);
  };

  const handleToggleStatus = async (org: any) => {
    const newStatus = org.status === "inactive" ? "active" : "inactive";
    const action = newStatus === "active" ? "activate" : "suspend";
    setToggleConfirmAction(() => async () => {
      setActionError("");
      try {
        await updateOrganization(org._id, { status: newStatus });
        refresh();
      } catch (err: any) {
        setActionError(err?.response?.data?.message || err?.message || `Failed to ${action} organization`);
      }
    });
    setToggleConfirmOpen(true);
  };

  const handleViewUsers = async (org: any) => {
    setViewingOrgUsers(org);
    await fetchOrgUsers(org._id, { page: 1, limit: 10 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold ">Organizations</h1>
          <p className="text-muted-foreground text-sm">Manage multi-tenant organizations. Suspend or activate organizations as needed.</p>
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

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="ml-auto" title="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <OrganizationTable
          organizations={organizations}
          onEdit={(org) => { setEditingOrg(org); setShowForm(true); }}
          onDelete={handleDelete}
          onViewUsers={handleViewUsers}
          onViewDetails={(org) => navigate(`/superadmin/organizations/${org._id}`)}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {orgPagination && orgPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, orgPagination.total)} of {orgPagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= orgPagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewingOrgUsers(null)}>
          <div className="bg-card rounded-xl shadow-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Users in {viewingOrgUsers.name}</h2>
              <button onClick={() => setViewingOrgUsers(null)} className="p-1 rounded hover:bg-muted" title="Close"><X size={18} /></button>
            </div>
            {orgUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users in this organization.</p>
            ) : (
              <div className="space-y-2">
                {orgUsers.map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between p-3">
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
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Organization"
        message="Are you sure you want to delete this organization? This action cannot be undone."
        variant="danger"
        onConfirm={() => { deleteConfirmAction?.(); setDeleteConfirmOpen(false); }}
        onCancel={() => { setDeleteConfirmOpen(false); setDeleteConfirmAction(null); }}
      />
      <ConfirmDialog
        open={toggleConfirmOpen}
        title="Change Organization Status"
        message="Are you sure you want to change this organization's status?"
        variant="warning"
        onConfirm={() => { toggleConfirmAction?.(); setToggleConfirmOpen(false); }}
        onCancel={() => { setToggleConfirmOpen(false); setToggleConfirmAction(null); }}
      />
    </div>
  );
}
