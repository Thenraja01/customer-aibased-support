import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DocumentAPI } from "@/api";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  Calendar,
  User,
  Building,
  Tag
} from "lucide-react";
import DocumentViewer from "@/components/ui/DocumentViewer";
import type { IDocument } from "@/types";

interface AdminAssignedDocument extends IDocument {
  assignedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedAt?: string;
  department?: string;
  category?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  adminNote?: string;
}

export default function CustomerDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminAssignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user?._id) return;
    try {
      // Enhanced API call to get admin-assigned documents
      const res = await DocumentAPI.getByUser(user._id);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400";
    }
  };

  const handleOpenDocument = (doc: any) => {
    setViewingDoc(doc);
    setIsViewerOpen(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading assigned documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold ">Assigned Documents</h1>
          <p className="text-sm text-muted-foreground">
            Documents assigned to you by administrators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Total: {documents.length} documents
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-md bg-background dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-lg border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-medium">Assigned Documents</h3>
          {filteredDocuments.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Showing {filteredDocuments.length} of {documents.length}
            </span>
          )}
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {documents.length === 0 
                ? 'No documents have been assigned to you yet.'
                : 'No documents match your filters.'}
            </p>
            {documents.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Administrators will assign documents here for your review.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {filteredDocuments.map((doc) => (
              <div key={doc._id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  {/* Document Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        {doc.priority && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getPriorityColor(doc.priority)}`}>
                            {doc.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {doc.category && (
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {doc.category}
                          </span>
                        )}
                        {doc.department && (
                          <span className="flex items-center gap-1">
                            <Building size={12} />
                            {doc.department}
                          </span>
                        )}
                        {doc.assignedBy && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {doc.assignedBy.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(doc.created_at || "").toLocaleDateString()}
                        </span>
                      </div>
                      {doc.adminNote && (
                        <p className="mt-1 text-xs text-muted-foreground italic line-clamp-1">
                          Note: {doc.adminNote}
                        </p>
                      )}
                      {doc.dueDate && new Date(doc.dueDate) < new Date() && doc.status === 'pending' && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <Clock size={12} />
                          Overdue
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions and Status */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(doc.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(doc)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye size={16} className="text-muted-foreground hover:text-primary transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}