import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, HelpCircle, Ticket, MessageSquare, Loader2, Sparkles, Database } from "lucide-react";
import { SearchAPI, RAGAPI } from "@/api";
import { DocumentStatusBadge } from "./StatusBadges";

interface SearchResult {
  _type: string;
  _id: string;
  title?: string;
  question?: string;
  subject?: string;
  topic?: string;
  answer?: string;
  description?: string;
  status?: string;
  category?: string;
}

interface RagHit {
  _id?: string;
  text?: string;
  content?: string;
  score?: number;
  document_id?: any;
  documentTitle?: string;
  [key: string]: any;
}

export default function SearchRetrievalTab() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [ragQuery, setRagQuery] = useState("");
  const [ragHits, setRagHits] = useState<RagHit[]>([]);
  const [ragError, setRagError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    setRagHits([]);
    setRagError(null);
    try {
      const res = await SearchAPI.query({ q: query.trim(), limit: 20 });
      const data = res.data?.data || {};
      setResults(data);
      setTotal(res.data?.total || 0);
    } catch {
      setResults({});
      setTotal(0);
    } finally {
      setSearching(false);
    }
  };

  const handleRetrievalTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setTesting(true);
    setRagError(null);
    try {
      const res = await RAGAPI.query({ query: ragQuery.trim() });
      const data = res.data?.data || {};
      const hits = data.document_results || [];
      setRagHits(Array.isArray(hits) ? hits : []);
      if (!res.data?.success) {
        setRagError(res.data?.message || "Retrieval test failed");
      }
    } catch (err: any) {
      setRagError(err?.response?.data?.message || err?.message || "Retrieval test failed");
      setRagHits([]);
    } finally {
      setTesting(false);
    }
  };

  const sections: { key: string; label: string; icon: any }[] = [
    { key: "documents", label: "Documents", icon: FileText },
    { key: "faqs", label: "FAQs", icon: HelpCircle },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "chats", label: "Chats", icon: MessageSquare },
  ];

  const formatLabel = (r: SearchResult) =>
    r.title || r.question || r.subject || r.topic || "Untitled";
  const formatSnippet = (r: SearchResult) =>
    r.answer || r.description || "";

  return (
    <div className="space-y-6">
      {/* Unified Search */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Search size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Knowledge Search</h2>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, FAQs, tickets, and chat topics..."
              className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <Button type="submit" disabled={searching || !query.trim()}>
              {searching ? <Loader2 size={14} className="animate-spin mr-1" /> : <Search size={14} className="mr-1" />}
              Search
            </Button>
          </form>

          {searched && !searching && (
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${total} result${total > 1 ? "s" : ""} found` : "No results found. Try different keywords."}
            </p>
          )}

          {searching ? (
            <div className="text-center py-10">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Searching knowledge base...</p>
            </div>
          ) : searched && total === 0 ? (
            <div className="text-center py-10">
              <Search size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nothing matched your search.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => {
                const items = results[section.key] || [];
                if (items.length === 0) return null;
                return (
                  <div key={section.key}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <section.icon size={13} /> {section.label} ({items.length})
                    </h3>
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {items.slice(0, 10).map((r) => (
                        <div key={r._id} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{formatLabel(r)}</p>
                            {r.status && <DocumentStatusBadge status={r.status} />}
                            {r.category && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{r.category}</span>
                            )}
                          </div>
                          {formatSnippet(r) && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{formatSnippet(r)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Retrieval Test */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <h2 className="text-sm font-semibold">Retrieval Test</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Test how the AI assistant retrieves knowledge chunks for a customer query. This shows the raw semantic
            retrieval results before any answer generation.
          </p>
          <form onSubmit={handleRetrievalTest} className="flex gap-2">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g. How do I reset my password?"
              className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all"
            />
            <Button type="submit" disabled={testing || !ragQuery.trim()} className="bg-purple-600 hover:bg-purple-700">
              {testing ? <Loader2 size={14} className="animate-spin mr-1" /> : <Sparkles size={14} className="mr-1" />}
              Retrieve
            </Button>
          </form>

          {ragError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 flex items-start gap-2">
              <Database size={15} className="mt-0.5 shrink-0" />
              <span>
                {ragError} — Semantic retrieval may be unavailable or the knowledge base has no indexed content yet.
              </span>
            </div>
          )}

          {testing ? (
            <div className="text-center py-10">
              <Loader2 size={28} className="animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Running semantic retrieval...</p>
            </div>
          ) : ragHits.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{ragHits.length} chunk(s) retrieved</p>
              {ragHits.map((hit, i) => {
                const text = hit.text || hit.content || hit.chunk_text || hit.snippet || "No text";
                const docTitle = hit.documentTitle || hit.document_id?.title || (typeof hit.document_id === "string" ? "" : hit.document_id?.title);
                const score = typeof hit.score === "number" ? hit.score : hit.relevance;
                return (
                  <div key={hit._id || i} className="rounded-lg border border-border px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      {docTitle && <p className="text-xs font-medium text-primary truncate">{docTitle}</p>}
                      {score !== undefined && (
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                          relevance {Math.round(score * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{text}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
