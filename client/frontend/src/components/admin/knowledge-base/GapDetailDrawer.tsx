import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  BookOpen,
  Link2,
  RefreshCw,
  TrendingUp,
  Tag,
  Clock,
  User,
  MessageSquare,
  Lightbulb,
  Plus,
  History,
  Search,
  Loader2,
} from "lucide-react";
import { KnowledgeGapAPI, DocumentAPI } from "@/api";

interface GapItem {
  _id: string;
  organization_id: string;
  user_id?: { _id: string; name: string; email: string } | null;
  chat_id?: string;
  query: string;
  best_score: number;
  avg_score: number;
  matched_chunks: number;
  keywords: string[];
  topic: string;
  status: "open" | "reviewing" | "resolved" | "ignored";
  resolution_note: string;
  resolution_type?: string | null;
  linked_item_type?: string | null;
  linked_item_title?: string | null;
  resolved_by?: { _id: string; name: string; email: string } | null;
  resolved_at?: string | null;
  frequency: number;
  last_seen_at: string;
  created_at: string;
}

interface SuggestionItem {
  type: "document" | "faq";
  _id: string;
  title?: string;
  question?: string;
  answer?: string;
  description?: string;
  file_name?: string;
  category?: string;
  status?: string;
}

interface GapDetailDrawerProps {
  gap: GapItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Unresolved", color: "bg-red-500/10 text-red-600", icon: <AlertTriangle size={12} /> },
  reviewing: { label: "Reviewed", color: "bg-amber-500/10 text-amber-600", icon: <Eye size={12} /> },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-600", icon: <CheckCircle size={12} /> },
  ignored: { label: "Dismissed", color: "bg-muted text-muted-foreground", icon: <XCircle size={12} /> },
};

const topicColor = (topic: string) => {
  const map: Record<string, string> = {
    billing: "bg-blue-500/10 text-blue-600",
    account: "bg-purple-500/10 text-purple-600",
    technical: "bg-red-500/10 text-red-600",
    shipping: "bg-cyan-500/10 text-cyan-600",
    product: "bg-emerald-500/10 text-emerald-600",
    security: "bg-rose-500/10 text-rose-600",
    onboarding: "bg-indigo-500/10 text-indigo-600",
    general: "bg-muted text-muted-foreground",
  };
  return map[topic] || map.general;
};

type ResolutionMode =
  | ""
  | "faq"
  | "document"
  | "link"
  | "update_document"
  | "manual";

export default function GapDetailDrawer({ gap, open, onOpenChange, onResolved }: GapDetailDrawerProps) {
  const toast = useToast();

  const [similar, setSimilar] = useState<GapItem[]>([]);
  const [suggestions, setSuggestions] = useState<{ documents: SuggestionItem[]; faqs: SuggestionItem[] }>({ documents: [], faqs: [] });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mode, setMode] = useState<ResolutionMode>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");

  // retest
  const [retestData, setRetestData] = useState<any>(null);
  const [retestLoading, setRetestLoading] = useState(false);

  // add knowledge form
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "general" });
  const [docForm, setDocForm] = useState({ title: "", description: "", content: "" });

  // link form
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedLink, setSelectedLink] = useState<SuggestionItem | null>(null);

  // update document
  const [updateDoc, setUpdateDoc] = useState<SuggestionItem | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateChangelog, setUpdateChangelog] = useState("");

  const loadDetail = useCallback(async () => {
    if (!gap?._id) return;
    setLoadingDetail(true);
    try {
      const [similarRes, suggRes] = await Promise.all([
        KnowledgeGapAPI.getSimilar(gap._id),
        KnowledgeGapAPI.getSuggestedKnowledge(gap._id),
      ]);
      setSimilar(similarRes.data.data || []);
      setSuggestions(suggRes.data.data || { documents: [], faqs: [] });
    } catch {
      toast.error("Error", "Failed to load gap insights");
    } finally {
      setLoadingDetail(false);
    }
  }, [gap?._id, toast]);

  useEffect(() => {
    if (open && gap) {
      setMode("");
      setNote("");
      setRetestData(null);
      setSelectedLink(null);
      setLinkSearch("");
      setUpdateDoc(null);
      setUpdateFile(null);
      setUpdateChangelog("");
      loadDetail();
    }
  }, [open, gap, loadDetail]);

  const handleRetest = async () => {
    if (!gap) return;
    setRetestLoading(true);
    try {
      const res = await KnowledgeGapAPI.retest(gap._id);
      setRetestData(res.data.data);
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Retest failed");
    } finally {
      setRetestLoading(false);
    }
  };

  const handleResolveFaq = async () => {
    if (!gap || !faqForm.question || !faqForm.answer) {
      toast.error("Missing fields", "Question and answer are required");
      return;
    }
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.resolveWithFaq(gap._id, faqForm);
      toast.success("Success", "FAQ created and gap resolved");
      onResolved?.();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to create FAQ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDocument = async () => {
    if (!gap || !docForm.title || !docForm.content) {
      toast.error("Missing fields", "Title and content are required");
      return;
    }
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.resolveWithDocument(gap._id, {
        title: docForm.title,
        description: docForm.description,
        content: docForm.content,
      });
      toast.success("Success", "Document created and gap resolved");
      onResolved?.();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to create document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveLink = async () => {
    if (!gap || !selectedLink) return;
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.resolveWithLink(gap._id, {
        type: selectedLink.type,
        refId: selectedLink._id,
      });
      toast.success("Success", "Gap linked to existing knowledge");
      onResolved?.();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to link knowledge");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDocument = async () => {
    if (!updateDoc || !updateFile) {
      toast.error("Missing file", "Select a document and a new file");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", updateFile);
      formData.append("changelog", updateChangelog || `Knowledge gap resolution: ${gap?.query.slice(0, 80)}`);
      await DocumentAPI.uploadNewVersion(updateDoc._id, formData);
      await KnowledgeGapAPI.resolveWithLink(gap!._id, {
        type: "document",
        refId: updateDoc._id,
      });
      toast.success("Success", "New version uploaded and gap resolved");
      onResolved?.();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Version upload failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualResolve = async () => {
    if (!gap) return;
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.resolve(gap._id, { note });
      toast.success("Success", "Gap marked as resolved");
      onResolved?.();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to resolve gap");
    } finally {
      setActionLoading(false);
    }
  };

  const linkOptions: SuggestionItem[] = [
    ...suggestions.documents,
    ...suggestions.faqs,
  ].filter((item) => {
    if (!linkSearch) return true;
    const q = linkSearch.toLowerCase();
    const title = (item.title || item.question || "").toLowerCase();
    const body = (item.answer || item.description || "").toLowerCase();
    return title.includes(q) || body.includes(q);
  });

  if (!gap) return null;

  const scorePct = Math.round(gap.best_score * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap pr-8">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${statusConfig[gap.status]?.color}`}>
              {statusConfig[gap.status]?.icon}
              {statusConfig[gap.status]?.label || gap.status}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${topicColor(gap.topic)}`}>
              {gap.topic}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600">
              {scorePct}% match
            </span>
            {gap.frequency > 1 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 flex items-center gap-1">
                <TrendingUp size={10} /> ×{gap.frequency}
              </span>
            )}
          </div>
          <SheetTitle className="text-base leading-snug">{gap.query}</SheetTitle>
          <SheetDescription className="text-xs">
            Detected {new Date(gap.created_at).toLocaleDateString()} · Last seen {new Date(gap.last_seen_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        {/* Meta */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Tag size={11} /> Topic
              </div>
              <p className="text-sm font-semibold mt-1">{gap.topic}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <BookOpen size={11} /> Chunks matched
              </div>
              <p className="text-sm font-semibold mt-1">{gap.matched_chunks}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Clock size={11} /> Avg score
              </div>
              <p className="text-sm font-semibold mt-1">{Math.round(gap.avg_score * 100)}%</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <User size={11} /> User
              </div>
              <p className="text-sm font-semibold mt-1 truncate">
                {gap.user_id?.name || gap.user_id?.email || "Anonymous"}
              </p>
            </div>
          </div>

          {gap.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {gap.keywords.map((kw) => (
                <span key={kw} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {gap.resolution_note && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <strong>Resolution:</strong> {gap.resolution_note}
              {gap.linked_item_title && (
                <span className="block mt-1 text-primary">
                  <Link2 size={11} className="inline mr-1" />
                  {gap.resolution_type} · {gap.linked_item_title}
                </span>
              )}
            </div>
          )}

          {/* Retest */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <RefreshCw size={13} className="text-primary" />
                Retest against knowledge base
              </div>
              <Button size="sm" variant="outline" onClick={handleRetest} disabled={retestLoading} className="text-xs">
                {retestLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {retestLoading ? "Retesting..." : "Retest"}
              </Button>
            </div>
            {retestData && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${retestData.bestScore >= 0.6 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                    Best match: {Math.round(retestData.bestScore * 100)}%
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    Avg: {Math.round(retestData.avgScore * 100)}%
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    Chunks: {retestData.matchedChunks}
                  </span>
                  {retestData.bestScore >= 0.6 ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 flex items-center gap-1">
                      <CheckCircle size={10} /> Gap likely resolved
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 flex items-center gap-1">
                      <AlertTriangle size={10} /> Still a gap
                    </span>
                  )}
                </div>
                {retestData.results?.map((r: any, i: number) => (
                  <div key={i} className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px]">
                    <span className="text-muted-foreground">{r.title || "Untitled"}</span>
                    <span className="float-right font-medium">{Math.round(r.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {(suggestions.documents.length > 0 || suggestions.faqs.length > 0 || similar.length > 0) && (
            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                <Lightbulb size={13} className="text-amber-500" />
                Suggestions
              </div>
              {(suggestions.documents.length > 0 || suggestions.faqs.length > 0) && (
                <div className="space-y-1.5 mb-3">
                  {[...suggestions.documents, ...suggestions.faqs].slice(0, 4).map((item) => (
                    <button
                      key={item._id}
                      onClick={() => { setMode("link"); setSelectedLink(item); }}
                      className="w-full text-left rounded-md hover:bg-muted/60 px-2 py-1.5 text-xs flex items-center gap-2"
                    >
                      {item.type === "document" ? (
                        <FileText size={12} className="text-blue-500 shrink-0" />
                      ) : (
                        <MessageSquare size={12} className="text-emerald-500 shrink-0" />
                      )}
                      <span className="truncate">{item.title || item.question}</span>
                    </button>
                  ))}
                </div>
              )}
              {similar.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Similar gaps</p>
                  <div className="space-y-1.5">
                    {similar.slice(0, 3).map((s) => (
                      <div key={s._id} className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px]">
                        <p className="truncate">{s.query}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.topic} · ×{s.frequency} · {Math.round(s.best_score * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resolution methods */}
          {gap.status === "open" || gap.status === "reviewing" ? (
            <div className="rounded-lg border p-3 space-y-3">
              <div className="text-xs font-semibold">Resolve this gap</div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={mode === "faq" ? "default" : "outline"} onClick={() => setMode(mode === "faq" ? "" : "faq")} className="text-xs gap-1">
                  <Plus size={12} /> Add FAQ
                </Button>
                <Button size="sm" variant={mode === "document" ? "default" : "outline"} onClick={() => setMode(mode === "document" ? "" : "document")} className="text-xs gap-1">
                  <FileText size={12} /> Add Document
                </Button>
                <Button size="sm" variant={mode === "link" ? "default" : "outline"} onClick={() => setMode(mode === "link" ? "" : "link")} className="text-xs gap-1">
                  <Link2 size={12} /> Link Existing
                </Button>
                <Button size="sm" variant={mode === "update_document" ? "default" : "outline"} onClick={() => setMode(mode === "update_document" ? "" : "update_document")} className="text-xs gap-1">
                  <History size={12} /> Update Document
                </Button>
                <Button size="sm" variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode(mode === "manual" ? "" : "manual")} className="text-xs gap-1">
                  <CheckCircle size={12} /> Mark Resolved
                </Button>
              </div>

              {mode === "faq" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Question</Label>
                    <Input
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="Question customers ask"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Answer</Label>
                    <Textarea
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Authoritative answer from your knowledge base"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleResolveFaq} disabled={actionLoading} className="flex-1 text-xs">
                      {actionLoading ? "Saving..." : "Create FAQ & Resolve"}
                    </Button>
                  </div>
                </div>
              )}

              {mode === "document" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={docForm.title}
                      onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                      placeholder="Document title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={docForm.description}
                      onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                      placeholder="Short description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Content</Label>
                    <Textarea
                      value={docForm.content}
                      onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                      placeholder="Full knowledge content. This runs through the standard verification pipeline before publishing."
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleResolveDocument} disabled={actionLoading} className="flex-1 text-xs">
                      {actionLoading ? "Saving..." : "Create Document & Resolve"}
                    </Button>
                  </div>
                </div>
              )}

              {mode === "link" && (
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Search existing docs & FAQs..."
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {loadingDetail ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>
                    ) : linkOptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No matches</p>
                    ) : (
                      linkOptions.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => setSelectedLink(item)}
                          className={`w-full text-left rounded-md px-2 py-1.5 text-xs flex items-center gap-2 border ${
                            selectedLink?._id === item._id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/60"
                          }`}
                        >
                          {item.type === "document" ? (
                            <FileText size={12} className="text-blue-500 shrink-0" />
                          ) : (
                            <MessageSquare size={12} className="text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{item.title || item.question}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{item.type}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <Button size="sm" onClick={handleResolveLink} disabled={actionLoading || !selectedLink} className="w-full text-xs">
                    {actionLoading ? "Linking..." : selectedLink ? `Link "${(selectedLink.title || selectedLink.question || "").slice(0, 30)}" & Resolve` : "Select an item to link"}
                  </Button>
                </div>
              )}

              {mode === "update_document" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Document to update</Label>
                    <select
                      value={updateDoc?._id || ""}
                      onChange={(e) => {
                        const found = [...suggestions.documents].find((d) => d._id === e.target.value) || null;
                        setUpdateDoc(found);
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a published document...</option>
                      {suggestions.documents.map((d) => (
                        <option key={d._id} value={d._id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">New file</Label>
                    <input
                      type="file"
                      onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Changelog</Label>
                    <Input
                      value={updateChangelog}
                      onChange={(e) => setUpdateChangelog(e.target.value)}
                      placeholder="What changed in this version?"
                    />
                  </div>
                  <Button size="sm" onClick={handleUpdateDocument} disabled={actionLoading || !updateDoc || !updateFile} className="w-full text-xs">
                    {actionLoading ? "Uploading..." : "Upload Version & Resolve"}
                  </Button>
                </div>
              )}

              {mode === "manual" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Resolution note</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What action was taken to resolve this gap?"
                      rows={3}
                    />
                  </div>
                  <Button size="sm" onClick={handleManualResolve} disabled={actionLoading} className="w-full text-xs">
                    {actionLoading ? "Resolving..." : "Mark Resolved"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border p-3 text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              This gap is already {statusConfig[gap.status]?.label.toLowerCase()}.
              {gap.linked_item_title && <span className="text-primary">Linked: {gap.linked_item_title}</span>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
