import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X } from "lucide-react";
import type { IUser, IOrganization, IRole } from "@/types";

interface Props {
  user?: IUser | null;
  organizations: IOrganization[];
  roles: IRole[];
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  organization_id?: string;
  role_id?: string;
  submit?: string;
}

export default function UserForm({ user, organizations, roles, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    organization_id: "",
    role_id: "",
    status: "active",
  });
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
        organization_id:
          typeof user.organization_id === "object"
            ? user.organization_id._id || ""
            : user.organization_id || "",
        role_id:
          typeof user.role_id === "object"
            ? user.role_id._id || ""
            : user.role_id || "",
        status: user.status,
      });
    } else if (organizations.length === 1) {
      setForm((prev) => ({ ...prev, organization_id: organizations[0]._id || "" }));
    }
  }, [user, organizations]);

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "name":
        return value.trim() ? "" : "Name is required";
      case "email":
        if (!value.trim()) return "Email is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email format";
      case "phone":
        if (!value) return "";
        return /^[\d\s+\-()]{7,20}$/.test(value) ? "" : "Invalid phone number";
      case "password":
        if (!value) return user ? "" : "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "organization_id":
        return value ? "" : "Organization is required";
      case "role_id":
        return value ? "" : "Role is required";
      default:
        return "";
    }
  }, [user]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const fields = user ? ["name", "email", "organization_id", "role_id"] : ["name", "email", "password", "organization_id", "role_id"];
    fields.forEach((field) => {
      const err = validateField(field, form[field as keyof typeof form]);
      if (err) newErrors[field as keyof FormErrors] = err;
    });
    if (form.phone) {
      const phoneErr = validateField("phone", form.phone);
      if (phoneErr) newErrors.phone = phoneErr;
    }
    setErrors(newErrors);
    const touchAll: Record<string, boolean> = {};
    fields.forEach((f) => { touchAll[f] = true; });
    setTouched(touchAll);
    return Object.keys(newErrors).length === 0;
  }, [form, validateField, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{user ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name" name="name" value={form.name}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="Full name"
              className={errors.name && touched.name ? "border-destructive" : ""}
              aria-invalid={!!errors.name}
            />
            {errors.name && touched.name && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email" name="email" type="email" value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="user@example.com"
              className={errors.email && touched.email ? "border-destructive" : ""}
              aria-invalid={!!errors.email}
            />
            {errors.email && touched.email && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-phone">Phone</Label>
            <Input
              id="user-phone" name="phone" value={form.phone}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="+1 (555) 000-0000"
              className={errors.phone && touched.phone ? "border-destructive" : ""}
            />
            {errors.phone && touched.phone && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">{user ? "New Password (leave blank to keep)" : "Password"}</Label>
            <Input
              id="user-password" name="password" type="password" value={form.password}
              onChange={handleChange} onBlur={handleBlur}
              placeholder={user ? "Leave blank to keep current" : "Min 8 characters"}
              className={errors.password && touched.password ? "border-destructive" : ""}
              aria-invalid={!!errors.password}
            />
            {errors.password && touched.password && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.password}</p>}
          </div>

          {organizations.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="user-org">Organization</Label>
              <select
                id="user-org" name="organization_id" value={form.organization_id}
                onChange={handleChange} onBlur={handleBlur}
                className={`select-field ${errors.organization_id && touched.organization_id ? "border-destructive" : ""}`}
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>{org.name || org.organization_id}</option>
                ))}
              </select>
              {errors.organization_id && touched.organization_id && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.organization_id}</p>}
            </div>
          ) : organizations.length === 1 ? (
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
                {organizations[0].name || organizations[0].organization_id}
              </div>
              {!form.organization_id && (
                <p className="text-xs text-muted-foreground">Auto-assigned to your organization</p>
              )}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role" name="role_id" value={form.role_id}
              onChange={handleChange} onBlur={handleBlur}
              className={`select-field ${errors.role_id && touched.role_id ? "border-destructive" : ""}`}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>{role.role_name}</option>
              ))}
            </select>
            {errors.role_id && touched.role_id && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.role_id}</p>}
          </div>

          {user && (
            <div className="space-y-1.5">
              <Label htmlFor="user-status">Status</Label>
              <select
                id="user-status" name="status" value={form.status}
                onChange={handleChange}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}

          {errors.submit && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} />{errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
