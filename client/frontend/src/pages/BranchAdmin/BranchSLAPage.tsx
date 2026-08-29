import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Save, Calendar, ShieldAlert, Loader2 } from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

export default function BranchSLAPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<any>({
    sla_settings: {
      urgent: { first_response_minutes: 30, resolution_minutes: 240 },
      high: { first_response_minutes: 60, resolution_minutes: 480 },
      medium: { first_response_minutes: 240, resolution_minutes: 1440 },
      low: { first_response_minutes: 720, resolution_minutes: 2880 },
    },
    auto_close_settings: {
      enabled: true,
      closing_period_hours: 48,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await AdminAPI.getOrgSettings();
        if (res.data?.success) {
          const d = res.data.data;
          setForm({
            ...d,
            sla_settings: d.sla_settings || {
              urgent: { first_response_minutes: 30, resolution_minutes: 240 },
              high: { first_response_minutes: 60, resolution_minutes: 480 },
              medium: { first_response_minutes: 240, resolution_minutes: 1440 },
              low: { first_response_minutes: 720, resolution_minutes: 2880 },
            },
            auto_close_settings: d.auto_close_settings || {
              enabled: true,
              closing_period_hours: 48,
            },
          });
        }
      } catch (err) {
        console.error("Failed to load org SLA settings", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await AdminAPI.updateOrgSettings(form);
      if (res.data?.success) {
        setSaved(true);
        toast.success("Saved", "SLA & Auto-close policies updated successfully!");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save SLA settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSlaField = (priority: string, field: string, value: number) => {
    setForm((prev: any) => ({
      ...prev,
      sla_settings: {
        ...prev.sla_settings,
        [priority]: {
          ...(prev.sla_settings?.[priority] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateAutoClose = (field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      auto_close_settings: {
        ...(prev.auto_close_settings || {}),
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-500" />
        Loading SLA Policies...
      </div>
    );
  }

  const sla = form.sla_settings || {};
  const autoClose = form.auto_close_settings || { enabled: true, closing_period_hours: 48 };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Branch SLA & Auto-Close Policies</h1>
          <p className="text-slate-400 text-sm mt-1">Configure first response & resolution targets, along with automated ticket closing rules after resolution.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving Policy..." : "Save SLA Policy"}
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Branch SLA & Auto-Close policy updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Targets */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Response & Resolution SLA Targets
          </h2>

          <div className="space-y-4 text-sm">
            {[
              { key: "urgent", label: "Urgent Priority", defResp: 30, defRes: 240 },
              { key: "high", label: "High Priority", defResp: 60, defRes: 480 },
              { key: "medium", label: "Medium Priority", defResp: 240, defRes: 1440 },
              { key: "low", label: "Low Priority", defResp: 720, defRes: 2880 },
            ].map((p) => {
              const resp = sla[p.key]?.first_response_minutes ?? p.defResp;
              const res = sla[p.key]?.resolution_minutes ?? p.defRes;

              return (
                <div key={p.key} className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <label className="text-slate-300 font-medium block text-xs">{p.label}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">First Resp (mins)</span>
                      <input
                        type="number"
                        min="1"
                        value={resp}
                        onChange={(e) => updateSlaField(p.key, "first_response_minutes", Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Resolution (mins)</span>
                      <input
                        type="number"
                        min="1"
                        value={res}
                        onChange={(e) => updateSlaField(p.key, "resolution_minutes", Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-Close Settings */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Auto-Close Resolved Tickets
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <span className="text-slate-200 font-medium block text-xs">Enable Ticket Auto-Close</span>
                <span className="text-[11px] text-slate-400">Automatically close tickets after customer inactivity.</span>
              </div>
              <input
                type="checkbox"
                checked={autoClose.enabled !== false}
                onChange={(e) => updateAutoClose("enabled", e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {autoClose.enabled !== false && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <label className="text-slate-300 font-medium block text-xs">Closing Grace Period (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={autoClose.closing_period_hours ?? 48}
                  onChange={(e) => updateAutoClose("closing_period_hours", Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Resolved tickets will automatically transition to <strong>Closed</strong> after{" "}
                  <strong className="text-indigo-400">{autoClose.closing_period_hours ?? 48} hours</strong> (~
                  {((autoClose.closing_period_hours ?? 48) / 24).toFixed(1)} days) of resolution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
