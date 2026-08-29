import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle, Search, Plus, X, AlertCircle, Loader2, Check, Clock, ThumbsDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FAQAPI } from "@/api";
import { cn } from "@/lib/utils";

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  status: "draft" | "pending" | "approved" | "rejected";
  created_by?: { _id: string; name: string; email: string };
  approved_by?: { _id: string; name: string };
  created_at: string;
}

export default function SupportFAQPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id?._id || user?.organization_id;
  const [approvedFaqs, setApprovedFaqs] = useState<FaqItem[]>([]);
  const [myFaqs, setMyFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"approved" | "mine">("approved");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, myRes] = await Promise.all([
        FAQAPI.getActive(),
        FAQAPI.getMy(),
      ]);
      if (activeRes.data.success) setApprovedFaqs(activeRes.data.data || []);
      if (myRes.data.success) setMyFaqs(myRes.data.data || []);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ question: "", answer: "", category: "" });
    setFormErrors({});
    setShowForm(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.question.trim()) errs.question = "Question is required";
    if (formData.question.length > 500) errs.question = "Max 500 characters";
    if (!formData.answer.trim()) errs.answer = "Answer is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await FAQAPI.create({ ...formData, organization_id: orgId });
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to create FAQ" });
    } finally {
      setSaving(false);
    }
  };

  const filteredApproved = approvedFaqs.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { icon: Check, label: "Approved", className: "bg-green-500/10 text-green-600" };
      case "pending":
        return { icon: Clock, label: "Pending", className: "bg-amber-500/10 text-amber-600" };
      case "rejected":
        return { icon: ThumbsDown, label: "Rejected", className: "bg-destructive/10 text-destructive" };
      default:
        return { icon: HelpCircle, label: "Draft", className: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">FAQ</h1>
          <p className="text-sm text-muted-foreground">Browse approved FAQs or submit new ones for admin review.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} className="mr-1" />
          Submit FAQ
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
          <div className="bg-card rounded-lg shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Submit New FAQ</h2>
              <button onClick={resetForm} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Your submission will be reviewed by an admin before being published.</p>

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
                <Label htmlFor="faq-category">Category (optional)</Label>
                <Input
                  id="faq-category"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Billing, Technical"
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
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[100px] ${formErrors.answer ? "border-destructive" : "dark:border-white/[0.06]"}`}
                  aria-invalid={!!formErrors.answer}
                />
                {formErrors.answer && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{formErrors.answer}
                  </p>
                )}
              </div>

              {formErrors.submit && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
                  <AlertCircle size={14} />{formErrors.submit}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
                <Button onClick={handleCreate} disabled={saving} className="flex-1">
                  {saving ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading FAQs...
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b">
            <button onClick={() => setTab("approved")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === "approved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Approved FAQs
            </button>
            <button onClick={() => setTab("mine")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === "mine" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              My Submissions {myFaqs.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({myFaqs.length})</span>}
            </button>
          </div>

          {tab === "approved" && (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {filteredApproved.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "No FAQs match your search" : "No approved FAQs yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredApproved.map((faq) => {
                    const isOpen = expandedId === faq._id;
                    return (
                      <div key={faq._id} className="rounded-lg border bg-card overflow-hidden">
                        <button
                          onClick={() => setExpandedId(isOpen ? null : faq._id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-sm font-medium pr-4">{faq.question}</span>
                          <HelpCircle size={14} className="text-muted-foreground shrink-0" />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4">
                            <div className="h-px bg-border mb-3" />
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "mine" && (
            myFaqs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">You haven't submitted any FAQs yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus size={14} className="mr-1" />Submit your first FAQ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myFaqs.map((faq) => {
                  const badge = getStatusBadge(faq.status);
                  const BadgeIcon = badge.icon;
                  const isOpen = expandedId === faq._id;
                  return (
                    <div key={faq._id} className="rounded-lg border bg-card overflow-hidden">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : faq._id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                              <BadgeIcon size={10} />
                              {badge.label}
                            </span>
                            {faq.category && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{faq.category}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium">{faq.question}</span>
                        </div>
                        <HelpCircle size={14} className="text-muted-foreground shrink-0" />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <div className="h-px bg-border mb-3" />
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                          {faq.approved_by?.name && (
                            <p className="text-xs text-green-600 mt-2">Approved by {faq.approved_by.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
