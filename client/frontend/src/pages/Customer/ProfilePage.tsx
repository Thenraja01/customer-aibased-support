import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  Ghost,
  LockIcon,
  Shield,
  ShieldCheckIcon,
  Smartphone,
  Clock,
  Bot,
  UserCircle,
  Activity,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI } from "@/api/user.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

type Tab = "profile" | "security";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 14 } },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "Customer Experience",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpEmail, setOtpEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [otpNewPassword, setOtpNewPassword] = useState("");
  const [otpConfirmPassword, setOtpConfirmPassword] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpPwStrength, setOtpPwStrength] = useState(0);

  // Sync form if user loads after mount
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        department: user.department || prev.department,
      }));
    }
  }, [user]);

  const roleName =
    typeof user?.role_id === "object" ? user?.role_id?.role_name : user?.role_id;
  const orgName =
    typeof user?.organization_id === "object"
      ? user?.organization_id?.name
      : user?.organization_id;

  const displayRole = roleName?.replace("_", " ") || "Support Agent";
  const initials = formData.name
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await UsersAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      toast.success("Success", "Profile updated successfully");
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const checkPwStrength = (val: string) => {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    setPwStrength(score);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      setSavingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setSavingPassword(false);
      return;
    }

    try {
      await UsersAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordSuccess("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwStrength(0);
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const strengthColors = ["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9"];
  const strengthLabels = ["Weak", "Fair", "Strong", "Very strong"];

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");
    try {
      const res = await UsersAPI.requestOtp(otpEmail);
      setOtpMessage(res.data.message);
      setOtpStep("verify");
      toast.success("OTP Sent", "Check your email for the verification code");
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
      toast.error("Error", err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");

    if (otpNewPassword !== otpConfirmPassword) {
      setOtpError("Passwords do not match");
      setOtpLoading(false);
      return;
    }
    if (otpNewPassword.length < 8) {
      setOtpError("Password must be at least 8 characters");
      setOtpLoading(false);
      return;
    }

    try {
      await UsersAPI.verifyOtp(otpEmail, otp);
      await UsersAPI.resetPasswordWithOtp(otpEmail, otp, otpNewPassword);
      toast.success("Success", "Password changed successfully");
      setOtpStep("request");
      setOtp("");
      setOtpNewPassword("");
      setOtpConfirmPassword("");
      setOtpPwStrength(0);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to change password");
      toast.error("Error", err.response?.data?.message || "Failed to change password");
    } finally {
      setOtpLoading(false);
    }
  };

  const checkOtpPwStrength = (val: string) => {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    setOtpPwStrength(score);
  };

  const goBack = () => {
    if (roleName === "super_admin" || roleName === "admin") {
      navigate("/admin/dashboard");
    } else if (roleName === "support") {
      navigate("/support/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back nav */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </button>
      </motion.div>

      {/* Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border bg-card p-6 mb-4"
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glows */}
        <div
          className="pointer-events-none absolute -top-10 right-14 h-40 w-52 opacity-60"
          style={{
            background: "radial-gradient(ellipse, rgba(99,102,241,0.22) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-10 h-32 w-40 opacity-50"
          style={{
            background: "radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex items-center gap-5">
          {/* Avatar with animated ring */}
          <div className="relative flex-shrink-0">
            <motion.svg
              className="absolute -inset-1.5"
              viewBox="0 0 74 74"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <circle
                cx="37"
                cy="37"
                r="34"
                stroke="url(#ringGrad)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="74" y2="74">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </motion.svg>
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-semibold text-white shadow-[0_0_0_3px_hsl(var(--card))]">
              {initials}
            </div>
            <span className="absolute bottom-0.5 right-0.5 z-20 h-3.5 w-3.5 rounded-full border-[2px] border-card bg-green-500">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{formData.name || "—"}</h2>
            <p className="text-sm text-muted-foreground">{formData.email || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                {displayRole}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <Bot size={10} />
                AI-assisted
              </span>
              {orgName && (
                <span className="text-[11px] text-muted-foreground px-2 py-0.5">
                  {orgName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Role", value: displayRole, raw: true },
            { label: "Department", value: formData.department, raw: true },
            { label: "Status", value: "Active", raw: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="rounded-xl border bg-muted/40 p-3 text-center transition-colors hover:border-accent hover:bg-muted/60"
            >
              <div className="text-sm font-semibold truncate">
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Assistant Chip */}
      <motion.div
        variants={itemVariants}
        className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-3"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-xs">
          <Ghost size={16} />
        </div>
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground font-medium">AI assistant active.</strong> Your profile is synced with the support knowledge base. Response suggestions are enabled.
        </p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-1 w-1 rounded-full bg-accent"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="mb-4 flex gap-1 rounded-xl border bg-card p-1"
        role="tablist"
      >
        {([
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Security", icon: Lock },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-muted shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={14} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-5 flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <UserCircle size={14} />
                </span>
                Personal information
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="pl-10 opacity-60"
                    />
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <AlertCircle size={11} />
                    Email is managed by your organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="dept"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save changes
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Change Password */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-5 flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheckIcon size={14} />
                </span>
                Change password
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        });
                        checkPwStrength(e.target.value);
                      }}
                      placeholder="At least 6 characters"
                      className="pl-10"
                      required
                    />
                  </div>
                  {passwordData.newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-0.5 flex-1 rounded-full transition-colors duration-300"
                            style={{
                              background:
                                i <= pwStrength
                                  ? strengthColors[Math.max(pwStrength - 1, 0)]
                                  : "hsl(var(--border))",
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-[11px] font-medium"
                        style={{
                          color:
                            pwStrength > 0
                              ? strengthColors[Math.max(pwStrength - 1, 0)]
                              : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {pwStrength > 0
                          ? strengthLabels[Math.min(pwStrength - 1, 3)]
                          : ""}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Repeat new password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 overflow-hidden rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400"
                    >
                      <CheckCircle2 size={14} />
                      {passwordSuccess}
                    </motion.div>
                  )}
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 overflow-hidden rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
                    >
                      <AlertCircle size={14} />
                      {passwordError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={savingPassword}
                  variant="outline"
                  className="w-full"
                >
                  {savingPassword && (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  )}
                  Update password
                </Button>
              </form>
            </div>

            {/* Change Password with OTP */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-5 flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Fingerprint size={14} />
                </span>
                Change password with OTP
              </div>

              {otpStep === "request" ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    We'll send a one-time password to your email to verify your identity before changing your password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="otpEmail">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otpEmail"
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertCircle size={14} />
                      {otpError}
                    </div>
                  )}

                  <Button type="submit" disabled={otpLoading} variant="outline" className="w-full">
                    {otpLoading ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Mail size={16} className="mr-2" />
                    )}
                    Send OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndPassword} className="space-y-4">
                  {otpMessage && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 size={14} />
                      {otpMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        className="pl-10 tracking-[0.5em] text-center"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otpNewPassword">New password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otpNewPassword"
                        type="password"
                        value={otpNewPassword}
                        onChange={(e) => {
                          setOtpNewPassword(e.target.value);
                          checkOtpPwStrength(e.target.value);
                        }}
                        placeholder="At least 8 characters"
                        className="pl-10"
                        required
                      />
                    </div>
                    {otpNewPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-0.5 flex-1 rounded-full transition-colors duration-300"
                              style={{
                                background:
                                  i <= otpPwStrength
                                    ? strengthColors[Math.max(otpPwStrength - 1, 0)]
                                    : "hsl(var(--border))",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-[11px] font-medium"
                          style={{
                            color:
                              otpPwStrength > 0
                                ? strengthColors[Math.max(otpPwStrength - 1, 0)]
                                : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {otpPwStrength > 0
                            ? strengthLabels[Math.min(otpPwStrength - 1, 3)]
                            : ""}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otpConfirmPassword">Confirm new password</Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otpConfirmPassword"
                        type="password"
                        value={otpConfirmPassword}
                        onChange={(e) => setOtpConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertCircle size={14} />
                      {otpError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setOtpStep("request");
                        setOtp("");
                        setOtpNewPassword("");
                        setOtpConfirmPassword("");
                        setOtpError("");
                        setOtpMessage("");
                        setOtpPwStrength(0);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={otpLoading} className="flex-1">
                      {otpLoading ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <ShieldCheckIcon size={16} className="mr-2" />
                      )}
                      Verify & Change
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Security Status */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-5 flex items-center gap-2 border-b pb-3 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                  <Shield size={14} />
                </span>
                Security status
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone size={15} className="text-muted-foreground" />
                    Two-factor authentication
                  </div>
                  <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                    Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={15} className="text-muted-foreground" />
                    Session timeout
                  </div>
                  <span className="text-xs text-muted-foreground">30 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Bot size={15} className="text-muted-foreground" />
                    AI session logging
                  </div>
                  <span className="inline-flex items-center rounded-full border bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}