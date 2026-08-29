import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Calendar,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  Building2, Briefcase, Shield, UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { AuthAPI } from "@/api/auth.api";

interface OrgOption {
  _id: string;
  name: string;
  organization_id?: string;
  allowed_registration_roles?: string[];
  plan?: string;
}
interface RoleOption {
  _id: string;
  role_name: string;
  description?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  organization_id: string;
  role: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string; email?: string; phone?: string; dob?: string;
  organization_id?: string; role?: string;
  password?: string; confirmPassword?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  name: "", email: "", phone: "", dob: "",
  organization_id: "", role: "",
  password: "", confirmPassword: "",
};

function validateForm(data: FormData): FormErrors {
  const e: FormErrors = {};
  if (!data.name.trim()) e.name = "Full name is required";
  if (!data.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Invalid email format";
  if (data.phone && !/^\+?[\d\s\-()]{7,}$/.test(data.phone)) e.phone = "Invalid phone number";
  if (!data.organization_id) e.organization_id = "Please select an organization";
  if (!data.role) e.role = "Please select a role";
  if (!data.password) e.password = "Password is required";
  else if (data.password.length < 8) e.password = "Password must be at least 8 characters";
  if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
  return e;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AuthAPI.getOrganizations()
        .then((r: any) => setOrganizations(r.data?.data || []))
        .catch((err) => console.error("Failed to fetch organizations:", err)),
      AuthAPI.getRoles()
        .then((r: any) => {
          const fetchedRoles = r.data?.data || [];
          if (fetchedRoles.length > 0) {
            setRoles(fetchedRoles);
          } else {
            setRoles([
              { _id: "admin", role_name: "Organization Admin" },
              { _id: "branch_admin", role_name: "Branch Admin" },
              { _id: "support", role_name: "Support Agent" },
              { _id: "customer", role_name: "Customer" },
            ]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch roles:", err);
          setRoles([
            { _id: "admin", role_name: "Organization Admin" },
            { _id: "branch_admin", role_name: "Branch Admin" },
            { _id: "support", role_name: "Support Agent" },
            { _id: "customer", role_name: "Customer" },
          ]);
        }),
    ]).finally(() => {
      setOrgsLoading(false);
      setRolesLoading(false);
    });
  }, []);

  const selectedOrg = organizations.find((o) => o._id === form.organization_id || o.organization_id === form.organization_id);
  const availableRoles = roles.filter((r) => {
    if (!selectedOrg || !Array.isArray(selectedOrg.allowed_registration_roles) || selectedOrg.allowed_registration_roles.length === 0) {
      return true;
    }
    return selectedOrg.allowed_registration_roles.includes(r._id);
  });

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "organization_id") {
      const org = organizations.find((o) => o._id === value || o.organization_id === value);
      const allowed = org?.allowed_registration_roles;
      setForm((prev) => ({
        ...prev,
        organization_id: value,
        role: allowed && allowed.length > 0 && !allowed.includes(prev.role) ? "" : prev.role,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
      if (name === "password") {
        let s = 0;
        if (value.length >= 8) s++;
        if (value.length >= 10) s++;
        if (/[A-Z]/.test(value) && /[0-9]/.test(value)) s++;
        if (/[^a-zA-Z0-9]/.test(value)) s++;
        setPwStrength(s);
    }
    if (touched[name]) {
      setErrors((prev) => {
        const updated = validateForm({ ...form, [name]: value });
        return { ...prev, [name]: updated[name as keyof FormErrors] };
      });
    }
  }, [form, touched]);

  const handleBlur = useCallback((
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => {
      const updated = validateForm({ ...form, [name]: value });
      return { ...prev, [name]: updated[name as keyof FormErrors] };
    });
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const validation = validateForm(form);
    setErrors(validation);
    setTouched({ name: true, email: true, phone: true, dob: true, organization_id: true, role: true, password: true, confirmPassword: true });
    if (Object.values(validation).some(Boolean)) return;

    setLoading(true);
    try {
      await AuthAPI.registerWithApproval({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        dob: form.dob || undefined,
        password: form.password,
        organization_id: form.organization_id,
        role: form.role,
      });
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      if (err?.response?.data?.errors) {
        const serverErrors = err.response.data.errors;
        setErrors((prev) => ({ ...prev, ...serverErrors, general: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
    } finally {
      setLoading(false);
    }
  }, [form, loading]);

  const strengthColors = ["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9"];
  const strengthLabels = ["Weak", "Fair", "Strong", "Very strong"];

  if (step === "success") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5">
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md dark:bg-card/80 dark:border-white/[0.06]">
              <CardHeader className="text-center space-y-4 pb-4 px-8 pt-10">
                <motion.div
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-400/25"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <CardTitle className="text-2xl sm:text-3xl font-bold">Registration Submitted!</CardTitle>
                  <CardDescription className="text-base mt-1">Your application is under review by the administrator.</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5 dark:border-primary/10"
                >
                  {form.name && <div className="flex items-center gap-2.5"><User className="h-4 w-4 text-primary shrink-0" /><span className="text-sm font-medium">{form.name}</span></div>}
                  {form.email && <div className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-primary shrink-0" /><span className="text-sm text-muted-foreground">{form.email}</span></div>}
                  {organizations.find((o) => o._id === form.organization_id) && (
                    <div className="flex items-center gap-2.5"><Building2 className="h-4 w-4 text-primary shrink-0" /><span className="text-sm">{organizations.find((o) => o._id === form.organization_id)?.name}</span></div>
                  )}
                  {roles.find((r) => r._id === form.role) && (
                    <div className="flex items-center gap-2.5"><Briefcase className="h-4 w-4 text-primary shrink-0" /><span className="text-sm capitalize">{roles.find((r) => r._id === form.role)?.role_name}</span></div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    Status: Pending Approval
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">You will receive an email once your account has been approved.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3 pt-2">
                  <Button
                    onClick={() => navigate("/registration-status", { state: { email: form.email } })}
                    variant="outline"
                    className="w-full h-11"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full h-11">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-6 sm:px-10 py-8 sm:py-10 dark:bg-card/80 dark:border-white/[0.06]">
            <CardHeader className="text-center space-y-3 pb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <UserCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">Create Account</CardTitle>
                <CardDescription>Register for a new organization account</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <AnimatePresence>
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-center gap-2 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle size={14} />
                    <span>{errors.general}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                      className={`pl-10 h-11 ${errors.name ? "border-destructive" : ""}`} aria-invalid={!!errors.name} required />
                  </div>
                  {errors.name && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="john@company.com" value={form.email} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                      className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`} aria-invalid={!!errors.email} required />
                  </div>
                  {errors.email && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                        className={`pl-10 h-11 ${errors.phone ? "border-destructive" : ""}`} aria-invalid={!!errors.phone} />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob">DOB</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                        className={`pl-10 h-11 ${errors.dob ? "border-destructive" : ""}`} aria-invalid={!!errors.dob} />
                    </div>
                    {errors.dob && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.dob}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="organization_id">Organization</Label>
                    <div className="relative">
                      <select id="organization_id" name="organization_id" value={form.organization_id} onChange={handleChange} onBlur={handleBlur}
                        disabled={loading || orgsLoading}
                        className={`select-field pl-10 h-11 ${errors.organization_id ? "border-destructive" : ""}`}
                        aria-invalid={!!errors.organization_id} required>
                        <option value="">{orgsLoading ? "Loading..." : "Select"}</option>
                        {organizations.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
                      </select>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.organization_id && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.organization_id}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Role</Label>
                    <div className="relative">
                      <select id="role" name="role" value={form.role} onChange={handleChange} onBlur={handleBlur}
                        disabled={loading || rolesLoading}
                        className={`select-field pl-10 h-11 ${errors.role ? "border-destructive" : ""}`}
                        aria-invalid={!!errors.role} required>
                        <option value="">{rolesLoading ? "Loading..." : "Select"}</option>
                        {availableRoles.map((r) => (
                          <option key={r._id} value={r._id}>{r.role_name}</option>
                        ))}
                      </select>
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.role && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.role}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters"
                      value={form.password} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                      className={`pl-10 pr-12 h-11 ${errors.password ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.password} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide" : "Show"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-0.5 flex-1 rounded-full transition-colors duration-300"
                            style={{ background: i <= pwStrength ? strengthColors[Math.max(pwStrength - 1, 0)] : "hsl(var(--border))" }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: pwStrength > 0 ? strengthColors[Math.min(pwStrength - 1, 3)] : "hsl(var(--muted-foreground))" }}>
                        {pwStrength > 0 ? strengthLabels[Math.min(pwStrength - 1, 3)] : ""}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat password"
                      value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} disabled={loading}
                      className={`pl-10 pr-12 h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.confirmPassword} required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide" : "Show"}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert"><AlertCircle size={12} />{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50">
                  {loading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Registering...</> : <><ArrowRight className="mr-2 h-4 w-4" /> Register</>}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
