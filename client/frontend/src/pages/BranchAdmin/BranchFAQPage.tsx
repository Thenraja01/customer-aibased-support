import React, { useState, useEffect } from "react";
import { 
  HelpCircle, Plus, Search, RefreshCw, AlertCircle, 
  Trash2, X, Building2, Globe
} from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BranchFAQPage() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);

  // Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [isPublished, setIsPublished] = useState(true);
  const [isBranchOnly, setIsBranchOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/faqs");
      if (res.data?.data) {
        setFaqs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch branch FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const orgId = user?.organizationId || user?.organization_id?._id || user?.organization_id;
    const branchId = user?.branchId || user?.branch_id?._id || user?.branch_id;

    try {
      await AxiosInstance.post("/faqs", {
        question,
        answer,
        category,
        is_published: isPublished,
        organization_id: orgId,
        branch_id: isBranchOnly ? branchId : null,
      });
      setQuestion("");
      setAnswer("");
      setShowModal(false);
      fetchFaqs();
      toast.success("FAQ Created", "FAQ added successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create FAQ");
      toast.error("Error", err.response?.data?.message || "Failed to create FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deleteFaqId) return;
    try {
      await AxiosInstance.delete(`/faqs/${deleteFaqId}`);
      toast.success("FAQ Deleted", "FAQ removed successfully.");
      setDeleteFaqId(null);
      fetchFaqs();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to delete FAQ");
    }
  };

  const filteredFaqs = faqs.filter(f =>
    f.question?.toLowerCase().includes(search.toLowerCase()) ||
    f.answer?.toLowerCase().includes(search.toLowerCase()) ||
    f.category?.toLowerCase().includes(search.toLowerCase())
  );

  const branchName = user?.branch_id?.name || user?.branchId?.name || "Main Branch";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Branch-Separated Multi-Tenant Knowledge
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Branch FAQ Management ({branchName})</h1>
          <p className="text-slate-400 text-sm mt-1">Manage FAQs scoped strictly to this branch or shared organization-wide for grounded AI RAG answers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchFaqs}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter FAQs by question, answer, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-slate-200 text-sm focus:outline-none"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-slate-400">Loading branch FAQs...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center p-8 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            No FAQs currently match your query for this branch.
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div key={faq._id} className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{faq.question}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-indigo-400 font-medium">{faq.category || "General"}</span>
                      <span className="text-slate-600">•</span>
                      {faq.branch_id ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Building2 className="w-3 h-3" /> Branch-Specific ({faq.branch_id.name || branchName})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          <Globe className="w-3 h-3" /> Org-Wide
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    faq.status === "approved" || faq.is_published || faq.is_active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    {faq.status || "approved"}
                  </span>
                  <button
                    onClick={() => setDeleteFaqId(faq._id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-300 text-sm pl-11 leading-relaxed">{faq.answer}</p>
            </div>
          ))
        )}
      </div>

      {/* Add FAQ Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Create FAQ ({branchName})
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleCreateFaq} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Question</label>
                <input
                  type="text"
                  placeholder="e.g. What are our branch operating hours?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Answer</label>
                <textarea
                  placeholder="Comprehensive answer for customers & AI RAG index..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="General, Technical, Billing, SLA"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="branchOnlyToggle"
                    checked={isBranchOnly}
                    onChange={(e) => setIsBranchOnly(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="branchOnlyToggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Scope exclusively to this branch ({branchName})
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="published" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Publish immediately for AI RAG Grounding & Customer Search
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteFaqId}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ? This will remove it from the knowledge base and AI RAG search index."
        confirmLabel="Delete FAQ"
        variant="danger"
        onConfirm={handleDeleteFaq}
        onCancel={() => setDeleteFaqId(null)}
      />
    </div>
  );
}
