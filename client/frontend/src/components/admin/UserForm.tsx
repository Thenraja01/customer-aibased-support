import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X, Loader2 } from "lucide-react";
import type { IUser, IOrganization } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/context/AuthContext";
import BranchAPI from "@/api/branch.api";

interface Props {
  user?: IUser | null;
  organizations: IOrganization[];
  /** Pre-select a branch for new users (e.g. when opened from a branch-filtered view). */
  initialBranchId?: string | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  name?: string; email?: string; phone?: string; password?: string;
  organization_id?: string; branch_id?: string; role_id?: string; role?: string;
  submit?: string;
}

export default function UserForm({ user, organizations, initialBranchId = null, onSubmit, onClose }: Props) {
  const { isSuperAdmin, isOrgAdmin } = usePermissions();
  const { user: currentUser } = useAuthContext();
  const currentUserOrgId = typeof currentUser?.organization_id === "object" ? currentUser.organization_id?._id : currentUser?.organization_id;
  const currentUserBranchId = typeof currentUser?.branch_id === "object" ? currentUser.branch_id?._id : currentUser?.branch_id;
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    organization_id: "",
    branch_id: "",
    role: "",
    status: "active",
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        password: "",
        organization_id: typeof user.organization_id === "object" ? user.organization_id._id || "" : user.organization_id || "",
        branch_id: typeof user.branch_id === "object" ? user.branch_id?._id || "" : user.branch_id || "",
        role: user.role || "",
        status: user.status,
      });
    } else {
      let initialOrgId = "";
      let lockedBranchId = "";
      
      if (!isSuperAdmin) {
        initialOrgId = currentUserOrgId || "";
        if (!isOrgAdmin) {
          lockedBranchId = currentUserBranchId || "";
        }
      } else if (organizations.length === 1) {
        initialOrgId = organizations[0]._id || "";
      }

      setForm((prev) => ({
        ...prev,
        organization_id: initialOrgId,
        branch_id: initialBranchId || lockedBranchId,
      }));
    }
  }, [user, organizations, isSuperAdmin, isOrgAdmin, currentUserOrgId, currentUserBranchId, initialBranchId]);

  useEffect(() => {
    if (form.organization_id) {
      setLoadingBranches(true);
      BranchAPI.getAll({ organization_id: form.organization_id })
        .then((res: any) => {
          setBranches(res.data?.data || []);
        })
        .catch(console.error)
        .finally(() => setLoadingBranches(false));
    } else {
      setBranches([]);
    }
  }, [form.organization_id]);

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "name": return value.trim() ? "" : "Name is required";
      case "email":
        if (!value.trim()) return "Email is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email format";
      case "password":
        if (!value) return user ? "" : "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "organization_id": return value ? "" : "Organization is required";
      case "role": return value ? "" : "Role is required";
      default: return "";
    }
  }, [user]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const fields = ["name", "email", "organization_id", "role"];
    if (!user) fields.push("password");
    
    fields.forEach((field) => {
      const err = validateField(field, form[field as keyof typeof form]);
      if (err) newErrors[field as keyof FormErrors] = err;
    });

    if (form.role === "branch_admin" || form.role === "support" || form.role === "customer") {
      if (!form.branch_id) newErrors.branch_id = "Branch is required for this role";
    }

    setErrors(newErrors);
    const touchAll: Record<string, boolean> = {};
    fields.forEach((f) => { touchAll[f] = true; });
    setTouched(touchAll);
    return Object.keys(newErrors).length === 0;
  }, [form, validateField, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "organization_id") next.branch_id = ""; // Reset branch on org change
      if (name === "role") {
        if (value === "admin" || value === "super_admin") next.branch_id = "";
      }
      return next;
    });
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { password, ...rest } = form;
      const data = password ? { ...rest, password } : { ...rest };
      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to save user" });
    } finally {
      setSubmitting(false);
    }
  };

  // Hierarchical role filtering
  const availableRoles = [
    { _id: "super_admin", role_name: "Super Admin" },
    { _id: "admin", role_name: "Org Admin" },
    { _id: "branch_admin", role_name: "Branch Admin" },
    { _id: "support", role_name: "Support Agent" },
    { _id: "customer", role_name: "Customer" }
  ].filter(r => {
    if (isSuperAdmin) return true;
    if (isOrgAdmin) return r._id !== "super_admin" && r._id !== "admin";
    return r._id === "support" || r._id === "customer"; // branch admin
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{user ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name" name="name" value={form.name} onChange={handleChange}
                placeholder="Full name"
                className={errors.name && touched.name ? "border-destructive" : ""}
              />
              {errors.name && touched.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="user@example.com"
                className={errors.email && touched.email ? "border-destructive" : ""}
              />
              {errors.email && touched.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">{user ? "New Password" : "Password"}</Label>
              <Input
                id="user-password" name="password" type="password" value={form.password} onChange={handleChange}
                placeholder={user ? "Leave blank to keep" : "Min 8 characters"}
                className={errors.password && touched.password ? "border-destructive" : ""}
              />
              {errors.password && touched.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-org">Organization</Label>
            <select
              id="user-org" name="organization_id" value={form.organization_id} onChange={handleChange}
              disabled={!isSuperAdmin}
              className={`select-field ${errors.organization_id && touched.organization_id ? "border-destructive" : ""}`}
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>{org.name || org.organization_id}</option>
              ))}
            </select>
            {errors.organization_id && touched.organization_id && <p className="text-xs text-destructive">{errors.organization_id}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role" name="role" value={form.role} onChange={handleChange}
              className={`select-field ${errors.role && touched.role ? "border-destructive" : ""}`}
            >
              <option value="">Select role</option>
              {availableRoles.map((role) => (
                <option key={role._id} value={role._id}>{role.role_name}</option>
              ))}
            </select>
            {errors.role && touched.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          {form.role && form.role !== "admin" && form.role !== "super_admin" && (
            <div className="space-y-1.5">
              <Label htmlFor="user-branch">Branch</Label>
              <div className="relative">
                <select
                  id="user-branch" name="branch_id" value={form.branch_id} onChange={handleChange}
                  disabled={!isSuperAdmin && !isOrgAdmin}
                  className={`select-field w-full ${errors.branch_id ? "border-destructive" : ""}`}
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {loadingBranches && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id}</p>}
            </div>
          )}

          {user && (
            <div className="space-y-1.5">
              <Label htmlFor="user-status">Status</Label>
              <select id="user-status" name="status" value={form.status} onChange={handleChange} className="select-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}

          {errors.submit && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} />{errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
