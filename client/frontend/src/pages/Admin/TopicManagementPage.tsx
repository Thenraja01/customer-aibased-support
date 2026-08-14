import React, { useState, useEffect } from "react";
import AxiosInstance from "@/api/axiosInstance";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  FileText,
  Database,
  Network,
  Settings2,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Topic {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
  tools: string[];
  created_at: string;
}

interface Document {
  _id: string;
  title: string;
  file_name: string;
  file_size: number;
  status: string;
}

interface Chunk {
  _id: string;
  chunk_index: number;
  content: string;
  token_count: number;
}

interface GraphData {
  entities: { name: string; type: string }[];
  relationships: { source: string; target: string; type: string }[];
}

const AVAILABLE_TOOLS = [
  { id: "get_refund", label: "Get Refund Details", desc: "Retrieve status of refund requests" },
  { id: "check_refund_eligibility", label: "Check Refund Eligibility", desc: "Evaluate if a customer qualifies for refund" },
  { id: "create_refund", label: "Create Refund Ticket", desc: "File a new refund request" },
  { id: "update_refund", label: "Update Refund Status", desc: "Modify refund request status/priority" },
  { id: "create_ticket", label: "Create Support Ticket", desc: "Open general support tickets" },
  { id: "getTicketDetails", label: "Get Ticket Details", desc: "Inspect specific support ticket details" },
  { id: "sendNotification", label: "Send Notification", desc: "Trigger system notifications" }
];

export default function TopicManagementPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "docs" | "chunks" | "graph">("info");

  // Sub-resource states
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ entities: [], relationships: [] });

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalTools, setModalTools] = useState<string[]>([]);
  const [modalEnabled, setModalEnabled] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchTopicResources(selectedTopic._id);
    } else {
      setDocuments([]);
      setChunks([]);
      setGraphData({ entities: [], relationships: [] });
    }
  }, [selectedTopic, activeTab]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/topics");
      if (res.data.success) {
        setTopics(res.data.data);
        if (res.data.data.length > 0 && !selectedTopic) {
          setSelectedTopic(res.data.data[0]);
        }
      }
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicResources = async (id: string) => {
    try {
      if (activeTab === "docs") {
        const res = await AxiosInstance.get(`/topics/${id}/documents`);
        if (res.data.success) setDocuments(res.data.data);
      } else if (activeTab === "chunks") {
        const res = await AxiosInstance.get(`/topics/${id}/chunks`);
        if (res.data.success) setChunks(res.data.data);
      } else if (activeTab === "graph") {
        const res = await AxiosInstance.get(`/topics/${id}/graph`);
        if (res.data.success) setGraphData(res.data.data);
      }
    } catch (err: any) {
      showFeedback("error", "Failed to load topic resources");
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    try {
      const res = await AxiosInstance.post("/topics", {
        name: modalName.trim(),
        description: modalDesc.trim(),
        tools: modalTools,
        enabled: modalEnabled
      });

      if (res.data.success) {
        showFeedback("success", "Topic created successfully!");
        setShowCreateModal(false);
        setModalName("");
        setModalDesc("");
        setModalTools([]);
        fetchTopics();
      }
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to create topic");
    }
  };

  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !modalName.trim()) return;

    try {
      const res = await AxiosInstance.put(`/topics/${selectedTopic._id}`, {
        name: modalName.trim(),
        description: modalDesc.trim(),
        tools: modalTools,
        enabled: modalEnabled
      });

      if (res.data.success) {
        showFeedback("success", "Topic updated successfully!");
        setShowEditModal(false);
        setSelectedTopic(res.data.data);
        fetchTopics();
      }
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to update topic");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this topic? All chunk/document links will be cleared.")) return;

    try {
      const res = await AxiosInstance.delete(`/topics/${id}`);
      if (res.data.success) {
        showFeedback("success", "Topic deleted successfully");
        setSelectedTopic(null);
        fetchTopics();
      }
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to delete topic");
    }
  };

  const handleReindex = async (id: string) => {
    setReindexing(true);
    try {
      const res = await AxiosInstance.post(`/topics/${id}/reindex`);
      if (res.data.success) {
        showFeedback("success", res.data.message || "Re-indexing started.");
      }
    } catch (err: any) {
      showFeedback("error", "Re-indexing request failed.");
    } finally {
      setReindexing(false);
    }
  };

  const toggleTopicStatus = async (topic: Topic) => {
    try {
      const res = await AxiosInstance.put(`/topics/${topic._id}`, {
        enabled: !topic.enabled
      });
      if (res.data.success) {
        showFeedback("success", `Topic ${!topic.enabled ? 'enabled' : 'disabled'} successfully.`);
        fetchTopics();
        if (selectedTopic?._id === topic._id) {
          setSelectedTopic(res.data.data);
        }
      }
    } catch (err: any) {
      showFeedback("error", "Failed to update status");
    }
  };

  const openEditModal = () => {
    if (!selectedTopic) return;
    setModalName(selectedTopic.name);
    setModalDesc(selectedTopic.description);
    setModalTools(selectedTopic.tools || []);
    setModalEnabled(selectedTopic.enabled);
    setShowEditModal(true);
  };

  const toggleModalTool = (toolId: string) => {
    setModalTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/55 dark:border-slate-800/55 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <FolderTree className="text-primary" />
            Topic & Knowledge Graph Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize documents into topics, link business tools, and view entity-relation graph models.
          </p>
        </div>

        <button
          onClick={() => {
            setModalName("");
            setModalDesc("");
            setModalTools([]);
            setModalEnabled(true);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl shadow-md transition-all font-medium text-sm"
        >
          <Plus size={16} />
          Create Topic
        </button>
      </div>

      {/* Feedback Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-sm"
          >
            <Check size={16} />
            {successMsg}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 rounded-xl flex items-center gap-2 text-sm"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
        {/* Left Side: Topic List Card */}
        <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Detected Topics
          </h2>

          <div className="space-y-2 overflow-y-auto max-h-[60vh]">
            {loading && topics.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Loading topics...</div>
            ) : topics.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No topics detected yet. Upload a document to automatically populate.
              </div>
            ) : (
              topics.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTopic(t)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                    selectedTopic?._id === t._id
                      ? "bg-slate-100 dark:bg-slate-800/70 border-primary text-slate-950 dark:text-white"
                      : "bg-transparent border-slate-150 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <FolderTree size={14} className={t.enabled ? "text-primary" : "text-slate-400"} />
                      {t.name}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleTopicStatus(t)}
                      title={t.enabled ? "Disable Topic" : "Enable Topic"}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {t.enabled ? <ToggleRight className="text-emerald-500" size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(t._id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Topic"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Topic Details & Sub-resources Workspace */}
        <div className="lg:col-span-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-sm min-h-[50vh] flex flex-col space-y-5">
          {selectedTopic ? (
            <>
              {/* Detailed Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedTopic.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        selectedTopic.enabled
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/20"
                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {selectedTopic.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">{selectedTopic.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReindex(selectedTopic._id)}
                    disabled={reindexing}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition-all"
                  >
                    <RefreshCw size={12} className={reindexing ? "animate-spin" : ""} />
                    Re-index documents
                  </button>
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-medium transition-all"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                </div>
              </div>

              {/* Sub-resource Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800">
                {(["info", "docs", "chunks", "graph"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 capitalize ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab === "info" && <Settings2 size={14} />}
                    {tab === "docs" && <FileText size={14} />}
                    {tab === "chunks" && <Database size={14} />}
                    {tab === "graph" && <Network size={14} />}
                    {tab === "info" ? "Tools Config" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Workspace Contents */}
              <div className="flex-1">
                {activeTab === "info" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                        Topic Tools configuration
                      </h3>
                      <p className="text-xs text-slate-400">
                        Enable specific business actions that the AI Agent can execute when handling this topic.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {AVAILABLE_TOOLS.map((t) => {
                        const isEnabled = selectedTopic.tools?.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                              isEnabled
                                ? "bg-slate-50/50 dark:bg-slate-800/10 border-primary/50"
                                : "bg-transparent border-slate-100 dark:border-slate-800"
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                isEnabled
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {isEnabled && <Check size={10} />}
                            </span>
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {t.label}
                              </div>
                              <div className="text-[10px] text-slate-400">{t.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "docs" && (
                  <div className="overflow-x-auto">
                    {documents.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        No documents associated with this topic.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                            <th className="py-2">Document Title</th>
                            <th className="py-2">File Name</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((d) => (
                            <tr key={d._id} className="border-b border-slate-100/50 dark:border-slate-800/20 text-slate-700 dark:text-slate-350 hover:bg-slate-50/20 dark:hover:bg-slate-850/10">
                              <td className="py-3 font-medium">{d.title}</td>
                              <td className="py-3">{d.file_name}</td>
                              <td className="py-3 capitalize">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  d.status === "published" || d.status === "ready_for_review" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                                }`}>
                                  {d.status?.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "chunks" && (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {chunks.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        No chunks processed for this topic.
                      </div>
                    ) : (
                      chunks.map((c) => (
                        <div
                          key={c._id}
                          className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white/20 dark:bg-slate-900/10 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between text-slate-450">
                            <span className="font-semibold">Chunk #{c.chunk_index}</span>
                            <span>{c.token_count} tokens</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/30 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            {c.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "graph" && (
                  <div className="space-y-6">
                    <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/20 text-indigo-800 dark:text-indigo-400 rounded-xl text-xs flex items-start gap-2.5">
                      <Info size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        These nodes and relationships represent structural concepts extracted dynamically from document chunks.
                        They are used during <strong>GraphRAG</strong> retrieval to resolve complex context reasoning questions.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Entities list */}
                      <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 space-y-3 bg-white/10">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Extracted Entities
                        </h4>
                        <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                          {graphData.entities.length === 0 ? (
                            <div className="text-slate-450 text-xs py-4">No entities extracted.</div>
                          ) : (
                            graphData.entities.map((e, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-850/10 border border-slate-100 dark:border-slate-800 text-xs"
                              >
                                <span className="font-semibold text-slate-850 dark:text-slate-200">{e.name}</span>
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-[10px]">
                                  {e.type}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Relationships list */}
                      <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 space-y-3 bg-white/10">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Relationships / Edges
                        </h4>
                        <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                          {graphData.relationships.length === 0 ? (
                            <div className="text-slate-450 text-xs py-4">No relationships extracted.</div>
                          ) : (
                            graphData.relationships.map((r, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-slate-50/50 dark:bg-slate-850/10 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                              >
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>{r.source}</span>
                                  <span className="text-primary font-semibold">→</span>
                                  <span>{r.target}</span>
                                </div>
                                <div className="font-medium text-slate-700 dark:text-slate-300">
                                  Relation: <span className="text-emerald-500 font-semibold">{r.type}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
              <FolderTree size={40} className="stroke-[1.5]" />
              <div className="font-medium text-slate-650">No Topic Selected</div>
              <p className="text-xs max-w-sm">
                Select a topic from the left sidebar panel or create a new topic to manage tools configuration and graph details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Topic Modals */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {showCreateModal ? "Create New Topic" : "Edit Topic"}
              </h3>

              <form onSubmit={showCreateModal ? handleCreateTopic : handleEditTopic} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Topic Name</label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-transparent outline-none focus:border-primary"
                    placeholder="e.g. Refund"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description</label>
                  <textarea
                    value={modalDesc}
                    onChange={(e) => setModalDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-transparent outline-none focus:border-primary resize-none"
                    placeholder="Briefly describe what this topic covers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setModalEnabled(!modalEnabled)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {modalEnabled ? <ToggleRight className="text-emerald-500" size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <span className="text-xs text-slate-500">Enable this topic in LLM routing</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Business Tools</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[22vh] overflow-y-auto border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                    {AVAILABLE_TOOLS.map((t) => {
                      const isChecked = modalTools.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleModalTool(t.id)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="rounded border-slate-350 text-primary accent-primary pointer-events-none"
                          />
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{t.label}</div>
                            <div className="text-[10px] text-slate-400">{t.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl hover:bg-slate-55 text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-medium shadow-md transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
