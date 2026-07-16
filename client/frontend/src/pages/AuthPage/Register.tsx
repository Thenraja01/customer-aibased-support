import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import ThemeToggle from "@/components/ThemeToggle";
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
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Org {
  _id: string;
  name: string;
}

interface Role {
  _id: string;
  role_name: string;
}

export default function Register() {
  const navigate = useNavigate();

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
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    setOrgsLoading(true);
    setFetchError("");
    AuthAPI.getOrganizations()
      .then((res: any) => setOrgs(res.data.data || []))
      .catch(() => setFetchError("Failed to load organizations"))
      .finally(() => setOrgsLoading(false));

    setRolesLoading(true);
    AuthAPI.getRoles()
      .then((res: any) => setRoles(res.data.data || []))
      .catch(() => setFetchError("Failed to load roles"))
      .finally(() => setRolesLoading(false));
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/login", { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (error) setError("");
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!form.name.trim()) {
        setError("Full name is required.");
        return;
      }
      if (!form.email.trim()) {
        setError("Email is required.");
        return;
      }
      if (!form.organization_id) {
        setError("Please select an organization.");
        return;
      }
      if (!form.role_id) {
        setError("Please select a role.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);
      try {
        const res = await AuthAPI.signup({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          dob: form.dob || undefined,
          organization_id: form.organization_id,
          role_id: form.role_id,
        });

        if (res.data.success) {
          setSuccess(true);
        } else {
          setError(res.data.message || "Registration failed. Please check your inputs.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate]
  );

  const passwordChecks = [
    { label: "At least 6 characters", met: form.password.length >= 6 },
    { label: "Contains a number", met: /\d/.test(form.password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(form.password) },
  ];

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
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Registration Successful!</h2>
                <p className="text-muted-foreground">
                  Your account has been created. Redirecting to login...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Redirecting in 2 seconds</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-8 py-10 sm:px-12 sm:py-12 dark:bg-card/80 dark:border-white/[0.06] dark:shadow-2xl dark:shadow-black/10">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">
                  Create an account
                </CardTitle>
                <CardDescription>
                  Register with your organization details
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {fetchError && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle size={14} />
                  {fetchError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="organization"
                      className="flex items-center gap-1.5"
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Organization
                    </Label>
                    <div className="relative">
                      <select
                        id="organization"
                        value={form.organization_id}
                        onChange={(e) =>
                          updateField("organization_id", e.target.value)
                        }
                        className="select-field pl-10 dark:border-white/[0.06] dark:focus:border-primary/40"
                        required
                        disabled={orgsLoading}
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
                    <Label
                      htmlFor="role"
                      className="flex items-center gap-1.5"
                    >
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
                            {role.role_name}
                          </option>
                        ))}
                      </select>
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                            check.met
                              ? "text-primary"
                              : "text-muted-foreground"
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
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-12 h-11 dark:border-white/[0.06] dark:focus:border-primary/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
                  disabled={loading || orgsLoading || rolesLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="mt-6 text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:underline"
                  >
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
