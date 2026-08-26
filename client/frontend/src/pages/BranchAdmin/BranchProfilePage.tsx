import React, { useState, useEffect } from "react";
import { 
  User, Building2, Shield, Key, Lock, CheckCircle2, AlertCircle, 
  RefreshCw, Save
} from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import { useAuthContext } from "@/context/AuthContext";

export default function BranchProfilePage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      await AxiosInstance.put("/users/profile", { name, phone });
      setProfileMessage("Profile updated successfully!");
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match");
      return;
    }
    setPassLoading(true);
    setPassMessage(null);
    setPassError(null);
    try {
      await AxiosInstance.put("/users/change-password", { currentPassword, newPassword });
      setPassMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPassLoading(false);
    }
  };

  const branchName = user?.branch_id?.name || user?.branchId?.name || "Main Branch";
  const orgName = user?.organization_id?.name || user?.organizationId?.name || "SupportAI Organization";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
            {user?.name?.[0] || "B"}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.name || "Branch Administrator"}</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> {branchName} • <Shield className="w-4 h-4 text-emerald-400" /> Branch Admin
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Branch Info Card */}
        <div className="md:col-span-1 bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-5">
          <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-emerald-400" /> Branch Details
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-slate-400 block text-xs font-medium">Organization</span>
              <span className="text-slate-200 font-semibold">{orgName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">Assigned Branch</span>
              <span className="text-slate-200 font-semibold">{branchName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">System Role</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-1">
                Branch Administrator
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">Security Scope</span>
              <span className="text-slate-300 text-xs mt-1 block">Full administrative authority over branch staff, tickets, documents, SLAs, and customer operations.</span>
            </div>
          </div>
        </div>

        {/* Profile & Password Update Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-5">
            <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-indigo-400" /> Personal Information
            </h2>

            {profileMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-5">
            <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-base">
              <Lock className="w-5 h-5 text-amber-400" /> Password & Authentication
            </h2>

            {passMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {passMessage}
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-600/25 transition disabled:opacity-50"
                >
                  {passLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
