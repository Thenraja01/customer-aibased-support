import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IOrganization } from "@/types";

interface Props {
  organization?: IOrganization | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function OrganizationForm({
  organization,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    customPrompt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        organization_id: organization.organization_id || "",
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        customPrompt: organization.customPrompt || "",
      });
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">
          {organization ? "Edit Organization" : "Create Organization"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization_id">Organization ID</Label>
            <Input
              id="organization_id"
              value={form.organization_id}
              onChange={(e) =>
                setForm({ ...form, organization_id: e.target.value })
              }
              placeholder="ORG-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Organization name"
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
              placeholder="org@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Custom Prompt</Label>
            <textarea
              id="customPrompt"
              value={form.customPrompt}
              onChange={(e) => setForm({ ...form, customPrompt: e.target.value })}
              placeholder="Enter custom system prompt for this organization (leave empty to use default)"
              className="w-full min-h-[150px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Custom prompt will be used instead of the default system prompt. Use {{ORGANIZATION_NAME}} as a placeholder for the organization name.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : organization ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
