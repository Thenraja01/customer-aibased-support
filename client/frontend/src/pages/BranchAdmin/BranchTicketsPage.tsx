import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";

export default function BranchTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = "/tickets?limit=50";
      if (statusFilter !== "all") query += `&status=${statusFilter}`;
      if (priorityFilter !== "all") query += `&priority=${priorityFilter}`;
      const res = await AxiosInstance.get(query);
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch branch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const title = (t.title || t.subject || "").toLowerCase();
    const num = (t.ticket_number || "").toString();
    return title.includes(search.toLowerCase()) || num.includes(search);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Branch Ticket Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Manage, assign, and supervise customer support requests scoped to this branch.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket title or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Ticket</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading branch tickets...</td>
                </tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr 
                    key={t._id} 
                    onClick={() => navigate(`/branch/tickets/${t._id}`)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-4 font-medium text-slate-200">
                      <div className="font-mono text-indigo-400">#{t.ticket_number || t._id.slice(-6)}</div>
                      <div className="text-xs text-slate-300 font-semibold">{t.title || t.subject}</div>
                    </td>
                    <td className="p-4">{t.category || "General"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.priority === "urgent" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                        t.priority === "high" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-slate-800 text-slate-300"
                      }`}>
                        {t.priority || "Medium"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.status === "escalated" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                        t.status === "resolved" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {t.assigned_to ? t.assigned_to.name || "Assigned" : "Unassigned"}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(t.createdAt || t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No tickets found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
