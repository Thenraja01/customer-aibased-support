import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Check,
  X,
  RefreshCw,
  Layers,
  CheckCircle2,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { TicketTemplateAPI } from "@/api";

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

export default function TicketTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    default_priority: "medium",
    default_subject: "",
    default_description: "",
  });
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TicketTemplateAPI.getAll();
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch {
      toast.error("Error", "Failed to load ticket templates");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      default_priority: "medium",
      default_subject: "",
      default_description: "",
    });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormData({
      name: t.name,
      category: t.category,
      default_priority: t.default_priority,
      default_subject: t.default_subject,
      default_description: t.default_description,
    });
    setShowForm(true);
  };

  const handleDuplicate = async (t: Template) => {
    try {
      await TicketTemplateAPI.create({
        name: `${t.name} (Copy)`,
        category: t.category,
        default_priority: t.default_priority,
        default_subject: t.default_subject,
        default_description: t.default_description,
      });
      toast.success("Template Duplicated", `Created a copy of ${t.name}`);
      loadTemplates();
    } catch {
      toast.error("Error", "Failed to duplicate template");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.default_subject.trim() || !formData.default_description.trim()) {
      toast.warning("Validation Required", "All fields must be filled out.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await TicketTemplateAPI.update(editing._id, formData);
        toast.success("Template Updated", "Template changes saved successfully.");
      } else {
        await TicketTemplateAPI.create(formData);
        toast.success("Template Published", "New ticket template created.");
      }
      resetForm();
      loadTemplates();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Template) => {
    if (!confirm(`Are you sure you want to delete "${t.name}"?`)) return;
    try {
      await TicketTemplateAPI.delete(t._id);
      toast.success("Template Deleted", `Removed "${t.name}"`);
      loadTemplates();
    } catch {
      toast.error("Error", "Failed to delete template");
    }
  };

  const toggleActive = async (t: Template) => {
    try {
      await TicketTemplateAPI.update(t._id, { is_active: !t.is_active });
      toast.success("Status Updated", `Template is now ${!t.is_active ? "Live" : "Disabled"}`);
      loadTemplates();
    } catch {
      toast.error("Error", "Failed to update template status");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Ticket Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preconfigured ticket form blueprints for quick, structured customer issue submission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 bg-card rounded-xl border border-border">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          Loading ticket templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-base font-semibold text-foreground">No Ticket Templates Yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create standard templates like "System Failure" or "Customer Support Request".
          </p>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((t) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{t.name}</h3>
                  <span className="text-xs text-muted-foreground font-mono">Category: {t.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    t.is_active
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                  }`}>
                    {t.is_active ? <CheckCircle2 className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    {t.is_active ? "Live" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground">Default Subject:</p>
                <p className="font-medium text-foreground">{t.default_subject}</p>
                <p className="text-xs font-semibold text-muted-foreground pt-1">Default Description:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.default_description}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewTemplate(t)} className="h-8 gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(t)} className="h-8 gap-1 text-xs">
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="h-8 gap-1 text-xs">
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(t)} className="h-8 gap-1 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant={t.is_active ? "ghost" : "default"}
                  onClick={() => toggleActive(t)}
                  className="h-8 text-xs gap-1"
                >
                  {t.is_active ? "Disable" : "Publish Live"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Drawer / Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-lg text-foreground">
                  {editing ? "Edit Template" : "New Ticket Template"}
                </h3>
                <Button size="icon" variant="ghost" onClick={resetForm} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Template Name</Label>
                  <Input
                    placeholder="e.g. System / Hardware Failure"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input
                      placeholder="e.g. Technical Support"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Default Priority</Label>
                    <select
                      value={formData.default_priority}
                      onChange={(e) => setFormData({ ...formData, default_priority: e.target.value })}
                      className="w-full bg-card border border-border rounded-md text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Default Subject</Label>
                  <Input
                    placeholder="e.g. [Urgent] System Hardware Failure"
                    value={formData.default_subject}
                    onChange={(e) => setFormData({ ...formData, default_subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Default Description Template</Label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue..."
                    value={formData.default_description}
                    onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                    className="w-full bg-card border border-border rounded-md text-sm p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* AI Assignee Policy & SLA Target Live Preview Box */}
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-orange-500 text-[11px] uppercase tracking-wider">
                    <span>AI Intelligence & Policy Rules Preview</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">Auto-Evaluated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-background/80 p-2 rounded border border-orange-500/20">
                      <span className="text-muted-foreground block text-[10px]">Assignee Policy Match</span>
                      <span className="font-bold text-foreground">
                        {formData.category?.toLowerCase().includes("tech") || formData.category?.toLowerCase().includes("hardware")
                          ? "Hardware & IT Support Team"
                          : formData.category?.toLowerCase().includes("bill")
                          ? "Billing & Finance Team"
                          : "General Support Team"}
                      </span>
                    </div>
                    <div className="bg-background/80 p-2 rounded border border-orange-500/20">
                      <span className="text-muted-foreground block text-[10px]">SLA Resolution Target</span>
                      <span className="font-bold text-foreground">
                        {formData.default_priority === "urgent"
                          ? "4 Hours (Warning: 50% / 2h)"
                          : formData.default_priority === "high"
                          ? "8 Hours (Warning: 50% / 4h)"
                          : "24 Hours (Warning: 50% / 12h)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" onClick={resetForm} disabled={saving} className="h-9 px-4 text-xs font-semibold">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="h-9 px-4 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white gap-1.5 shadow-md">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {editing ? "Save Changes" : "Publish Template"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Customer Live Preview
                </h3>
                <Button size="icon" variant="ghost" onClick={() => setPreviewTemplate(null)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input value={previewTemplate.default_subject} readOnly className="bg-card" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Input value={previewTemplate.category} readOnly className="bg-card" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <textarea rows={4} value={previewTemplate.default_description} readOnly className="w-full bg-card border border-border rounded-md text-sm p-3" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setPreviewTemplate(null)}>Close Preview</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
