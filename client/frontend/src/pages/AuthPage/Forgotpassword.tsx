// pages/auth/ForgotPassword.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Key,
  Shield,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useOtpGuard } from "@/hooks/useOtpGuard";

const OTP_EXPIRY_MINUTES = 15; // OTP expiry time

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { resendIn, locked, lockedIn, refresh } = useOtpGuard(isSubmitted ? email.trim().toLowerCase() : "");

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthAPI.forgotPassword(email.trim().toLowerCase());
      
      if (response?.data?.success) {
        setIsSubmitted(true);
        localStorage.setItem("forgotPasswordEmail", email.trim().toLowerCase());
        toast("success", "OTP Sent", "Check your inbox for the password reset code");
      } else {
        setError(response?.data?.message || "Failed to send reset code");
        toast("error", "Error", response?.data?.message || "Failed to send reset code");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      const message = error?.response?.data?.message || error?.message || "Something went wrong";
      setError(message);
      toast("error", "Error", message);

      // Server cooldown / lockout message carries the remaining wait time.
      const match = message?.match(/\((\d+)s remaining\)/);
      if (error?.response?.status === 429 || match) {
        toast("warning", "Rate Limited", message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, toast]);

  const handleResend = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await AuthAPI.forgotPassword(email.trim().toLowerCase());
      if (response?.data?.success) {
        toast("success", "Code Resent", "A new verification code has been sent to your email");
      } else {
        setError(response?.data?.message || "Failed to resend code");
        toast("error", "Error", response?.data?.message || "Failed to resend code");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Something went wrong";
      setError(message);
      toast("error", "Error", message);
    } finally {
      setIsLoading(false);
      refresh();
    }
  }, [email, toast, refresh]);

  const handleProceedToReset = useCallback(() => {
    const storedEmail = localStorage.getItem("forgotPasswordEmail");
    if (storedEmail) {
      navigate("/reset-password", { state: { email: storedEmail } });
    } else {
      navigate("/reset-password", { state: { email: email.trim().toLowerCase() } });
    }
  }, [navigate, email]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate("/login");
    }
  }, [navigate]);

  // Clean up localStorage on unmount
  useEffect(() => {
    return () => {
      // Only clear if not in the middle of the flow
      if (!isSubmitted) {
        localStorage.removeItem("forgotPasswordEmail");
      }
    };
  }, [isSubmitted]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 px-4 sm:px-6 py-8 sm:py-12"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Login
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-lg border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Key size={24} className="text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold ">Forgot Password?</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                {isSubmitted 
                  ? "Check your email for the verification code" 
                  : "Enter your email address and we'll send you a code to reset your password"
                }
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {isSubmitted ? (
              // Success State
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Code Sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit verification code to:
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">{email}</p>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-medium">Didn't receive the code?</p>
                      <p className="text-xs text-muted-foreground">
                        Check your spam folder or try resending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-medium">Code expires in</p>
                      <p className="text-xs text-muted-foreground">
                        {OTP_EXPIRY_MINUTES} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-medium">Security tip</p>
                      <p className="text-xs text-muted-foreground">
                        Never share your verification code with anyone
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {locked && (
                    <div className="w-full rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2 text-xs text-destructive">
                      <Shield size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                      <p>
                        Too many attempts. OTP is locked for{" "}
                        <span className="font-semibold">{lockedIn}s</span>. Try again later.
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || locked || isLoading}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" />
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend Code"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToReset}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <ArrowRight size={16} className="mr-2" aria-hidden="true" />
                    Enter Code
                  </button>
                </div>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail size={18} aria-hidden="true" />
                    </div>
                    <input
                      ref={inputRef}
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="you@example.com"
                      className={cn(
                        "w-full pl-10 pr-3 py-2.5 rounded-lg border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40",
                        "transition-all duration-200",
                        error ? "border-destructive focus:ring-destructive/40" : "border-input"
                      )}
                      aria-describedby={error ? "email-error" : undefined}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                    {error && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                        <AlertCircle size={18} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {error && (
                    <p id="email-error" className="text-xs text-destructive">
                      {error}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" aria-hidden="true" />
                      Send Reset Code
                    </>
                  )}
                </Button>

                {/* Additional Info */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Remember your password?{" "}
                    <Link 
                      to="/login" 
                      className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t dark:border-white/[0.06]">
            <p className="text-xs text-center text-muted-foreground">
              Need help?{" "}
              <Link 
                to="/contact" 
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Shield size={14} aria-hidden="true" />
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}