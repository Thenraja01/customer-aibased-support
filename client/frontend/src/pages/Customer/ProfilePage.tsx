import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  Lock,
  KeyRound,
  Shield,
  Bot,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Type,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI } from "@/api/user.api";
import { getRoleName } from "@/lib/roles";
import FontSettingsPanel from "@/components/FontSettingsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";

type Tab = "profile" | "security" | "appearance";

type UserData = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role?: string;
  roleName?: string;
  two_factor_enabled?: boolean;
  status: string;
  organization_id?: { name?: string; _id?: string } | string;
  created_at?: string;
  profileImage?: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, token, logout, setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const base = backendUrl.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Error", "File is too large. Max size is 5MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Error", "Only JPG, PNG, GIF, and WEBP images are allowed.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await UsersAPI.updateAvatar(formData);
      if (res.data?.success) {
        toast.success("Success", "Profile avatar updated successfully");
        const newUrl = res.data.data.profileImage;
        setProfile((prev) => prev ? { ...prev, profileImage: newUrl } : prev);
        
        setSession({
          token,
          user: {
            ...user,
            profileImage: newUrl
          }
        });
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to upload avatar");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UsersAPI.getProfile();
      if (res?.data?.success) {
        setProfile(res.data.data);
        setTwoFactorEnabled(res.data.data.two_factor_enabled ?? false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to load profile";
      toast.error("Error", msg);
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [toast, navigate, logout]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, token, fetchProfile, navigate]);

  const roleName = getRoleName(profile || user);
  const orgName =
    typeof (profile || user)?.organization_id === "object"
      ? (profile || user)?.organization_id?.name
      : undefined;

  const displayRole = roleName?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Customer";
  const displayName = profile?.name || user?.name || "—";
  const displayEmail = profile?.email || user?.email || "—";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await UsersAPI.updateProfile({
        name: profile.name,
        phone: profile.phone || "",
      });
      if (res?.data?.success) {
        toast.success("Success", "Profile updated successfully");
        setSession({
          token,
          user: {
            ...user,
            name: profile.name,
            phone: profile.phone || "",
          }
        });
        await fetchProfile();
      } else {
        toast.error("Error", res?.data?.message || "Failed to update profile");
      }
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

  const handleToggleTwoFactor = useCallback(async (checked: boolean) => {
    const previous = twoFactorEnabled;
    setTwoFactorEnabled(checked);
    setToggling2FA(true);
    try {
      if (checked) {
        await UsersAPI.enable2FA();
      } else {
        await UsersAPI.disable2FA();
      }
      toast.success("Success", `Two-factor authentication ${checked ? "enabled" : "disabled"}`);
      setSession({
        token,
        user: {
          ...user,
          two_factor_enabled: checked
        }
      });
    } catch (err: any) {
      setTwoFactorEnabled(previous);
      toast.error("Error", err.response?.data?.message || "Failed to update two-factor authentication");
    } finally {
      setToggling2FA(false);
    }
  }, [twoFactorEnabled, toast, user, token, setSession]);

  const goBack = () => {
    if (roleName === "super_admin") return navigate("/superadmin/dashboard");
    if (roleName === "admin") return navigate("/admin/dashboard");
    if (roleName === "support") return navigate("/support/dashboard");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={goBack}
        className="mb-6 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </motion.button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border bg-card p-6 mb-6"
      >
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {(uploading || saving) && (
              <div className="absolute -inset-1 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin z-10" />
            )}
            <div
              onClick={() => !uploading && !saving && fileInputRef.current?.click()}
              className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-sky-500 text-xl font-semibold text-white flex items-center justify-center cursor-pointer group border border-white/[0.06] shadow-md transition-all duration-200"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : profile?.profileImage ? (
                <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <span className="absolute bottom-0.5 right-0.5 z-20 h-3.5 w-3.5 rounded-full border-[2px] border-card bg-green-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold truncate">{displayName}</h2>
            <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {displayRole}
              {orgName && ` at ${orgName}`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 flex gap-1 rounded-lg border bg-card p-1"
      >
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Security", icon: Lock },
          { id: "appearance", label: "Appearance", icon: Type },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <User size={14} />
                  </span>
                  Personal information
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profile?.name || ""}
                        onChange={(e) => setProfile((p) => p ? { ...p, name: e.target.value } : p)}
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
                        value={profile?.email || ""}
                        disabled
                        className="pl-10 opacity-60"
                      />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <AlertCircle size={11} /> Email is managed by your organization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profile?.phone || ""}
                        onChange={(e) => setProfile((p) => p ? { ...p, phone: e.target.value } : p)}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="mt-6 w-full">
                  {saving ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Change Password */}
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <KeyRound size={14} />
                  </span>
                  Change password
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
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
                          setPasswordData({ ...passwordData, newPassword: e.target.value });
                          checkPwStrength(e.target.value);
                        }}
                        placeholder="At least 6 characters"
                        className="pl-10"
                        required
                      />
                    </div>
                    {passwordData.newPassword && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 w-6 rounded-full transition-colors"
                              style={{
                                background:
                                  i <= pwStrength
                                    ? ["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9"][
                                        Math.max(pwStrength - 1, 0)
                                      ]
                                    : "hsl(var(--border))",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {["", "Weak", "Fair", "Strong", "Very strong"][pwStrength] || ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="Repeat new password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400"
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
                      className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
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
                  className="mt-6 w-full"
                >
                  {savingPassword && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Update password
                </Button>
              </div>
            </form>

            {/* Security Settings */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                  <Shield size={14} />
                </span>
                Security settings
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone size={15} className="text-muted-foreground shrink-0" />
                    <span>Two-factor authentication</span>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggleTwoFactor}
                    loading={toggling2FA}
                    disabled={toggling2FA}
                    aria-label="Toggle two-factor authentication"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={15} className="text-muted-foreground shrink-0" />
                    <span>Session timeout</span>
                  </div>
                  <span className="text-xs text-muted-foreground">30 minutes</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Bot size={15} className="text-muted-foreground shrink-0" />
                    <span>AI session logging</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-lg border bg-card p-6">
              <FontSettingsPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
