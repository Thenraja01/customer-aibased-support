import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthAPI } from "@/api/auth.api";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession } = useAuthContext();

  const state = (location.state as { email?: string; mode?: "approval" | "2fa" }) || {};
  const email = state.email || "";
  const mode = state.mode === "2fa" ? "2fa" : "approval";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-start cooldown timer when page loads (OTP already sent by admin approval)
  useEffect(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Navigate away if no email
  useEffect(() => {
    if (!email) {
      toast.warning("Missing Info", "Please start from the login or registration page.");
      navigate(mode === "2fa" ? "/login" : "/registration-pending", { replace: true });
    }
  }, [email, mode, navigate, toast]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Allow only digits
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");
      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      // Auto-advance
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (otp[index]) {
          setOtp((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          setOtp((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    setOtp((prev) => {
      const next = [...prev];
      pasted.split("").forEach((ch, i) => { next[i] = ch; });
      return next;
    });
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  }, []);

  const navigateToDashboard = useCallback((role?: string) => {
    const r = (role || "").toLowerCase().replace(/[\s_]+/g, "_");
    if (r === "super_admin") navigate("/superadmin/dashboard", { replace: true });
    else if (r === "admin" || r === "branch_admin") navigate("/admin/dashboard", { replace: true });
    else if (r === "branch_admin") navigate("/branch/dashboard", { replace: true });
    else if (r === "support") navigate("/support/dashboard", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleVerify = useCallback(async () => {
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = mode === "2fa"
        ? await AuthAPI.verify2FA(email, otpValue)
        : await AuthAPI.verifyApprovalOTP(email, otpValue);

      const { success, token: _token, data } = res.data;
      if (success) {
        setVerified(true);
        if (mode === "2fa") {
          if (!setSession(res.data)) {
            setError("Failed to save session");
            return;
          }
          toast.success("Verified!", `Welcome back${data?.name ? ", " + data.name : ""}. Redirecting...`);
          setTimeout(() => navigateToDashboard(data?.role || data?.roleName || data?.role_id?.role_name), 1500);
        } else {
          toast.success("Account Verified!", "Your account is now active. Redirecting to login...");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Verification failed. Please try again.";
      setError(msg);
      // Clear OTP and refocus
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }, [otp, email, mode, navigate, navigateToDashboard, toast, setSession]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    try {
      if (mode === "2fa") {
        await AuthAPI.request2FAOTP(email);
      } else {
        await AuthAPI.requestApprovalOTP(email);
      }
      toast.success("OTP Sent!", "A new verification code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(
        "Resend Failed",
        err.response?.data?.message || "Could not resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  }, [email, mode, toast]);

  const allFilled = otp.every(Boolean);

  // ── Success screen ────────────────────────────────────────────
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-8 py-14 dark:bg-card/80 dark:border-white/[0.06]">
            <CardContent className="space-y-5">
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-400/30"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold">
                  {mode === "2fa" ? "Verified!" : "Account Verified!"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {mode === "2fa"
                    ? "Authentication successful. Redirecting…"
                    : "Your account is now active. Redirecting you to login…"}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Redirecting…</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Main OTP form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-secondary/5">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md dark:bg-card/80 dark:border-white/[0.06]">
            <CardHeader className="text-center space-y-4 pb-4 px-8 pt-10">
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <ShieldCheck className="w-10 h-10 text-primary-foreground" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  {mode === "2fa" ? "Two-Factor Authentication" : "Verify Your Account"}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {mode === "2fa"
                    ? "Enter the 6-digit code from your authenticator app or email"
                    : "Enter the 6-digit code sent to your email"}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="px-8 pb-10 space-y-6">
              {/* Email display */}
              {email && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{email}</span>
                </motion.div>
              )}

              {/* OTP digit inputs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex justify-center gap-2 sm:gap-3"
                onPaste={handlePaste}
              >
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
                    aria-label={`OTP digit ${index + 1}`}
                    className={`
                      w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 
                      bg-background transition-all duration-200 outline-none
                      focus:border-primary focus:ring-2 focus:ring-primary/20 focus:scale-105
                      dark:bg-white/[0.03] dark:border-white/[0.10]
                      ${digit ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-muted-foreground/20"}
                      ${error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}
                    `}
                  />
                ))}
              </motion.div>

              {/* Error message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verify button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleVerify}
                  disabled={!allFilled || verifying}
                  className="w-full h-12 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {verifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "2fa" ? "Authenticate" : "Verify Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Resend OTP */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-center space-y-2"
              >
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="h-9 text-sm font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Resend in {cooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Resend OTP
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Back link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <Link
                  to={mode === "2fa" ? "/login" : "/login"}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
