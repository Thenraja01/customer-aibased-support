import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Camera,
  Building2,
  GitBranch,
  Check,
  RotateCcw,
  BadgeCheck,
  Eye,
  Type,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI } from "@/api/user.api";
import { getRoleName } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import FontSettingsPanel from "@/components/FontSettingsPanel";

type Tab = "profile" | "security" | "font";

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
  branch_id?: { name?: string; _id?: string; code?: string } | string;
  created_at?: string;
  profileImage?: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, token, logout, setSession, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile data states
  const [profile, setProfile] = useState<UserData | null>(null);
  const [, setLoading] = useState(true);
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
      toast.error("File Too Large", "Max avatar upload size is 5MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported Format", "Only JPG, PNG, GIF, and WEBP formats are allowed.");
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
        toast.success("Avatar Updated", "Your profile photo has been refreshed.");
        const newUrl = res.data.data.profileImage;
        setProfile((prev) => (prev ? { ...prev, profileImage: newUrl } : prev));
        updateUser({ profileImage: newUrl });
      }
    } catch (err: any) {
      toast.error("Upload Failed", err.response?.data?.message || "Failed to update profile photo.");
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
        updateUser(res.data.data);
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
  const branchName =
    typeof (profile || user)?.branch_id === "object"
      ? (profile || user)?.branch_id?.name
      : undefined;

  const displayRole = roleName?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Customer";
  const displayName = profile?.name || user?.name || "—";
  const displayEmail = profile?.email || user?.email || "—";

  const initials =
    displayName
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
        toast.success("Profile Saved", "Account information updated successfully.");
        setSession({
          token,
          user: {
            ...user,
            name: profile.name,
            phone: profile.phone || "",
          },
        });
        await fetchProfile();
      } else {
        toast.error("Update Failed", res?.data?.message || "Failed to save profile changes.");
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to save profile.");
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
      setPasswordSuccess("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwStrength(0);
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTwoFactor = useCallback(
    async (checked: boolean) => {
      const previous = twoFactorEnabled;
      setTwoFactorEnabled(checked);
      setToggling2FA(true);
      try {
        const res = await UsersAPI.toggleTwoFactor(checked);
        if (res?.data?.success) {
          toast.success(
            checked ? "2FA Enabled" : "2FA Disabled",
            checked
              ? "Two-factor authentication is now active on your account."
              : "Two-factor authentication has been disabled."
          );
        } else {
          setTwoFactorEnabled(previous);
          toast.error("Error", res?.data?.message || "Could not update 2FA status.");
        }
      } catch (err: any) {
        setTwoFactorEnabled(previous);
        toast.error("Error", err.response?.data?.message || "Could not update 2FA status.");
      } finally {
        setToggling2FA(false);
      }
    },
    [twoFactorEnabled, toast]
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans p-6 md:p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <User size={24} />
            </span>
            Profile &amp; Preferences
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your personal profile, custom theme styling, typography, and account security.
          </p>
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
          <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={
                profile?.profileImage
                  ? getImageUrl(profile.profileImage)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=ffffff&bold=true&rounded=true&format=svg`
              }
              alt={displayName}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">{displayName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{displayRole}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-6">
        {[
          { id: "profile", label: "Personal Details", icon: User },
          { id: "security", label: "Security & Credentials", icon: Shield },
          { id: "font", label: "Font Customization", icon: Type },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold tracking-wide transition-all ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERSONAL DETAILS */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-4xl"
          >
            {/* Avatar & Basic Info Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-muted border-2 border-border overflow-hidden flex items-center justify-center shadow-inner">
                    <img
                      src={
                        previewUrl ||
                        (profile?.profileImage
                          ? getImageUrl(profile.profileImage)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=ffffff&bold=true&rounded=true&format=svg`)
                      }
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-transform"
                    title="Change Avatar"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-bold">{displayName}</h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">
                      {displayRole}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                      <BadgeCheck size={12} className="text-primary" /> Active User
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{displayEmail}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
                    {orgName && (
                      <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
                        <Building2 size={13} className="text-primary" />
                        {orgName}
                      </span>
                    )}
                    {branchName && (
                      <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
                        <GitBranch size={13} className="text-cyan-500" />
                        {branchName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-1">Account Information</h3>
                <p className="text-xs text-muted-foreground">Update your display name and contact phone number.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="name"
                      type="text"
                      required
                      value={profile?.name || ""}
                      onChange={(e) => setProfile(profile ? { ...profile, name: e.target.value } : null)}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address (Read Only)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="email"
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="pl-9 h-10 text-xs bg-muted/40 cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={profile?.phone || ""}
                      onChange={(e) => setProfile(profile ? { ...profile, phone: e.target.value } : null)}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold">System Assigned Role</Label>
                  <Input
                    id="role"
                    type="text"
                    disabled
                    value={displayRole}
                    className="h-10 text-xs bg-muted/40 cursor-not-allowed opacity-80 font-mono capitalize"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground font-semibold text-xs h-9 px-5 shadow-sm active:scale-95 transition-transform"
                >
                  {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SECURITY & CREDENTIALS */}
        {/* ========================================================================= */}
        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-4xl"
          >
            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-1 flex items-center gap-2">
                  <KeyRound size={18} className="text-primary" />
                  Change Account Password
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ensure your password is at least 6 characters with a combination of uppercase letters, numbers, and symbols.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="currentPassword"
                      type="password"
                      required
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="newPassword"
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value });
                        checkPwStrength(e.target.value);
                      }}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  {passwordData.newPassword && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-7 rounded-full transition-colors ${
                              i <= pwStrength
                                ? ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500"][Math.max(pwStrength - 1, 0)]
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {["", "Weak", "Fair", "Strong", "Very strong"][pwStrength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {passwordError}
                </div>
              )}

              <div className="flex justify-start pt-2">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="bg-primary text-primary-foreground font-semibold text-xs h-9 px-5 shadow-sm active:scale-95"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Lock size={14} className="mr-1.5" />}
                  Update Password
                </Button>
              </div>
            </form>

            {/* Advanced Security Toggles */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-1 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-400" />
                  Authentication &amp; Session Guardrails
                </h3>
                <p className="text-xs text-muted-foreground">Manage two-factor authentication and session monitoring.</p>
              </div>

              <div className="divide-y divide-border">
                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-xs">Two-Factor Authentication (2FA)</p>
                      <p className="text-[11px] text-muted-foreground">Requires one-time OTP verification on login.</p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggleTwoFactor}
                    disabled={toggling2FA}
                  />
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-xs">Session Inactivity Timeout</p>
                      <p className="text-[11px] text-muted-foreground">Automatically logs out inactive sessions.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                    30 Minutes
                  </span>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot size={18} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-xs">AI Copilot Action Audit Logging</p>
                      <p className="text-[11px] text-muted-foreground">Records all AI tool executions under your account ID.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Always Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FONT & TYPOGRAPHY CUSTOMIZATION */}
        {/* ========================================================================= */}
        {activeTab === "font" && (
          <motion.div
            key="font"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Type className="text-primary" size={18} /> Font & Typography Preferences
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize your personal interface font family, sizing, line height, and letter spacing across the workspace.
              </p>
            </div>

            <FontSettingsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
