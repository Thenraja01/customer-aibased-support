import { useState } from 'react';
import { Input } from '@/components/common/Forms/Input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { UsersAPI } = await import('@/api/user.api');
      await UsersAPI.updateProfile({ name, phone });
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Email" value={email} disabled />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {message && (
        <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">
          {message}
        </div>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
