// pages/auth/ResetPassword.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Key,
  Shield,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useOtpGuard } from "@/hooks/useOtpGuard";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem("forgotPasswordEmail") || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { resendIn, locked, lockedIn, refresh: refreshOtpStatus } = useOtpGuard(email.trim().toLowerCase());

  // Auto-focus first OTP input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast("error", "Error", "No email provided. Please request a password reset first.");
      navigate("/forgot-password");
    }
  }, [email, navigate, toast]);

  const validatePassword = useCallback((password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      return `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`;
    }
    return null;
  }, []);

  const handleOtpChange = useCallback((index: number, value: string) => {
    setError(null);
    
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    
    const newOtp = [...otp];
    newOtp[index] = numericValue.slice(-1); // Take only last character
    setOtp(newOtp);
    
    // Auto-focus next input
    if (numericValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      // Focus last input
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus();
      }
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const otpValue = otp.join("");
    
    // Validate OTP
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    
    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthAPI.resetPassword(email.trim().toLowerCase(), otpValue, newPassword);
      
      if (response?.data?.success) {
        setIsSuccess(true);
        // Clear localStorage
        localStorage.removeItem("forgotPasswordEmail");
        localStorage.removeItem("forgotPasswordLastRequest");
        toast("success", "Password Reset", "Your password has been reset successfully");
      } else {
        setError(response?.data?.message || "Failed to reset password");
        toast("error", "Error", response?.data?.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      const message = error?.response?.data?.message || error?.message || "Something went wrong";
      setError(message);
      toast("error", "Error", message);
    } finally {
      setIsLoading(false);
    }
  }, [otp, newPassword, confirmPassword, email, validatePassword, toast]);

  const handleResendOtp = useCallback(async () => {
    try {
      const response = await AuthAPI.forgotPassword(email.trim().toLowerCase());
      
      if (response?.data?.success) {
        toast("success", "Code Resent", "A new verification code has been sent to your email");
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""]);
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0]?.focus();
        }
      } else {
        toast("error", "Error", response?.data?.message || "Failed to resend code");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Something went wrong";
      setError(message);
      toast("error", "Error", message);
    } finally {
      refreshOtpStatus();
    }
  }, [email, toast, refreshOtpStatus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate("/login");
    }
  }, [navigate]);

  const getPasswordStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  }, []);

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-4">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Forgot Password
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Key size={24} className="text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                {isSuccess 
                  ? "Your password has been reset successfully" 
                  : "Enter the verification code and your new password"
                }
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {isSuccess ? (
              // Success State
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Password Reset Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    You can now log in with your new password
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Display */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Verification code sent to: <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Verification Code
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={cn(
                          "w-10 h-12 text-center text-lg font-semibold rounded-lg border",
                          "focus:outline-none focus:ring-2 focus:ring-primary/40",
                          "transition-all duration-200",
                          error ? "border-destructive focus:ring-destructive/40" : "border-input"
                        )}
                        disabled={isLoading}
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading || resendIn > 0 || locked}
                      className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendIn > 0
                        ? `Resend code in ${resendIn}s`
                        : locked
                        ? `Locked — retry in ${lockedIn}s`
                        : "Resend code"}
                    </button>
                    {locked && (
                      <p className="text-xs text-destructive flex items-center justify-center gap-1">
                        <AlertCircle size={12} aria-hidden="true" />
                        Too many attempts. Please wait {lockedIn}s.
                      </p>
                    )}
                  </div>
                </div>

                {/* New Password Input */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock size={18} aria-hidden="true" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter new password"
                      className={cn(
                        "w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40",
                        "transition-all duration-200",
                        error ? "border-destructive focus:ring-destructive/40" : "border-input"
                      )}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-200",
                              level <= passwordStrength
                                ? passwordStrength <= 2
                                  ? "bg-red-500"
                                  : passwordStrength <= 4
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {passwordStrength <= 2 && "Weak password"}
                        {passwordStrength === 3 && "Fair password"}
                        {passwordStrength === 4 && "Good password"}
                        {passwordStrength >= 5 && "Strong password"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock size={18} aria-hidden="true" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Confirm new password"
                      className={cn(
                        "w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40",
                        "transition-all duration-200",
                        error || (confirmPassword && confirmPassword !== newPassword)
                          ? "border-destructive focus:ring-destructive/40"
                          : "border-input"
                      )}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6 || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" aria-hidden="true" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Shield size={18} className="mr-2" aria-hidden="true" />
                      Reset Password
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
