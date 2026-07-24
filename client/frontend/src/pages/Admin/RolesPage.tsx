  import { useState, useEffect, useCallback } from "react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Plus, Edit2, Trash2, Shield, AlertCircle, X, Check, Building2 } from "lucide-react";
  import { AdminAPI } from "@/api/admin.api";

  interface Role {
    _id: string;
    role_name: string;
    description?: string;
    permissions: string[];
    status: string;
    organization_id?: { _id: string; name: string } | string | null;
  }

  const isSuperAdmin = (role: Role) =>
    ["super admin", "super_admin"].includes(role.role_name.trim().toLowerCase());

  const availablePermissions = [
    "manage_users",
    "manage_documents",
    "manage_document_types",
    "manage_roles",
    "manage_faq",
    "view_analytics",
    "view_documents",
    "upload_documents",
    "view_own_profile",
    "manage_tickets",
    "manage_chats",
  ];

  export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
      role_name: "",
      description: "",
      permissions: [] as string[],
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const fetchRoles = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await AdminAPI.getRoles({ limit: 100 });
        if (res.data.success) setRoles(res.data.data || []);
      } catch {
        setError("Failed to load roles");
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const resetForm = () => {
      setFormData({ role_name: "", description: "", permissions: [] });
      setFormErrors({});
      setEditingRole(null);
      setShowForm(false);
    };

    const openEdit = (role: Role) => {
      if (isSuperAdmin(role)) {
        setError("Cannot edit Super Admin role");
        return;
      }
      setEditingRole(role);
      setFormData({
        role_name: role.role_name,
        description: role.description || "",
        permissions: role.permissions || [],
      });
      setFormErrors({});
      setShowForm(true);
    };

    const validate = (): boolean => {
      const errs: Record<string, string> = {};
      if (!formData.role_name.trim()) errs.role_name = "Role name is required";
      if (formData.role_name.length > 50) errs.role_name = "Max 50 characters";
      if (formData.description && formData.description.length > 200) errs.description = "Max 200 characters";
      setFormErrors(errs);
      return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
      if (!validate()) return;
      setSaving(true);
      try {
        if (editingRole) {
          await AdminAPI.updateRole(editingRole._id, formData);
        } else {
          await AdminAPI.createRole(formData);
        }
        resetForm();
        fetchRoles();
      } catch (err: any) {
        setFormErrors({ submit: err.response?.data?.message || "Failed to save role" });
      } finally {
        setSaving(false);
      }
    };

    const handleDelete = async (role: Role) => {
      if (isSuperAdmin(role)) {
        setError("Cannot delete Super Admin role");
        return;
      }
      if (!confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) return;
      try {
        await AdminAPI.deleteRole(role._id);
        fetchRoles();
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete role");
      }
    };

    const togglePermission = (perm: string) => {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(perm)
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      }));
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground text-sm">Create and manage roles for your organization.</p>
          </div>
          <Button onClick={() => { setEditingRole(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1" />
            New Role
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
            <AlertCircle size={14} />
            {error}
            <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Role Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => resetForm()}>
            <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{editingRole ? "Edit Role" : "Create Role"}</h2>
                <button onClick={resetForm} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role_name">Role Name</Label>
                  <Input
                    id="role_name"
                    value={formData.role_name}
                    onChange={(e) => setFormData((p) => ({ ...p, role_name: e.target.value }))}
                    placeholder="e.g. Support Agent"
                    className={formErrors.role_name ? "border-destructive" : ""}
                    aria-invalid={!!formErrors.role_name}
                  />
                  {formErrors.role_name && (
                    <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle size={12} />{formErrors.role_name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this role"
                    className={formErrors.description ? "border-destructive" : ""}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle size={12} />{formErrors.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {availablePermissions.map((perm) => (
                      <label
                        key={perm}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                          formData.permissions.includes(perm)
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="sr-only"
                        />
                        {formData.permissions.includes(perm) ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded border border-muted-foreground/30 shrink-0" />
                        )}
                        <span className="capitalize">{perm.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formErrors.submit && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle size={14} />{formErrors.submit}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12">
            <Shield size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No roles found. Create your first role.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles
              .filter((r) => !isSuperAdmin(r))
              .map((role) => (
                <div key={role._id} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{role.role_name}</h3>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{role.description}</p>
                      )}
                      {!role.organization_id && (
                        <span className="text-[10px] text-muted-foreground/60 mt-1 inline-flex items-center gap-1">
                          <Building2 size={10} /> Global role
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      role.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {role.status}
                    </span>
                  </div>

                  {role.permissions && role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 4).map((p) => (
                        <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground truncate max-w-[100px]">
                          {p.replace(/_/g, " ")}
                        </span>
                      ))}
                      {role.permissions.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{role.permissions.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(role)} className="flex-1">
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(role)} className="flex-1 text-destructive hover:text-destructive">
                      <Trash2 size={12} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }
