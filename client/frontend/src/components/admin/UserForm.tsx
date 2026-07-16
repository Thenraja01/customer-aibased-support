import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IUser, IOrganization, IRole } from "@/types";

interface Props {
  user?: IUser | null;
  organizations: IOrganization[];
  roles: IRole[];
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function UserForm({
  user,
  organizations,
  roles,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    organization_id: "",
    role_id: "",
    status: "active",
  });
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
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { password, ...rest } = form;
      const data = password ? { ...rest, password } : { ...rest };
      await onSubmit(data);
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {user ? "Edit User" : "Create User"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="organization_id">Organization</Label>
            <select
              id="organization_id"
              value={form.organization_id}
              onChange={(e) =>
                setForm({ ...form, organization_id: e.target.value })
              }
              className="select-field"
              required
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <select
              id="role_id"
              value={form.role_id}
              onChange={(e) =>
                setForm({ ...form, role_id: e.target.value })
              }
              className="select-field"
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>
          {user && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
