import { useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Mail,
  User,
  Building2,
  Briefcase,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Shield,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";

interface LocationState {
  email?: string;
  name?: string;
  organizationName?: string;
  registrationId?: string;
  role?: string;
}

const STEPS = [
  { label: "Registration Submitted", done: true },
  { label: "Admin Review", done: false },
  { label: "OTP Verification", done: false },
  { label: "Full Access", done: false },
];

export default function RegistrationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const state = (location.state as LocationState) || {};
  const { email = "", name = "", organizationName = "", role = "" } = state;

  const [checking, setChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    status: string;
    approved_at?: string;
    rejection_reason?: string;
  } | null>(null);

  const handleCheckStatus = useCallback(async () => {
    if (!email) {
      toast.warning("Email Missing", "We couldn't find your email. Please register again.");
      return;
    }
    setChecking(true);
    setStatusResult(null);
    try {
      const res = await AuthAPI.checkUserStatus(email);
      const data = res.data.data;
      setStatusResult(data);

      if (data.status === "approved") {
        toast.success(
          "Account Approved!",
          "Your account has been approved! Check your email for the OTP."
        );
        // Navigate to OTP verification
        navigate("/verify-otp", { state: { email } });
      } else if (data.status === "active") {
        toast.success("Account Active!", "Your account is fully verified. You can now login.");
        navigate("/login");
      } else if (data.status === "blocked") {
        toast.error("Registration Rejected", data.rejection_reason || "Your registration was rejected.");
      } else {
        toast.info?.("Still Pending", "Your registration is still under review. Please check back later.");
      }
    } catch (err: any) {
      toast.error(
        "Status Check Failed",
        err.response?.data?.message || "Could not check status. Please try again."
      );
    } finally {
      setChecking(false);
    }
  }, [email, navigate, toast]);

  const statusBadge = statusResult?.status;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-secondary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent dark:from-secondary/10" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl dark:bg-secondary/10 animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/10 animate-pulse-glow [animation-delay:1.5s]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-10">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md dark:bg-card/80 dark:border-white/[0.06]">
            <CardHeader className="text-center space-y-4 pb-4 px-8 pt-10">
              {/* Animated clock icon */}
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/25"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <Clock className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Registration Submitted!
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Your application is under review by the administrator.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="px-8 pb-10 space-y-6">
              {/* User details summary */}
              {(name || email || organizationName || role) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5 dark:border-primary/10 dark:bg-primary/5"
                >
                  {name && (
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{email}</span>
                    </div>
                  )}
                  {organizationName && (
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{organizationName}</span>
                    </div>
                  )}
                  {role && (
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm capitalize">{role}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Approval flow steps */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  What happens next
                </p>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border dark:bg-white/[0.08]" />
                  <div className="space-y-4">
                    {STEPS.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            s.done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : i === 1
                              ? "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-400/10"
                              : "border-muted-foreground/30 bg-background text-muted-foreground"
                          }`}
                        >
                          {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                        </div>
                        <span
                          className={`text-sm ${
                            s.done
                              ? "font-semibold text-emerald-600 dark:text-emerald-400"
                              : i === 1
                              ? "font-semibold text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                          {i === 1 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              In progress
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Status check result */}
              {statusBadge && statusBadge === "blocked" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2"
                >
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Registration Rejected</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {statusResult?.rejection_reason || "Please contact support for details."}
                    </p>
                  </div>
                </motion.div>
              )}

              {statusBadge === "pending" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  Still pending — the admin hasn't reviewed yet. Please check back later.
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 pt-2"
              >
                <Button
                  onClick={handleCheckStatus}
                  disabled={checking || !email}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Approval Status
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    asChild
                    className="h-10 dark:border-white/[0.08]"
                  >
                    <Link to="/login">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Go to Login
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="h-10 dark:border-white/[0.08]"
                  >
                    <Link to="/contact">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Info notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-start gap-2 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once approved, you will receive an email with a 6-digit OTP to verify
                  your account. After verification, you can login with your credentials.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
