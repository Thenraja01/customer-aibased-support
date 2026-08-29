import { useState, useEffect } from "react";
import { Search, Mail } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";

export default function BranchAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBranchAgents();
  }, []);

  const fetchBranchAgents = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/users?role=support");
      if (res.data?.data) {
        setAgents(res.data.data);
      }
    } catch (err) {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Branch Support Agents</h1>
          <p className="text-slate-400 text-sm mt-1">Manage agent capacity, active workload, availability status, and skill assignments.</p>
        </div>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter agents by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-slate-200 text-sm focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center p-8 text-slate-400">Loading branch agents...</div>
        ) : filteredAgents.map((agent) => (
          <div key={agent._id} className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  {agent.name?.[0] || "A"}
                </div>
                <div>
                  <div className="font-semibold text-slate-100">{agent.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {agent.email}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                agent.agent_profile?.status === "ONLINE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
              }`}>
                {agent.agent_profile?.status || "ONLINE"}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Role</span>
                <span className="text-slate-200 font-medium">Support Agent</span>
              </div>
              <div>
                <span className="text-slate-400 block">Max Capacity</span>
                <span className="text-slate-200 font-medium">{agent.agent_profile?.max_active_tickets || 10} Tickets</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
