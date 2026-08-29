import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Award, Building2,
  AlertCircle, CheckCircle2, Clock, XCircle, Globe, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { AuthAPI } from "@/api/auth.api";
import { useAppSettings } from "@/hooks/useAppSettings";
import OAuthButtons from "@/components/OAuthButtons";

type LoginStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid_credentials" }
  | { type: "pending_approval"; email: string }
  | { type: "otp_required"; email: string }
  | { type: "rejected"; reason?: string };

interface OrgOption { _id: string; name: string }

export default function Login() {
  const { tenant, tenantLoading, setSession } = useAuthContext();
  const { settings: appSettings } = useAppSettings();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>({ type: "idle" });

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  useEffect(() => {
    if (tenant) { setOrgId(tenant._id); setOrgsLoading(false); return; }
    if (tenantLoading) return;
    setOrgsLoading(true);
    AuthAPI.getOrganizations()
      .then((res: any) => setOrganizations(res.data.data || []))
      .catch((err) => console.error("Failed to fetch organizations:", err))
      .finally(() => setOrgsLoading(false));
  }, [tenant, tenantLoading]);

  const isLoading = status.type === "loading";
  const showOrgSelector = !tenant && !tenantLoading;

  const navigateToDashboard = useCallback((role?: string) => {
    const r = (role || "").toLowerCase().replace(/[\s_]+/g, "_");
    if (r === "super_admin") navigate("/superadmin/dashboard", { replace: true });
    else if (r === "admin" || r === "branch_admin") navigate("/admin/dashboard", { replace: true });
    else if (r === "branch_admin") navigate("/branch/dashboard", { replace: true });
    else if (r === "support") navigate("/support/dashboard", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email || !password) { setStatus({ type: "invalid_credentials" }); return; }
    if (showOrgSelector && !orgId) { setStatus({ type: "invalid_credentials" }); return; }

    setStatus({ type: "loading" });

    if (rememberMe) localStorage.setItem("rememberedEmail", email);
    else localStorage.removeItem("rememberedEmail");

    try {
      const res = await AuthAPI.login({
        email: email.trim(),
        password,
        ...(showOrgSelector ? { organization_id: orgId } : {}),
      });

      const { success, status: userStatus, token, data, message } = res.data;

      if (success && token) {
        sessionStorage.setItem("just_logged_in", "true");
        if (!setSession(res.data)) {
          setStatus({ type: "invalid_credentials" });
          return;
        }
        navigateToDashboard(data?.role || data?.roleName);
        return;
      }

      if (res.data.twoFactorRequired) {
        setStatus({ type: "otp_required", email: email.trim() });
        navigate("/verify-otp", { state: { email: email.trim(), mode: "2fa" } });
        return;
      }

      if (userStatus === "PENDING_APPROVAL") {
        setStatus({ type: "pending_approval", email: email.trim() });
      } else if (userStatus === "OTP_REQUIRED") {
        setStatus({ type: "otp_required", email: email.trim() });
      } else if (userStatus === "ACCOUNT_REJECTED") {
        setStatus({ type: "rejected", reason: message });
      } else {
        setStatus({ type: "invalid_credentials" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "";
      const s = err?.response?.data?.status;
      if (s === "PENDING_APPROVAL") {
        setStatus({ type: "pending_approval", email: email.trim() });
      } else if (s === "OTP_REQUIRED") {
        setStatus({ type: "otp_required", email: email.trim() });
      } else if (s === "ACCOUNT_REJECTED") {
        setStatus({ type: "rejected", reason: msg });
      } else {
        setStatus({ type: "invalid_credentials" });
      }
    }
  }, [email, password, orgId, rememberMe, showOrgSelector, isLoading, navigateToDashboard]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
    else if (name === "orgId") setOrgId(value);
    if (status.type !== "idle") setStatus({ type: "idle" });
  }, [status]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-6 sm:px-10 py-8 sm:py-10 dark:bg-card/80 dark:border-white/[0.06]">
            <CardHeader className="text-center space-y-3 pb-6">
              {tenant?.logo?.url ? (
                <div className="mx-auto mb-2">
                  <img src={tenant.logo.url} alt={tenant.name || "Logo"} className="max-h-14 w-auto object-contain" />
                </div>
              ) : appSettings?.logo?.url ? (
                <div className="mx-auto mb-2">
                  <img src={appSettings.logo.url} alt={appSettings.app_name || "Logo"} className="max-h-14 w-auto object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Award className="w-8 h-8 text-primary-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  {tenant ? tenant.name || "Welcome" : appSettings?.login_page?.title || "Welcome Back"}
                </CardTitle>
                <CardDescription>
                  {tenant
                    ? `Sign in to your ${tenant.name || "organization"} account`
                    : appSettings?.login_page?.subtitle || "Sign in to your organization account"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {/* Status cards */}
              <AnimatePresence mode="wait">
                {status.type === "pending_approval" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Pending Approval</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                          Your registration is awaiting administrator approval. We'll notify you once approved.
                        </p>
                        <Link
                          to="/registration-status"
                          state={{ email: status.email }}
                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Check Status
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status.type === "otp_required" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Account Approved</p>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                          Your account has been approved. Please verify the OTP sent to your email.
                        </p>
                        <Link
                          to="/verify-otp"
                          state={{ email: status.email, mode: "2fa" }}
                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Verify OTP
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status.type === "rejected" && (
                  <motion.div
                    key="rejected"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-destructive">Registration Rejected</p>
                        <p className="text-xs text-destructive/80">
                          {status.reason ? `Reason: ${status.reason}` : "Your registration was rejected."}
                        </p>
                        <Link to="/contact" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-destructive hover:underline">
                          <ExternalLink size={12} />
                          Contact Support
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status.type === "invalid_credentials" && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
                    role="alert"
                  >
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle size={14} />
                      <span>Incorrect email or password.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                {showOrgSelector && (
                  <div className="space-y-1.5">
                    <Label htmlFor="orgId">Organization</Label>
                    <div className="relative">
                      <select
                        id="orgId"
                        name="orgId"
                        value={orgId}
                        onChange={handleChange}
                        disabled={isLoading || orgsLoading}
                        className="select-field pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                        required
                      >
                        <option value="">{orgsLoading ? "Loading organizations..." : "Select your organization"}</option>
                        {organizations.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
                      </select>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                {tenant && !tenantLoading && (
                  <div className="rounded-lg border dark:border-white/[0.06] bg-muted/30 px-4 py-3 flex items-center gap-3">
                    <Globe size={16} className="text-primary shrink-0" />
                    <span className="text-sm"><span className="font-medium">{tenant.name}</span><span className="text-muted-foreground ml-1">— signing in</span></span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" name="email" type="email" placeholder="Enter your email"
                      autoComplete="email" autoFocus
                      value={email} onChange={handleChange}
                      disabled={isLoading}
                      className="pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                      required
                      aria-invalid={!!(errors.email && touched.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p id="email-error" className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password" name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password} onChange={handleChange}
                      disabled={isLoading}
                      className="pl-10 pr-12 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                      required
                      aria-invalid={!!(errors.password && touched.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p id="password-error" className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Remember Me
                  </Label>
                </div>

                {/* OAuth Providers */}
                <OAuthButtons />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-2 text-center text-sm">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="font-medium text-primary hover:underline">Sign Up</Link>
                </p>
                <p>
                  <Link to="/registration-status" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                    Check Registration Status
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
