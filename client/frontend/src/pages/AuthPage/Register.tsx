import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  Eye,
  EyeOff,
  CheckCircle2,
  Building2,
  UserCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Check,
  Shield,
  Info,
  Users,
  Briefcase,
} from "lucide-react";

interface Org {
  _id: string;
  name: string;
}

interface Role {
  _id: string;
  role_name: string;
  description?: string;
}

type Step = 1 | 2;

const STEPS: { id: Step; title: string; caption: string }[] = [
  { id: 1, title: "Personal Info", caption: "Tell us about yourself" },
  { id: 2, title: "Organization & Role", caption: "Where you belong" },
];

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
};

// Roles to hide from registration
const HIDDEN_ROLES = ["tenant admin", "super admin"];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    organization_id: "",
    role_id: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [registrationId, setRegistrationId] = useState("");

  useEffect(() => {
    setOrgsLoading(true);
    AuthAPI.getOrganizations()
      .then((res: any) => setOrgs(res.data.data || []))
      .catch(() => toast.warning("Warning", "Failed to load organizations"))
      .finally(() => setOrgsLoading(false));

    setRolesLoading(true);
    AuthAPI.getRoles()
      .then((res: any) => {
        const allRoles = res.data.data || [];
        const filteredRoles = allRoles.filter(
          (role: Role) => 
            !HIDDEN_ROLES.some(hidden => 
              role.role_name.toLowerCase() === hidden.toLowerCase()
            )
        );
        setRoles(filteredRoles);
      })
      .catch(() => toast.warning("Warning", "Failed to load roles"))
      .finally(() => setRolesLoading(false));
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/registration-pending", { 
          state: { 
            email: form.email,
            organizationName: orgs.find(o => o._id === form.organization_id)?.name || "",
            registrationId: registrationId,
            name: form.name,
            role: roles.find(r => r._id === form.role_id)?.role_name || ""
          },
          replace: true 
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, navigate, form, orgs, roles, registrationId]);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (error) setError("");
    },
    [error]
  );

  /* ---------------- Password strength ---------------- */
  const passwordChecks = [
    { label: "At least 8 characters", met: form.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(form.password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(form.password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const strengthScore = passwordChecks.filter((c) => c.met).length; // 0–4
  const strengthMeta = [
    { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
    { label: "Fair", bar: "bg-amber-500", text: "text-amber-500" },
    { label: "Good", bar: "bg-blue-500", text: "text-blue-500" },
    { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-500" },
  ] as const;
  const strength = strengthScore > 0 ? strengthMeta[strengthScore - 1] : null;

  /* ---------------- Step navigation ---------------- */
  const validateStep1 = useCallback((): boolean => {
    if (!form.name.trim()) {
      setError("Full name is required.");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    setError("");
    return true;
  }, [form]);

  const goNext = useCallback(() => {
    if (!validateStep1()) return;
    setDirection(1);
    setStep(2);
  }, [validateStep1]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setError("");
    setStep(1);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Enter key / Next on step 1 advances instead of submitting
      if (step === 1) {
        goNext();
        return;
      }

      setError("");

      if (!form.organization_id) {
        setError("Please select an organization.");
        return;
      }
      if (!form.role_id) {
        setError("Please select a role.");
        return;
      }

      setLoading(true);
      try {
        // Register with approval workflow
        const res = await AuthAPI.registerWithApproval({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          dob: form.dob || undefined,
          organization_id: form.organization_id,
          role_id: form.role_id,
          status: "pending", // Pending admin approval
        });

        if (res.data.success) {
          setRegistrationId(res.data.data.registrationId || res.data.data._id);
          setSuccess(true);
          toast.success(
            "Registration Submitted", 
            "Your account is pending admin approval. You'll receive an email once approved."
          );
        } else {
          toast.error("Registration Failed", res.data.message || "Please check your inputs.");
        }
      } catch (err: any) {
        toast.error(
          "Registration Failed", 
          err.response?.data?.message || "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [step, form, goNext]
  );

  /* ---------------- Success screen ---------------- */
  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-secondary/5">
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-md text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-8 py-12 dark:bg-card/80 dark:border-white/[0.06]">
              <CardContent className="space-y-4">
                <motion.div
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold">Registration Submitted!</h2>
                  <p className="text-muted-foreground">
                    Your account registration has been submitted for review.
                  </p>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{form.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">{form.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {orgs.find(o => o._id === form.organization_id)?.name || "Organization"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {roles.find(r => r._id === form.role_id)?.role_name || "Role"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Redirecting to pending page...</span>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ---------------- Wizard ---------------- */
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-secondary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent dark:from-secondary/10" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl dark:bg-secondary/10 animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/10 animate-pulse-glow [animation-delay:1.5s]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-6 py-10 sm:px-12 sm:py-12 dark:bg-card/80 dark:border-white/[0.06] dark:shadow-2xl dark:shadow-black/10">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
                <CardDescription>{STEPS[step - 1].caption}</CardDescription>
              </div>
            </CardHeader>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-muted-foreground">
                  Step {step} of {STEPS.length}
                </span>
                <span className="font-semibold">{STEPS[step - 1].title}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden dark:bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={false}
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
              <div className="relative flex items-start justify-between mt-4">
                {STEPS.map((s) => {
                  const isActive = step === s.id;
                  const isComplete = step > s.id;
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                          isComplete
                            ? "border-primary bg-primary text-primary-foreground"
                            : isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 bg-background text-muted-foreground"
                        }`}
                      >
                        {isComplete ? <Check className="h-4 w-4" /> : s.id}
                      </motion.div>
                      <span
                        className={`text-[10px] sm:text-xs text-center leading-tight ${
                          isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <CardContent className="p-0">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait" custom={direction}>
                  {step === 1 ? (
                    <motion.div
                      key="step-1"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      {/* ---- Step 1: Personal Information ---- */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            className="pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="name@company.com"
                              value={form.email}
                              onChange={(e) => updateField("email", e.target.value)}
                              className="pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 XXXXX XXXXX"
                              value={form.phone}
                              onChange={(e) => updateField("phone", e.target.value)}
                              className="pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="dob"
                            type="date"
                            value={form.dob}
                            onChange={(e) => updateField("dob", e.target.value)}
                            className="pl-10 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            className="pl-10 pr-12 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>

                        {/* Strength meter */}
                        {form.password.length > 0 && strength && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex flex-1 gap-1">
                              {[0, 1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                                    i < strengthScore ? strength.bar : "bg-muted dark:bg-white/[0.06]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-xs font-medium ${strength.text}`}>
                              {strength.label}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1 mt-2">
                          {passwordChecks.map((check) => (
                            <div
                              key={check.label}
                              className={`flex items-center gap-1.5 text-xs ${
                                check.met ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              <CheckCircle2
                                className={`h-3 w-3 ${
                                  check.met ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                              {check.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={(e) => updateField("confirmPassword", e.target.value)}
                            className="pl-10 pr-12 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          <AlertCircle size={14} />
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-2"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      {/* ---- Step 2: Organization & Role ---- */}
                      <div className="rounded-lg border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{form.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{form.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={goBack}
                          className="shrink-0 text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organization" className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Organization
                        </Label>
                        <div className="relative">
                          <select
                            id="organization"
                            value={form.organization_id}
                            onChange={(e) => updateField("organization_id", e.target.value)}
                            className="select-field pl-10 dark:border-white/[0.06] dark:focus:border-primary/40"
                            required
                            disabled={orgsLoading}
                            autoFocus
                          >
                            <option value="">
                              {orgsLoading ? "Loading..." : "Select organization"}
                            </option>
                            {orgs.map((org) => (
                              <option key={org._id} value={org._id}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="flex items-center gap-1.5">
                          <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          Role
                        </Label>
                        <div className="relative">
                          <select
                            id="role"
                            value={form.role_id}
                            onChange={(e) => updateField("role_id", e.target.value)}
                            className="select-field pl-10 dark:border-white/[0.06] dark:focus:border-primary/40"
                            required
                            disabled={rolesLoading}
                          >
                            <option value="">
                              {rolesLoading ? "Loading..." : "Select role"}
                            </option>
                            {roles.map((role) => (
                              <option key={role._id} value={role._id}>
                                {role.role_name} {role.description ? `- ${role.description}` : ""}
                              </option>
                            ))}
                          </select>
                          <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {!rolesLoading && roles.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            No roles available for registration
                          </p>
                        )}
                      </div>

                      {/* Approval Notice */}
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Shield size={16} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-foreground">Admin Approval Required</p>
                            <p className="text-muted-foreground">
                              Your registration will be reviewed by an administrator. 
                              You'll receive a verification email once approved.
                            </p>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          <AlertCircle size={14} />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBack}
                          disabled={loading}
                          className="h-11 px-5 dark:border-white/[0.06]"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || orgsLoading || rolesLoading || roles.length === 0}
                          className="flex-1 h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
                        >
                          {loading ? (
                            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              Submit for Approval
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}