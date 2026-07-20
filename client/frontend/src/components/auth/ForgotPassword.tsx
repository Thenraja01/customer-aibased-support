import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/common/Forms/Input';
import { Button } from '@/components/ui/button';
import { isValidEmail } from '@/utils/validators';
import { AuthAPI } from '@/api/auth.api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await (AuthAPI as any).forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✉️</div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a password reset link to {email}
        </p>
        <Link to="/login" className="text-primary hover:underline text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Forgot password?</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
