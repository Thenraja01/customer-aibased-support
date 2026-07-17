import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Brain,
  FileText,
  Layers,
  Network,
  ArrowRight,
  ChevronRight,
  Database,
  Loader2,
  Zap,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { RAGAPI } from "@/api";

interface RAGDocument {
  id: string;
  title: string;
  chunkCount: number;
  entityCount: number;
  lastIndexed: string;
  status: "indexed" | "pending" | "error";
  type: string;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  documentsProcessed: number;
  nodeTypes: { type: string; count: number }[];
}

interface SearchResult {
  chunkId: string;
  documentTitle: string;
  content: string;
  score: number;
}

const MOCK_DOCUMENTS: RAGDocument[] = [
  { id: "doc_1", title: "Product Documentation", chunkCount: 342, entityCount: 89, lastIndexed: "2026-07-15T10:30:00Z", status: "indexed", type: "pdf" },
  { id: "doc_2", title: "API Reference Guide", chunkCount: 218, entityCount: 156, lastIndexed: "2026-07-14T15:45:00Z", status: "indexed", type: "markdown" },
  { id: "doc_3", title: "Customer FAQ Database", chunkCount: 567, entityCount: 234, lastIndexed: "2026-07-13T09:00:00Z", status: "indexed", type: "json" },
  { id: "doc_4", title: "Troubleshooting Handbook", chunkCount: 189, entityCount: 67, lastIndexed: "2026-07-12T14:20:00Z", status: "indexed", type: "pdf" },
  { id: "doc_5", title: "Onboarding Guide", chunkCount: 124, entityCount: 45, lastIndexed: "2026-07-11T11:10:00Z", status: "indexed", type: "docx" },
  { id: "doc_6", title: "Release Notes v3.2", chunkCount: 45, entityCount: 12, lastIndexed: "2026-07-10T08:00:00Z", status: "pending", type: "markdown" },
  { id: "doc_7", title: "Security Policies", chunkCount: 78, entityCount: 23, lastIndexed: "2026-07-09T16:00:00Z", status: "indexed", type: "pdf" },
  { id: "doc_8", title: "Integration Partners", chunkCount: 92, entityCount: 34, lastIndexed: "2026-07-08T13:30:00Z", status: "error", type: "csv" },
];

const MOCK_GRAPH_STATS: GraphStats = {
  totalNodes: 1247,
  totalEdges: 3891,
  documentsProcessed: 7,
  nodeTypes: [
    { type: "Concept", count: 456 },
    { type: "Entity", count: 312 },
    { type: "Feature", count: 198 },
    { type: "Organization", count: 87 },
    { type: "Product", count: 124 },
    { type: "Process", count: 70 },
  ],
};

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    chunkId: "chk_1",
    documentTitle: "Product Documentation",
    content: "Our AI-powered customer support platform uses RAG (Retrieval Augmented Generation) to provide accurate, context-aware responses. The system processes documents into semantic chunks...",
    score: 0.94,
  },
  {
    chunkId: "chk_2",
    documentTitle: "API Reference Guide",
    content: "The /api/v1/rag/query endpoint accepts a POST request with a query string and optional filters. The response includes relevant document chunks ranked by similarity score...",
    score: 0.91,
  },
  {
    chunkId: "chk_3",
    documentTitle: "Customer FAQ Database",
    content: "Q: How does the knowledge base work? A: Documents are split into chunks, embedded using our embedding model, and stored in a vector database for semantic search retrieval...",
    score: 0.87,
  },
];

export default function KnowledgeBasePage() {
  const [ragStats, setRagStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [reindexingDoc, setReindexingDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<RAGDocument | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await RAGAPI.getStats();
      if (res.data.success) setRagStats(res.data.data);
    } catch (error) {
      console.error("Failed to load RAG stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowSearch(true);

    // Simulate search with mock results
    await new Promise((r) => setTimeout(r, 600));
    setSearchResults(
      MOCK_SEARCH_RESULTS.map((r) => ({
        ...r,
        content: r.content.replace(
          "AI-powered",
          searchQuery.length > 10 ? searchQuery.slice(0, 10) + "..." : searchQuery
        ),
      }))
    );
    setSearching(false);
  };

  const handleReindex = async (docId: string) => {
    setReindexingDoc(docId);
    await new Promise((r) => setTimeout(r, 1500));
    setReindexingDoc(null);
  };

  const handleViewChunks = async (doc: RAGDocument) => {
    setViewingDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await RAGAPI.getDocumentChunks(doc.id);
      if (res.data.success && Array.isArray(res.data.data)) {
        setDocChunks(res.data.data.slice(0, 10));
      }
    } catch {
      // Use mock chunks
      setDocChunks([
        { _id: "chk_m1", content: `Chunk 1 of "${doc.title}": This section covers the introductory concepts and overview of the system architecture...`, index: 0 },
        { _id: "chk_m2", content: `Chunk 2 of "${doc.title}": The core processing pipeline handles document ingestion, chunking, embedding, and vector storage...`, index: 1 },
        { _id: "chk_m3", content: `Chunk 3 of "${doc.title}": Configuration options include chunk size, overlap, embedding model selection, and retrieval parameters...`, index: 2 },
      ]);
    } finally {
      setLoadingChunks(false);
    }
  };

  const documents = MOCK_DOCUMENTS;
  const totalChunks = documents.reduce((s, d) => s + d.chunkCount, 0);
  const indexedCount = documents.filter((d) => d.status === "indexed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading knowledge base...
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage indexed documents, graph data, and knowledge retrieval.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.documentsIndexed || indexedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Chunks</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.chunksRetrieved || totalChunks.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <Layers size={20} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Graph Nodes</p>
              <p className="text-2xl font-bold mt-2">{MOCK_GRAPH_STATS.totalNodes.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Network size={20} className="text-accent-foreground" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Graph Edges</p>
              <p className="text-2xl font-bold mt-2">{MOCK_GRAPH_STATS.totalEdges.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
              <Brain size={20} className="text-green-500" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the knowledge base..."
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Search size={14} className="mr-1" />}
          Search
        </Button>
      </motion.div>

      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              Search Results for "{searchQuery}"
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>Clear</Button>
          </div>
          {searchResults.length === 0 && !searching ? (
            <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
          ) : (
            <div className="space-y-3">
              {searchResults.map((r) => (
                <div key={r.chunkId} className="rounded-lg border p-4 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      <span className="text-sm font-medium">{r.documentTitle}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{(r.score * 100).toFixed(0)}% match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText size={14} className="mr-1" /> Documents
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network size={14} className="mr-1" /> Knowledge Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Chunks</TableHead>
                    <TableHead className="text-right">Entities</TableHead>
                    <TableHead>Last Indexed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                            <FileText size={14} className="text-primary" />
                          </div>
                          <span className="font-medium text-sm">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase">{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{doc.chunkCount}</TableCell>
                      <TableCell className="text-right text-sm">{doc.entityCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(doc.lastIndexed).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === "indexed"
                              ? "default"
                              : doc.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize text-xs"
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewChunks(doc)}
                          >
                            Chunks
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={reindexingDoc === doc.id}
                            onClick={() => handleReindex(doc.id)}
                          >
                            {reindexingDoc === doc.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="graph">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="dark:bg-card/50 dark:border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Network size={18} className="text-primary" /> Graph Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Nodes</span>
                    <span className="text-sm font-bold">{MOCK_GRAPH_STATS.totalNodes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Edges</span>
                    <span className="text-sm font-bold">{MOCK_GRAPH_STATS.totalEdges.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documents Processed</span>
                    <span className="text-sm font-bold">{MOCK_GRAPH_STATS.documentsProcessed}</span>
                  </div>
                  <div className="pt-2 border-t dark:border-white/[0.06]">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Node Types</p>
                    <div className="space-y-2">
                      {MOCK_GRAPH_STATS.nodeTypes.map((nt) => (
                        <div key={nt.type} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{nt.type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{
                                  width: `${(nt.count / MOCK_GRAPH_STATS.totalNodes) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">{nt.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-card/50 dark:border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database size={18} className="text-secondary" /> Graph Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Entity relationships visualized as a text graph:
                    </div>
                    {documents.slice(0, 5).map((doc, i) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium">{doc.title}</span>
                        {i < 4 && (
                          <>
                            <ArrowRight size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {doc.chunkCount} chunks → {doc.entityCount} entities
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="pt-4 border-t dark:border-white/[0.06]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ChevronRight size={12} />
                        <span>Density: {(MOCK_GRAPH_STATS.totalEdges / MOCK_GRAPH_STATS.totalNodes).toFixed(1)} edges/node</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <ChevronRight size={12} />
                        <span>Avg connections per entity: ~{(MOCK_GRAPH_STATS.totalEdges / MOCK_GRAPH_STATS.totalNodes * 1.5).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) { setViewingDoc(null); setDocChunks([]); } }}>
        <DialogContent className="max-w-2xl dark:bg-card dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.title}</DialogTitle>
            <DialogDescription>
              {viewingDoc?.chunkCount} chunks • {viewingDoc?.entityCount} entities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loadingChunks ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading chunks...</div>
            ) : docChunks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No chunks available.</div>
            ) : (
              docChunks.map((chunk, i) => (
                <div key={chunk._id || i} className="rounded-lg border p-3 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">Chunk {chunk.index ?? i + 1}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{chunk.content}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewingDoc(null); setDocChunks([]); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
