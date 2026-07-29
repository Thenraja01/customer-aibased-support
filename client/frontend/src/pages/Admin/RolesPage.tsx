import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Shield, AlertCircle, X, Building2 } from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { ROLE_KEYS, SYSTEM_ROLE_NAMES, normalizeRoleName } from "@/lib/roles";
import { useAuth } from "@/hooks/useAuth";
import { canManageRoles } from "@/lib/roles";

interface Role {
  _id: string;
  role_name: string;
  level?: number;
  description?: string;
  status: string;
  organization_id?: { _id: string; name: string } | string | null;
}

const LEVEL_OPTIONS = [
  { level: 1, label: "Admin", description: "Organization administrator" },
  { level: 2, label: "Branch Admin", description: "Branch-level management" },
  { level: 3, label: "Support", description: "Assists customers" },
  { level: 4, label: "Customer", description: "End user access" },
];

export default function RolesPage() {
  const { user } = useAuth();
  const canManage = canManageRoles(user);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    role_name: "",
    description: "",
    level: 3,
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
    setFormData({ role_name: "", description: "", level: 3 });
    setFormErrors({});
    setEditingRole(null);
    setShowForm(false);
  };

  const openEdit = (role: Role) => {
    if (SYSTEM_ROLE_NAMES.includes(normalizeRoleName(role.role_name))) {
      setError(`Cannot edit system role "${role.role_name}"`);
      return;
    }
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      description: role.description || "",
      level: typeof role.level === "number" ? role.level : 3,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.role_name.trim()) errs.role_name = "Role name is required";
    if (SYSTEM_ROLE_NAMES.includes(normalizeRoleName(formData.role_name))) {
      errs.role_name = "Role name conflicts with a system role";
    }
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
    if (!confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) return;
    try {
      await AdminAPI.deleteRole(role._id);
      fetchRoles();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete role");
    }
  };

  const levelLabel = (level: number | undefined) => {
    const opt = LEVEL_OPTIONS.find((o) => o.level === level);
    return opt?.label ?? `Level ${level}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage roles for your organization. Access is granted by hierarchy level.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditingRole(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1" />
            New Role
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {!canManage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertCircle size={14} />
          You don't have permission to manage roles.
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
                  placeholder="e.g. Regional Manager"
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
                <Label>Access Level</Label>
                <div className="grid grid-cols-1 gap-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <label
                      key={opt.level}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border ${
                        formData.level === opt.level
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "hover:bg-muted border-transparent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={opt.level}
                        checked={formData.level === opt.level}
                        onChange={() => setFormData((p) => ({ ...p, level: opt.level }))}
                        className="sr-only"
                      />
                      <span className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0">
                        {formData.level === opt.level && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.description}</span>
                      </span>
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
            .filter((r) => normalizeRoleName(r.role_name) !== ROLE_KEYS.SUPER_ADMIN)
            .map((role) => {
              const isSystem = SYSTEM_ROLE_NAMES.includes(normalizeRoleName(role.role_name));
              return (
                <div key={role._id} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{role.role_name}</h3>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                          {levelLabel(role.level)}
                        </span>
                        {!role.organization_id && (
                          <span className="text-[10px] text-muted-foreground/60 inline-flex items-center gap-1">
                            <Building2 size={10} /> Global role
                          </span>
                        )}
                        {isSystem && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      role.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {role.status}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(role)}
                      disabled={isSystem || !canManage}
                      className="flex-1"
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role)}
                      disabled={isSystem || !canManage}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
