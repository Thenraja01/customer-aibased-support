import { useState } from 'react';
import { Input } from '@/components/common/Forms/Input';
import { Textarea } from '@/components/common/Forms/Textarea';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';

interface TicketFormProps {
  initial?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TicketForm({ initial, onSubmit, onCancel }: TicketFormProps) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    priority: initial?.priority || 'medium',
    category: initial?.category || '',
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
      setError(err.response?.data?.message || 'Failed to save ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={4}
      />
      <Select
        label="Priority"
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ]}
        value={form.priority}
        onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
      />
      <Input
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}
