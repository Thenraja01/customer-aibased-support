import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { FAQAPI } from "@/api";
import { Plus, Pencil, Trash2, HelpCircle, Save, X } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  is_active: boolean;
  organization_id: { _id: string; name: string };
  created_at: string;
}

export default function FAQManagementPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "" });

  useEffect(() => { loadFaqs(); }, []);

  const loadFaqs = async () => {
    try {
      const res = await FAQAPI.getAll();
      if (res.data.success) setFaqs(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    try {
      await FAQAPI.create({
        ...formData,
        organization_id: user?.organization_id?._id,
      });
      setFormData({ question: "", answer: "" });
      setShowForm(false);
      loadFaqs();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await FAQAPI.update(id, formData);
      setEditingId(null);
      setFormData({ question: "", answer: "" });
      loadFaqs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await FAQAPI.delete(id);
      loadFaqs();
    } catch (e) { console.error(e); }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq._id);
    setFormData({ question: faq.question, answer: faq.answer });
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading FAQs...</div>;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-sm text-muted-foreground">Manage frequently asked questions for your organization.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ question: "", answer: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </motion.div>

      {(showForm || editingId) && (
        <div className="rounded-xl border bg-card p-6 dark:bg-card/50 dark:border-white/[0.06]">
          <h3 className="text-sm font-medium mb-4">{editingId ? "Edit FAQ" : "New FAQ"}</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm dark:border-white/[0.06]"
            />
            <textarea
              placeholder="Answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm dark:border-white/[0.06]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
              >
                <Save size={14} /> {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setFormData({ question: "", answer: "" }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        {faqs.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No FAQs yet. Add your first FAQ.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {faqs.map((faq) => (
              <div key={faq._id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(faq)} className="p-1.5 hover:bg-muted rounded-lg" title="Edit">
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(faq._id)} className="p-1.5 hover:bg-destructive/10 rounded-lg" title="Delete">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
