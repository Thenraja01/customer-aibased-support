import { useState, useEffect, useCallback } from "react";
import { KeyRound, Plus, Copy, Trash2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface OrgApiKey {
  _id: string;
  name: string;
  is_active: boolean;
  key_preview: string | null;
  last_used: string | null;
  created_at: string;
}

export default function ApiKeysPanel() {
  const toast = useToast();
  const [keys, setKeys] = useState<OrgApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<OrgApiKey | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.getOrgApiKeys();
      setKeys(res.data.data || []);
    } catch {
      toast.error("Error", "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Validation", "Enter a name for this key");
      return;
    }
    setCreating(true);
    try {
      const res = await AdminAPI.createOrgApiKeyForOrg(name.trim());
      toast.success("Created", "API key created. Copy it now — it is shown only once.");
      setRevealed(res.data.data.key);
      setName("");
      load();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Error", "Copy failed");
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await AdminAPI.revokeOrgApiKeyForOrg(revokeTarget._id);
      toast.success("Revoked", "API key disabled");
      setRevokeTarget(null);
      load();
    } catch {
      toast.error("Error", "Failed to revoke key");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          API Keys
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Programmatic keys for your organization. Keys are stored as a hash — the full key is shown only once, at creation.
        </p>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] p-4">
        <p className="text-sm font-semibold mb-3">Create a new key</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Key name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production webhook" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
              Generate Key
            </Button>
          </div>
        </div>
      </div>

      {revealed && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Key created — copy it now</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-background border dark:border-white/[0.06] px-3 py-2 text-xs font-mono break-all">{revealed}</code>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">For security, this key cannot be retrieved again. Revoke it at any time.</p>
        </div>
      )}

      <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-white/[0.06]">
          <p className="text-sm font-semibold">Your keys ({keys.length})</p>
        </div>
        {keys.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No API keys yet.</div>
        ) : (
          <div className="divide-y dark:divide-white/[0.06]">
            {keys.map((k) => (
              <div key={k._id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{k.name}</p>
                    <Badge variant={k.is_active ? "default" : "secondary"}>{k.is_active ? "Active" : "Revoked"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{k.key_preview || "—"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used ? ` · last used ${new Date(k.last_used).toLocaleDateString()}` : ""}
                  </p>
                </div>
                {k.is_active && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRevokeTarget(k)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke API key?"
        message={`This permanently disables "${revokeTarget?.name}". Any service using this key will stop working.`}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}