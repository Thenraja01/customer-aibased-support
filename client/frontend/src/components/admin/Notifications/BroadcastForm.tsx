import { useState } from 'react';
import { Input } from '@/components/common/Forms/Input';
import { Textarea } from '@/components/common/Forms/Textarea';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';

export function BroadcastForm() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target_roles: '',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult('');
    try {
      const { NotificationAPI } = await import('@/api/notification.api');
      await NotificationAPI.broadcast({
        ...form,
        target_roles: form.target_roles ? [form.target_roles] : [],
      });
      setResult('Broadcast sent successfully');
      setForm({ title: '', message: '', type: 'info', target_roles: '' });
    } catch (err: any) {
      setResult(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold">Send Broadcast</h3>
      {result && (
        <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">{result}</div>
      )}
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        label="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={4}
        required
      />
      <Select
        label="Type"
        options={[
          { label: 'Info', value: 'info' },
          { label: 'Warning', value: 'warning' },
          { label: 'Success', value: 'success' },
          { label: 'Error', value: 'error' },
        ]}
        value={form.type}
        onChange={(e: any) => setForm({ ...form, type: e.target.value })}
      />
      <Select
        label="Target Role (optional)"
        options={[
          { label: 'All users', value: '' },
          { label: 'Customers', value: 'customer' },
          { label: 'Agents', value: 'agent' },
          { label: 'Admins', value: 'admin' },
        ]}
        value={form.target_roles}
        onChange={(e: any) => setForm({ ...form, target_roles: e.target.value })}
      />
      <Button type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send Broadcast'}
      </Button>
    </form>
  );
}
