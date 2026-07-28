import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TicketTemplateAPI } from "@/api";
import { useToast } from "@/components/ui/toast";

interface Template {
  _id: string;
  name: string;
  category: string;
  default_priority: string;
  default_subject: string;
  default_description: string;
  is_active: boolean;
}

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TicketTemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "", default_priority: "medium", default_subject: "", default_description: "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await TicketTemplateAPI.getAll();
      if (res.data.success) setTemplates(res.data.data || []);
    } catch { toast.error("Error", "Failed to load templates"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "", default_priority: "medium", default_subject: "", default_description: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormData({ name: t.name, category: t.category, default_priority: t.default_priority, default_subject: t.default_subject, default_description: t.default_description });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.default_subject.trim() || !formData.default_description.trim()) {
      toast.warning("Warning", "All fields are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await TicketTemplateAPI.update(editing._id, formData);
      } else {
        await TicketTemplateAPI.create(formData);
      }
      resetForm();
      loadTemplates();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to save template");
    } finally { setSaving(false); }
  };

  const handleDelete = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await TicketTemplateAPI.delete(t._id);
      loadTemplates();
    } catch { toast.error("Error", "Failed to delete template"); }
  };

  const toggleActive = async (t: Template) => {
    try {
      await TicketTemplateAPI.update(t._id, { is_active: !t.is_active });
      loadTemplates();
    } catch { toast.error("Error", "Failed to update template"); }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-500/10 text-orange-600";
      case "medium": return "bg-primary/10 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preconfigured ticket templates for quick ticket creation.</p>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={14} className="mr-1" /> New Template
        </Button>
      </div>




      {showForm && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. IT Support" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Technical" />
            </div>
            <div className="space-y-1.5">
              <Label>Default Priority</Label>
              <select value={formData.default_priority} onChange={(e) => setFormData(p => ({ ...p, default_priority: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Subject</Label>
              <Input value={formData.default_subject} onChange={(e) => setFormData(p => ({ ...p, default_subject: e.target.value }))} placeholder="e.g. Computer Issue" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Default Description (use placeholders like {"{field_name}"} for user input)</Label>
            <textarea value={formData.default_description} onChange={(e) => setFormData(p => ({ ...p, default_description: e.target.value }))}
              placeholder="Describe your issue:&#10;&#8226; Device Name:&#10;&#8226; Operating System:&#10;&#8226; Error Message:"
              rows={5} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No ticket templates yet.</p>
          <p className="text-xs text-muted-foreground/70">Create templates to speed up ticket creation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t._id} className="rounded-xl border bg-card p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.category}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColor(t.default_priority)}`}>{t.default_priority}</span>
                  {!t.is_active && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">disabled</span>}
                </div>
                <p className="text-xs text-muted-foreground font-medium">{t.default_subject}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 whitespace-pre-wrap">{t.default_description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(t)} className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${t.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`} title={t.is_active ? "Disable" : "Enable"}>
                  {t.is_active ? <Check size={14} /> : <X size={14} />}
                </button>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
