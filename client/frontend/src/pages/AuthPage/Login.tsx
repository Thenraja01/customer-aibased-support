import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Award, Building2, AlertCircle, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { AuthAPI } from "@/api/auth.api";
import { useAppSettings } from "@/hooks/useAppSettings";

interface OrgOption {
  _id: string;
  name: string;
}

interface FormErrors {
  organization?: string;
  email?: string;
  password?: string;
}

export default function Login() {
  const { loginWithOrg, tenant, tenantLoading } = useAuthContext();
  const { settings: appSettings } = useAppSettings();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState("");

  const [formData, setFormData] = useState({
    organizationId: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData((prev) => ({ ...prev, organizationId: tenant._id }));
      setOrgsLoading(false);
      return;
    }

    if (tenantLoading) return;

    setOrgsLoading(true);
    setOrgsError("");
    AuthAPI.getOrganizations()
      .then((res: any) => setOrganizations(res.data.data || []))
      .catch(() => setOrgsError("Failed to load organizations"))
      .finally(() => setOrgsLoading(false));
  }, [tenant, tenantLoading]);

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "organizationId":
        return value ? "" : "Please select an organization";
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      default:
        return "";
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!tenant) {
      const orgErr = validateField("organizationId", formData.organizationId);
      if (orgErr) { newErrors.organization = orgErr; isValid = false; }
    }

    const emailErr = validateField("email", formData.email);
    if (emailErr) { newErrors.email = emailErr; isValid = false; }

    const passErr = validateField("password", formData.password);
    if (passErr) { newErrors.password = passErr; isValid = false; }

    setErrors(newErrors);
    setTouched({ organizationId: true, email: true, password: true });
    return isValid;
  }, [formData, validateField, tenant]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
    if (apiError) setApiError("");
  }, [touched, validateField, apiError]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      const success = await loginWithOrg(
        formData.email.trim(),
        formData.password.trim(),
        formData.organizationId
      );

      if (!success) {
        setApiError("Invalid email, password, or organization.");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user?.role_id?.role_name?.toLowerCase();

      switch (role) {
        case "super_admin":
          navigate("/superadmin", { replace: true });
          break;
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "support":
          navigate("/support/dashboard", { replace: true });
          break;
        case "customer":
        case "user":
          navigate("/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, validateForm, loginWithOrg, formData, navigate]);

  const showOrgSelector = !tenant && !tenantLoading;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/10 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl dark:bg-secondary/10 animate-pulse-glow [animation-delay:1.5s]" />

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
                  <img
                    src={tenant.logo.url}
                    alt={tenant.name || "Organization logo"}
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
              ) : appSettings?.logo?.url ? (
                <div className="mx-auto mb-2">
                  <img
                    src={appSettings.logo.url}
                    alt={appSettings.app_name || "Logo"}
                    className="max-h-14 w-auto object-contain"
                  />
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
              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                {showOrgSelector && (
                  <div className="space-y-1.5">
                    <Label htmlFor="organizationId" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Organization
                    </Label>
                    <div className="relative">
                      <select
                        id="organizationId"
                        name="organizationId"
                        value={formData.organizationId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`select-field pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40 ${
                          errors.organization && touched.organizationId ? "border-destructive" : ""
                        }`}
                        required
                        disabled={orgsLoading}
                        aria-invalid={!!(errors.organization && touched.organizationId)}
                        aria-describedby={errors.organization ? "org-error" : undefined}
                      >
                        <option value="">
                          {orgsLoading ? "Loading organizations..." : "Select your organization"}
                        </option>
                        {organizations.map((org) => (
                          <option key={org._id} value={org._id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.organization && touched.organizationId && (
                      <p id="org-error" className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                        <AlertCircle size={12} />
                        {errors.organization}
                      </p>
                    )}
                    {orgsError && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                        <AlertCircle size={12} />
                        {orgsError}
                      </p>
                    )}
                  </div>
                )}

                {tenant && !tenantLoading && (
                  <div className="rounded-lg border dark:border-white/[0.06] bg-muted/30 px-4 py-3 flex items-center gap-3">
                    <Globe size={16} className="text-primary shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">{tenant.name}</span>
                      <span className="text-muted-foreground ml-1">— signing in to this organization</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40 ${
                        errors.email && touched.email ? "border-destructive" : ""
                      }`}
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
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`pl-10 pr-12 h-11 dark:border-white/[0.06] dark:focus:border-primary/40 ${
                        errors.password && touched.password ? "border-destructive" : ""
                      }`}
                      required
                      aria-invalid={!!(errors.password && touched.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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

                {apiError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle size={14} />
                    <span>{apiError}</span>
                  </div>
                )}

                {Object.keys(errors).length > 0 && !apiError && Object.values(errors).some(Boolean) && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle size={14} />
                    <span>Please fix the errors above before signing in.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || orgsLoading || tenantLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Sign Up
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
