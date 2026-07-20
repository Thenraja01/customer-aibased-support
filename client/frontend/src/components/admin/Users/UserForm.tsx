import { useState } from 'react';
import { Input } from '@/components/common/Forms/Input';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';

interface UserFormProps {
  initial?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ initial, onSubmit, onCancel }: UserFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    role: initial?.role_id?._id || initial?.role || '',
    organization: initial?.organization_id?._id || '',
    status: initial?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Select
        label="Role"
        options={[
          { label: 'Customer', value: 'customer' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ]}
        value={form.role}
        onChange={(e: any) => setForm({ ...form, role: e.target.value })}
      />
      <Select
        label="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Blocked', value: 'blocked' },
        ]}
        value={form.status}
        onChange={(e: any) => setForm({ ...form, status: e.target.value })}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
