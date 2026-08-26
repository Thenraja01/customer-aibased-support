import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  CheckSquare,
  X,
  LayoutDashboard,
  Files,
  Inbox,
  HelpCircle,
  Sparkles,
  HeartPulse,
  Eye,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DocumentAPI from "@/api/document.api";
import DocumentVerificationAPI from "@/api/documentVerification.api";
import DocumentTypeAPI from "@/api/documentType.api";
import BranchAPI from "@/api/branch.api.js";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import DocumentViewer from "@/components/ui/DocumentViewer";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FAQAPI } from "@/api";

import KnowledgeStatsCards from "@/components/admin/knowledge-base/KnowledgeStatsCards";
import RecentActivity from "@/components/admin/knowledge-base/RecentActivity";
import DocumentDetailSheet from "@/components/admin/knowledge-base/DocumentDetailSheet";
import VersionUploadModal from "@/components/admin/knowledge-base/VersionUploadModal";
import IngestPanel from "@/components/admin/knowledge-base/IngestPanel";
import FAQManager from "@/components/admin/knowledge-base/FAQManager";
import SearchRetrievalTab from "@/components/admin/knowledge-base/SearchRetrievalTab";
import HealthMonitorTab from "@/components/admin/knowledge-base/HealthMonitorTab";
import {
  DocumentStatusBadge,
  IndexStatusBadge,
  VerificationStatusBadge,
  isDocumentIngesting,
  isDocumentStuck,
} from "@/components/admin/knowledge-base/StatusBadges";

const statusFilters = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "rejected", label: "Rejected" },
];

const POLL_INTERVAL_MS = 8000;

export default function DocumentsManagementPage() {
  const { user } = useAuth();
  const role = user?.roleName || user?.role || (typeof user?.role_id === "object" ? user.role_id?.role_name : user?.role_id);
  const branchId = typeof user?.branch_id === "object" ? user.branch_id?._id : user?.branch_id;
  const orgId = typeof user?.organization_id === "object" ? user?.organization_id?._id : user?.organization_id;

  const toast = useToast();
  const [tab, setTab] = useState("overview");

  const [documents, setDocuments] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState<any>(null);

  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectDocTarget, setRejectDocTarget] = useState<any>(null);
  const [rejectDocRemarks, setRejectDocRemarks] = useState("");
  const [revisionTarget, setRevisionTarget] = useState<any>(null);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) setLoading(true);
    try {
      const params: any = { organization_id: orgId, limit: 500 };
      if (role === "branch_admin" && branchId) {
        params.branch_id = branchId;
      }
      const res = await DocumentAPI.getAll(params);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orgId, role, branchId]);

  const fetchVerifications = useCallback(async () => {
    if (!orgId) return;
    try {
      const params: any = { organization_id: orgId, limit: 500 };
      if (role === "branch_admin" && branchId) {
        params.branch_id = branchId;
      }
      const res = await DocumentVerificationAPI.getAll(params);
      if (res.data.success) {
        setVerifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    }
  }, [orgId, role, branchId]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const res = await DocumentTypeAPI.getAll();
      if (res.data.success) {
        setDocumentTypes(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch document types", error);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await BranchAPI.getAll({ organization_id: orgId });
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  }, [orgId]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await AdminAPI.getRoles({ limit: 100 });
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  }, []);

  const fetchFaqs = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await FAQAPI.getAll({ limit: 500 });
      if (res.data.success) {
        const items = res.data.data || [];
        setFaqs(items.filter((f: any) => f.organization_id === orgId || f.organization_id?._id === orgId));
      }
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
    }
  }, [orgId]);

  const refreshAll = useCallback(() => {
    fetchDocuments();
    fetchVerifications();
  }, [fetchDocuments, fetchVerifications]);

  const refreshDoc = useCallback(async (doc: any) => {
    try {
      const res = await DocumentAPI.getById(doc._id);
      if (!res.data.success) return;
      const fresh = res.data.data;
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? fresh : d)));
      setDetailDoc((prev: any) => (prev && prev._id === doc._id ? fresh : prev));
    } catch (error) {
      console.error("Failed to refresh document status", error);
    }
  }, []);

  const handleRetryIngestion = async (doc: any) => {
    setRetryingId(doc._id);
    try {
      await DocumentAPI.retryIngestion(doc._id);
      toast.success("Processing restarted", "The document has been re-queued for processing.");
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to restart processing");
    } finally {
      setRetryingId(null);
      refreshDoc(doc);
    }
  };

  const handleRefreshStatus = async (doc: any) => {
    await refreshDoc(doc);
  };

  // Poll while any document is still ingesting (queued/processing/indexing) so
  // statuses update live and the "Taking longer than expected" warning appears
  // once a document stops progressing for STUCK_THRESHOLD_MS.
  useEffect(() => {
    const anyIngesting = documents.some(isDocumentIngesting);
    if (!anyIngesting) return;
    const timer = setInterval(() => {
      fetchDocuments(true);
      if (detailDoc && isDocumentIngesting(detailDoc)) refreshDoc(detailDoc);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [documents, fetchDocuments, detailDoc, refreshDoc]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleUpload = async (formData: FormData) => {
    if (orgId) formData.append("organization_id", orgId);
    await DocumentAPI.upload(formData);
    toast.success("Document uploaded", "Uploaded and processing started.");
    refreshAll();
  };

  const handleUploadVersion = async (doc: any, formData: FormData) => {
    await DocumentAPI.uploadNewVersion(doc._id, formData);
    toast.success("Version uploaded", `New version of "${doc.title}" is processing.`);
    refreshAll();
  };

  const handleApprove = async (doc: any) => {
    if (!confirm(`Approve document "${doc.title}"?`)) return;
    try {
      await DocumentAPI.approve(doc._id);
      toast.success("Document approved");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to approve document");
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectDocTarget) return;
    try {
      await DocumentAPI.reject(rejectDocTarget._id, rejectDocRemarks);
      toast.success("Document rejected");
      setRejectDocTarget(null);
      setRejectDocRemarks("");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to reject document");
    }
  };

  const handleDelete = async (doc: any) => {
    setConfirmAction(() => async () => {
      try {
        await DocumentAPI.remove(doc._id);
        toast.success("Document deleted");
        setDetailOpen(false);
        setDetailDoc(null);
        refreshAll();
      } catch (err: any) {
        toast.error("Error", err?.response?.data?.message || "Failed to delete document");
      }
    });
    setConfirmOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionTarget) return;
    try {
      await DocumentAPI.patchStatus(revisionTarget._id, { status: "needs_revision", remarks: revisionRemarks });
      toast.success("Revision requested");
      setRevisionTarget(null);
      setRevisionRemarks("");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to request revision");
    }
  };

  const handlePublish = async (doc: any) => {
    if (!confirm(`Publish document "${doc.title}"?`)) return;
    try {
      await DocumentAPI.publish(doc._id);
      toast.success("Document published");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to publish document");
    }
  };

  const handleArchive = async (doc: any) => {
    if (!confirm(`Archive document "${doc.title}"?`)) return;
    try {
      await DocumentAPI.patchStatus(doc._id, { status: "archived" });
      toast.success("Document archived");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to archive document");
    }
  };

  const handleApproveVerification = async (v: any) => {
    if (!confirm("Approve this verification?")) return;
    try {
      await DocumentVerificationAPI.approve(v._id);
      toast.success("Verification approved");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to approve verification");
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectTarget) return;
    try {
      await DocumentVerificationAPI.reject(rejectTarget._id, rejectRemarks);
      toast.success("Verification rejected");
      setRejectTarget(null);
      setRejectRemarks("");
      refreshAll();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to reject verification");
    }
  };

  const openDetail = (doc: any) => {
    setDetailDoc(doc);
    setDetailOpen(true);
  };

  const viewFile = (doc: any) => {
    setViewingDoc(doc);
    setIsViewerOpen(true);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesType = !typeFilter || String(doc.document_type_id?._id) === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingVerifications = verifications.filter((v) => v.status === "pending");

  const tabsConfig = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    { value: "documents", label: "Documents", icon: Files },
    { value: "ingest", label: "Ingest", icon: Inbox },
    { value: "faq", label: "FAQ", icon: HelpCircle },
    { value: "search", label: "Search", icon: Sparkles },
    { value: "health", label: "Health", icon: HeartPulse },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar: single row, no wrapping */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Knowledge Base</h1>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {tabsConfig.find(t => t.value === tab)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTab("health")}>
            <HeartPulse size={14} className="mr-1.5" /> Health
          </Button>
          <Button size="sm" onClick={() => setTab("ingest")}>
            <Plus size={14} className="mr-1.5" /> Add
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
        {/* Tabs: clean horizontal row */}
        <div className="px-6 border-b shrink-0">
          <TabsList className="bg-transparent h-10 w-full justify-start rounded-none gap-1 p-0">
            {tabsConfig.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground hover:text-foreground transition-colors gap-2"
              >
                <t.icon size={15} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content: scrollable area */}
        <div className="flex-1 overflow-y-auto py-6 px-6">
          {/* Overview */}
          <TabsContent value="overview" className="mt-0 space-y-6">
              <KnowledgeStatsCards documents={documents} verifications={verifications} faqs={faqs} />

              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium">Pending Verifications</h2>
                    <button
                      onClick={() => setTab("documents")}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="border rounded-lg divide-y">
                    {pendingVerifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No pending verifications.
                      </div>
                    ) : (
                      pendingVerifications.slice(0, 5).map((v) => (
                        <div key={v._id} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{v.document_id?.title || "Document"}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.verified_by?.name || "Unknown"} · {v.created_at ? new Date(v.created_at).toLocaleDateString() : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleApproveVerification(v)}
                              className="p-1.5 rounded-md hover:bg-green-500/10 text-green-600"
                              title="Approve"
                            >
                              <CheckSquare size={14} />
                            </button>
                            <button
                              onClick={() => setRejectTarget(v)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium mb-3">Recent Activity</h2>
                  <div className="border rounded-lg">
                    <RecentActivity documents={documents} verifications={verifications} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-1">
                  {statusFilters.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatusFilter(s.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        statusFilter === s.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Types</option>
                  {documentTypes.map((dt) => (
                    <option key={dt._id} value={dt._id}>{dt.name}</option>
                  ))}
                </select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                  <span className="text-sm font-medium">Documents</span>
                  <span className="text-xs text-muted-foreground">{filteredDocs.length} total</span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No documents found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Title</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Type</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Status</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Index</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Verification</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Ver.</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Scope</th>
                          <th className="text-right font-medium text-muted-foreground px-4 py-2.5 text-xs"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredDocs.map((doc) => (
                          <tr
                            key={doc._id}
                            className="hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => openDetail(doc)}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium truncate max-w-[200px]">{doc.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.file_name}</p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {doc.document_type_id?.name || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <DocumentStatusBadge status={doc.status} />
                            </td>
                            <td className="px-4 py-3">
                              <IndexStatusBadge doc={doc} />
                              {isDocumentStuck(doc) && (
                                <div className="flex flex-col gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] text-amber-600 flex items-center gap-1" title="Document has been processing for a while">
                                    <Clock size={11} /> Taking longer than expected
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleRetryIngestion(doc)}
                                      disabled={retryingId === doc._id}
                                      className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                                    >
                                      {retryingId === doc._id ? "Restarting…" : "Retry"}
                                    </button>
                                    <button
                                      onClick={() => handleRefreshStatus(doc)}
                                      className="text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                      Refresh status
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <VerificationStatusBadge verifications={verifications} documentId={doc._id} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">v{doc.version_number || 1}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {!doc.branch_id ? "All" : doc.branch_id?.name || "Branch"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => viewFile(doc)}
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="View"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => openDetail(doc)}
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Details"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Ingest & Access */}
            <TabsContent value="ingest" className="mt-0">
              <IngestPanel
                documentTypes={documentTypes}
                branches={branches}
                roles={roles}
                documents={documents}
                onUpload={handleUpload}
                onUploadVersion={handleUploadVersion}
                onDocumentTypeCreated={fetchDocumentTypes}
              />
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="mt-0">
              <FAQManager orgId={orgId || ""} />
            </TabsContent>

            {/* Search & Retrieval */}
            <TabsContent value="search" className="mt-0">
              <SearchRetrievalTab />
            </TabsContent>

            {/* Health */}
            <TabsContent value="health" className="mt-0">
              <HealthMonitorTab />
            </TabsContent>
          </div>
        </Tabs>

      {/* Detail Sheet */}
      <DocumentDetailSheet
        doc={detailDoc}
        verifications={verifications}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailDoc(null);
        }}
        onViewFile={viewFile}
        onApprove={handleApprove}
        onReject={setRejectDocTarget}
        onRequestRevision={setRevisionTarget}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onUploadVersion={(d) => setVersionTarget(d)}
        onRetryIngestion={handleRetryIngestion}
        onRefreshStatus={handleRefreshStatus}
      />

      {/* File Viewer */}
      {viewingDoc && (
        <DocumentViewer
          title={viewingDoc.title}
          fileUrl={viewingDoc.file_url}
          isOpen={isViewerOpen}
          onClose={() => {
            setViewingDoc(null);
            setIsViewerOpen(false);
          }}
        />
      )}

      {/* Version Upload */}
      {versionTarget && (
        <VersionUploadModal
          doc={versionTarget}
          onSubmit={(formData) => handleUploadVersion(versionTarget, formData)}
          onClose={() => setVersionTarget(null)}
        />
      )}

      {/* Reject Verification Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border rounded-lg max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Reject Verification</h2>
              <button
                onClick={() => { setRejectTarget(null); setRejectRemarks(""); }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Remarks</label>
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRejectTarget(null); setRejectRemarks(""); }}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleRejectVerification} disabled={!rejectRemarks}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Doc Modal */}
      {rejectDocTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border rounded-lg max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Reject Document</h2>
              <button
                onClick={() => { setRejectDocTarget(null); setRejectDocRemarks(""); }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Remarks</label>
                <textarea
                  value={rejectDocRemarks}
                  onChange={(e) => setRejectDocRemarks(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRejectDocTarget(null); setRejectDocRemarks(""); }}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleRejectDoc} disabled={!rejectDocRemarks}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {revisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border rounded-lg max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Request Revision</h2>
              <button
                onClick={() => { setRevisionTarget(null); setRevisionRemarks(""); }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Revision Notes</label>
                <textarea
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  placeholder="Notes for revision..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRevisionTarget(null); setRevisionRemarks(""); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRequestRevision} disabled={!revisionRemarks}>
                  Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone and will also remove its indexed chunks."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}