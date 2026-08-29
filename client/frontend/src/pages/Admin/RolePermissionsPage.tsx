import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";
import { canManageRoles } from "@/lib/roles";
import { Search, Shield, ShieldCheck, Check, X, Save, AlertCircle, Lock } from "lucide-react";

interface Role {
  _id: string;
  role_name: string;
  description?: string;
  permissions: string[];
  status: string;
  isSystemRole?: boolean;
  organization_id?: { _id: string; name: string } | string | null;
}

interface Permission {
  key: string;
  description: string;
}

interface PermissionCategory {
  module: string;
  count: number;
  permissions: Permission[];
}

export default function RolePermissionsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const canAssign = canManageRoles(user);
  const canSave = canManageRoles(user);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, categoriesRes] = await Promise.all([
        AdminAPI.getRoles({ limit: 100 }),
        AdminAPI.getPermissionCategories(),
      ]);
      const roleList: Role[] = rolesRes.data?.success ? rolesRes.data.data || [] : [];
      setRoles(roleList);
      setCategories(categoriesRes.data?.success ? categoriesRes.data.data || [] : []);

      const editable = roleList.find(
        (r) => r.role_name.toLowerCase() !== "super admin" && !r.isSystemRole
      );
      if (editable) {
        setSelectedRoleId(editable._id);
        setSelected(editable.permissions || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedRole = useMemo(
    () => roles.find((r) => r._id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const selectRole = (role: Role) => {
    setSelectedRoleId(role._id);
    setSelected(role.permissions || []);
    setDirty(false);
  };

  const allPermissionKeys = useMemo(
    () => categories.flatMap((c) => c.permissions.map((p) => p.key)),
    [categories]
  );

  const selectedCount = selected.length;
  const allCount = allPermissionKeys.length;

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        permissions: cat.permissions.filter(
          (p) =>
            p.key.toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [categories, search]);

  const toggle = (key: string) => {
    setDirty(true);
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (cat: PermissionCategory) => {
    setDirty(true);
    const keys = cat.permissions.map((p) => p.key);
    const allSelected = keys.every((k) => selected.includes(k));
    setSelected((prev) =>
      allSelected ? prev.filter((k) => !keys.includes(k)) : Array.from(new Set([...prev, ...keys]))
    );
  };

  const selectAll = () => {
    setDirty(true);
    setSelected(Array.from(new Set(allPermissionKeys)));
  };

  const clearAll = () => {
    setDirty(true);
    setSelected([]);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setError("");
    try {
      const res = await AdminAPI.updateRole(selectedRole._id, {
        role_name: selectedRole.role_name,
        description: selectedRole.description || "",
        permissions: selected,
      });
      if (res.data?.success) {
        toast.success("Success", `Permissions updated for "${selectedRole.role_name}".`);
        setDirty(false);
        setRoles((prev) =>
          prev.map((r) => (r._id === selectedRole._id ? { ...r, permissions: [...selected] } : r))
        );
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold ">Role Permissions</h1>
        <p className="text-muted-foreground text-sm">
          Assign granular permissions to each role. Changes take effect immediately for members.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {!canAssign && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Lock size={14} />
          You don't have permission to view or assign role permissions.
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading roles &amp; permissions...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role list */}
          <div className="lg:col-span-1 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role or permission…"
                className="pl-9"
              />
            </div>

            {roles.filter((r) => r.role_name.toLowerCase() !== "super admin").length === 0 ? (
              <div className="text-center py-12">
                <Shield size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No roles available.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {roles
                  .filter((r) => r.role_name.toLowerCase() !== "super admin")
                  .map((role) => {
                    const isActive = selectedRoleId === role._id;
                    return (
                      <button
                        key={role._id}
                        onClick={() => selectRole(role)}
                        className={`w-full text-left rounded-xl border bg-card p-4 transition-colors ${
                          isActive
                            ? "border-primary ring-1 ring-primary/30"
                            : "hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{role.role_name}</p>
                              {role.isSystemRole && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  System
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{role.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                          {role.isSystemRole && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Lock size={10} /> Locked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Assignment panel */}
          <div className="lg:col-span-2 rounded-2xl border bg-card p-5 space-y-5">
            {!selectedRole ? (
              <div className="text-center py-16">
                <ShieldCheck size={44} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">Select a role to manage its permissions.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <ShieldCheck className="text-primary" size={18} />
                      {selectedRole.role_name}
                      {selectedRole.isSystemRole && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          System
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedCount} of {allCount} permissions selected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRole.isSystemRole && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock size={10} /> System roles are read-only
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={clearAll} disabled={selectedRole.isSystemRole}>
                      <X size={12} className="mr-1" /> Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectAll} disabled={selectedRole.isSystemRole}>
                      <Check size={12} className="mr-1" /> All
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={selectedRole.isSystemRole || !canSave || !dirty || saving}
                      title={!canSave ? "You need the role.create permission to save changes" : ""}
                    >
                      <Save size={14} className="mr-1" /> {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="max-h-[62vh] overflow-y-auto pr-1 space-y-5">
                  {filteredCategories.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">
                      {search ? "No permissions match your search." : "No permissions available."}
                    </p>
                  ) : (
                    filteredCategories.map((cat) => {
                      const catKeys = cat.permissions.map((p) => p.key);
                      const catSelected = catKeys.filter((k) => selected.includes(k)).length;
                      const allSelected = catSelected === catKeys.length;
                      return (
                        <div key={cat.module} className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase  text-muted-foreground">
                                {cat.module}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {catSelected}/{catKeys.length}
                              </Badge>
                            </div>
                            <button
                              onClick={() => toggleCategory(cat)}
                              disabled={selectedRole.isSystemRole}
                              className="text-[11px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                            >
                              {allSelected ? "Remove all" : "Select all"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                            {cat.permissions.map((perm) => {
                              const isChecked = selected.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-primary/10 text-primary border border-primary/20"
                                      : "hover:bg-muted border border-transparent"
                                  } ${selectedRole.isSystemRole ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggle(perm.key)}
                                    disabled={selectedRole.isSystemRole}
                                    className="sr-only"
                                  />
                                  {isChecked ? (
                                    <Check size={14} className="shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className="text-xs">{perm.description}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
