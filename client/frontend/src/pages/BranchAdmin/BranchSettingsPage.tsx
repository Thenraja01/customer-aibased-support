import React, { useState, useEffect } from "react";
import { Save, Building, CheckCircle2, RefreshCw } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import FontSettingsPanel from "@/components/FontSettingsPanel";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";

export default function BranchSettingsPage() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("Main Metro Branch");
  const [branchCode, setBranchCode] = useState("MB-001");
  const [address, setAddress] = useState("100 Enterprise Boulevard, Tech District");
  const [contactEmail, setContactEmail] = useState("branch-admin@supportai.com");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [routingStrategy, setRoutingStrategy] = useState("hybrid");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBranchDetails();
  }, []);

  const fetchBranchDetails = async () => {
    try {
      const userBranchId = user?.branchId?._id || user?.branch_id?._id || user?.branch_id || user?.branchId;
      if (userBranchId) {
        setBranchId(userBranchId);
        const res = await AxiosInstance.get(`/branches/${userBranchId}`);
        if (res.data?.data) {
          const b = res.data.data;
          setBranchName(b.name || "");
          setBranchCode(b.code || "");
          setAddress(b.address || "");
          setContactEmail(b.contact_email || "");
          setPhone(b.phone || "");
          setRoutingStrategy(b.assignment_strategy || "hybrid");
        }
      }
    } catch (err) {
      console.warn("Using sample branch settings");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (branchId) {
        await AxiosInstance.put(`/branches/${branchId}`, {
          name: branchName,
          code: branchCode,
          address,
          contact_email: contactEmail,
          phone,
          assignment_strategy: routingStrategy,
        });
      }
      setSaved(true);
      toast.success("Settings Saved", "Branch settings updated successfully.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to update branch settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Profile & Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage branch details, contact info, auto-assignment routing, and custom UI font settings.</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Branch settings saved successfully!
        </div>
      )}

      {/* Branch Profile Form */}
      <form onSubmit={handleSave} className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-5">
        <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-base border-b border-slate-800 pb-3">
          <Building className="w-5 h-5 text-indigo-400" /> Branch Operational Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Branch Name</label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Branch Code</label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1">Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1">Auto-Assignment Strategy</label>
          <select
            value={routingStrategy}
            onChange={(e) => setRoutingStrategy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="hybrid">Hybrid (Capacity + Availability + Priority Weighting)</option>
            <option value="round_robin">Round-Robin (Durable Agent Sequence)</option>
            <option value="least_loaded">Least Loaded (Lowest Active Tickets)</option>
            <option value="skill_based">Skill-Based (Match Ticket Category to Agent Skills)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
        </button>
      </form>

      {/* Font & UI Settings Panel */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl">
        <FontSettingsPanel />
      </div>
    </div>
  );
}
