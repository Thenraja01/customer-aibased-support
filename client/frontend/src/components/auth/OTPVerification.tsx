import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OTPVerificationProps {
  phone: string;
  onVerify: (otp: string) => Promise<boolean>;
  onResend: () => Promise<void>;
}

export function OTPVerification({ phone, onVerify, onResend }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete OTP');
      return;
    }
    setLoading(true);
    const success = await onVerify(code);
    setLoading(false);
    if (!success) setError('Invalid OTP');
  };

  const handleResend = async () => {
    setResendTimer(30);
    await onResend();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Verify OTP</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the code sent to {phone}
        </p>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-lg font-bold rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ))}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {resendTimer > 0 ? (
          `Resend code in ${resendTimer}s`
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-primary hover:underline"
          >
            Resend code
          </button>
        )}
      </p>
    </form>
  );
}
