import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, HelpCircle, AlertCircle, X, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FAQAPI } from "@/api";

interface FaqItem {
  _id: string;
  organization_id: any;
  question: string;
  answer: string;
  is_active: boolean;
  status: string;
  category: string;
  created_by?: { _id: string; name: string };
  approved_by?: { _id: string; name: string };
}

export default function FAQPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id?._id || user?.organization_id;

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", is_active: true, category: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = statusFilter ? await FAQAPI.getByStatus(statusFilter) : await FAQAPI.getAll();
      if (res.data.success) {
        let items = res.data.data || [];
        if (orgId) items = items.filter((f: FaqItem) => f.organization_id === orgId || f.organization_id?._id === orgId);
        setFaqs(items);
      }
    } catch {
      setError("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [orgId, statusFilter]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const resetForm = () => {
    setFormData({ question: "", answer: "", is_active: true, category: "" });
    setFormErrors({});
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq);
    setFormData({ question: faq.question, answer: faq.answer, is_active: faq.is_active, category: faq.category || "" });
    setFormErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.question.trim()) errs.question = "Question is required";
    if (formData.question.length > 500) errs.question = "Max 500 characters";
    if (!formData.answer.trim()) errs.answer = "Answer is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...formData, organization_id: orgId };
      if (editing) {
        await FAQAPI.update(editing._id, payload);
      } else {
        await FAQAPI.create(payload);
      }
      resetForm();
      fetchFaqs();
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to save FAQ" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: FaqItem) => {
    if (!confirm(`Delete FAQ: "${faq.question}"?`)) return;
    try {
      await FAQAPI.delete(faq._id);
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete FAQ");
    }
  };

  const toggleActive = async (faq: FaqItem) => {
    try {
      await FAQAPI.update(faq._id, { is_active: !faq.is_active });
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update FAQ");
    }
  };

  const handleApprove = async (faq: FaqItem) => {
    try {
      await FAQAPI.approve(faq._id);
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve FAQ");
    }
  };

  const handleReject = async (faq: FaqItem) => {
    const reason = prompt("Rejection reason (optional):");
    try {
      await FAQAPI.reject(faq._id, reason || "");
      fetchFaqs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject FAQ");
    }
  };

  const statusFilters = ["", "draft", "pending", "approved", "rejected"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "draft": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage FAQs with approval workflow.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          New FAQ
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
          <AlertCircle size={14} />{error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {statusFilters.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* FAQ Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
          <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? "Edit FAQ" : "New FAQ"}</h2>
              <button onClick={resetForm} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq-question">Question</Label>
                <Input
                  id="faq-question"
                  value={formData.question}
                  onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                  placeholder="e.g. How do I reset my password?"
                  className={formErrors.question ? "border-destructive" : ""}
                  aria-invalid={!!formErrors.question}
                />
                {formErrors.question && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{formErrors.question}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="faq-category">Category</Label>
                <Input
                  id="faq-category"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Billing, Account, Technical"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="faq-answer">Answer</Label>
                <textarea
                  id="faq-answer"
                  value={formData.answer}
                  onChange={(e) => setFormData((p) => ({ ...p, answer: e.target.value }))}
                  placeholder="Write the answer here..."
                  rows={5}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[100px] ${
                    formErrors.answer ? "border-destructive" : "dark:border-white/[0.06]"
                  }`}
                  aria-invalid={!!formErrors.answer}
                />
                {formErrors.answer && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{formErrors.answer}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.is_active ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <div className="text-sm">
                  <p className="font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Visible to users in the FAQ section</p>
                </div>
              </label>

              {formErrors.submit && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
                  <AlertCircle size={14} />{formErrors.submit}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : editing ? "Update FAQ" : "Create FAQ"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No FAQs found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq._id} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getStatusColor(faq.status)}`}>
                      {faq.status || "draft"}
                    </span>
                    {faq.category && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{faq.category}</span>
                    )}
                    {!faq.is_active && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">inactive</span>
                    )}
                  </div>
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{faq.answer}</p>
                  {faq.created_by?.name && (
                    <p className="text-[11px] text-muted-foreground mt-2">by {faq.created_by.name}</p>
                  )}
                  {faq.approved_by?.name && (
                    <p className="text-[11px] text-green-600">Approved by {faq.approved_by.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {faq.status === "pending" && (
                    <>
                      <button onClick={() => handleApprove(faq)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-600" title="Approve">
                        <ThumbsUp size={14} />
                      </button>
                      <button onClick={() => handleReject(faq)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Reject">
                        <ThumbsDown size={14} />
                      </button>
                    </>
                  )}
                  <button onClick={() => toggleActive(faq)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                      faq.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                    title={faq.is_active ? "Deactivate" : "Activate"}
                  >
                    {faq.is_active ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <button onClick={() => openEdit(faq)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(faq)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
