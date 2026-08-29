import { useState, useEffect } from "react";
import { 
  Ticket, ShieldAlert, CheckCircle2, Clock, AlertTriangle, 
  TrendingUp, Activity, UserCheck, RefreshCw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AxiosInstance from "@/api/axiosInstance";
import AIAgentOperations from "@/components/admin/AIAgentOperations";

import { Link } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BranchAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<"branch_support" | "ai_operations" | "command_center">("branch_support");
  const [stats, setStats] = useState({
    totalTickets: 124,
    openTickets: 23,
    activeChats: 8,
    escalatedChats: 3,
    pendingChats: 6,
    resolvedToday: 32,
    activeAgents: 8,
    slaBreaches: 2,
    csatScore: 4.8,
  });

  const [ticketTrend] = useState([
    { day: "Mon", created: 24, resolved: 20 },
    { day: "Tue", created: 30, resolved: 28 },
    { day: "Wed", created: 18, resolved: 22 },
    { day: "Thu", created: 35, resolved: 31 },
    { day: "Fri", created: 28, resolved: 25 },
    { day: "Sat", created: 12, resolved: 14 },
    { day: "Sun", created: 8, resolved: 9 },
  ]);

  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchBranchDashboardData();
  }, []);

  const fetchBranchDashboardData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        AxiosInstance.get("/tickets?limit=5"),
        AxiosInstance.get("/tickets/stats").catch(() => null),
      ]);
      if (ticketsRes.data?.data) {
        setRecentTickets(Array.isArray(ticketsRes.data.data) ? ticketsRes.data.data : []);
      }
      if (statsRes?.data?.data) {
        const s = statsRes.data.data;
        setStats((prev) => ({
          ...prev,
          totalTickets: s.total ?? s.totalTickets ?? prev.totalTickets,
          openTickets: s.open ?? s.openTickets ?? prev.openTickets,
          resolvedToday: s.resolved ?? s.resolvedToday ?? prev.resolvedToday,
          slaBreaches: s.breached ?? s.slaBreaches ?? prev.slaBreaches,
        }));
      }
    } catch {
      setRecentTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Support Console</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor branch live chats, agent queue, SLA performance, and active escalations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700">
            <button
              type="button"
              onClick={() => setViewTab("branch_support")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewTab === "branch_support"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💬 Branch Support
            </button>
            <button
              type="button"
              onClick={() => setViewTab("ai_operations")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewTab === "ai_operations"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🤖 AI Operations
            </button>
            <button
              type="button"
              onClick={() => setViewTab("command_center")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewTab === "command_center"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 SLA & Queue
            </button>
          </div>
          <button 
            onClick={fetchBranchDashboardData}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 rounded-xl transition text-indigo-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {viewTab === "ai_operations" ? (
        <AIAgentOperations />
      ) : viewTab === "branch_support" ? (
        <div className="space-y-6">
          {/* Branch Support Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Active Chats</p>
                <p className="text-3xl font-extrabold text-indigo-400 mt-1">{stats.activeChats}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Live support sessions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <MessageSquare size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Open Tickets</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-1">{stats.openTickets}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Branch tickets open</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Ticket size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-rose-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Escalated</p>
                <p className="text-3xl font-extrabold text-rose-400 mt-1">{stats.escalatedChats}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Requires re-assignment</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Pending Queue</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.pendingChats}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Unassigned requests</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Clock size={22} />
              </div>
            </div>
          </div>

          {/* Quick Launch Bar */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="space-y-1">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-400" />
                Branch Live Support Console
              </h3>
              <p className="text-xs text-slate-300">
                Access your 3-column operational live chat console to monitor, assign agents, and handle branch escalations.
              </p>
            </div>
            <Link to="/branch/live-support">
              <Badge className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 font-bold cursor-pointer text-xs shadow-md">
                Launch Live Console →
              </Badge>
            </Link>
          </div>

          {/* Support Agents Table */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-400" />
                Branch Support Agents Activity
              </h3>
              <Badge variant="outline" className="text-xs">Branch Scope</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 uppercase text-[10px] text-muted-foreground font-bold">
                  <tr>
                    <th className="p-3 rounded-l-lg">Agent</th>
                    <th className="p-3">Active Chats</th>
                    <th className="p-3">Open Tickets</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg">SLA Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 font-bold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                        <User size={12} />
                      </div>
                      Kumar (Senior Agent)
                    </td>
                    <td className="p-3 font-bold text-indigo-400">3</td>
                    <td className="p-3">5</td>
                    <td className="p-3"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge></td>
                    <td className="p-3"><span className="text-emerald-400 font-semibold">Healthy (100%)</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                        <User size={12} />
                      </div>
                      Ravi (Support Agent)
                    </td>
                    <td className="p-3 font-bold text-indigo-400">2</td>
                    <td className="p-3">4</td>
                    <td className="p-3"><Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">🟡 Busy</Badge></td>
                    <td className="p-3"><span className="text-amber-400 font-semibold">Busy (94%)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Escalated Conversations */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle size={18} />
              Branch Escalated Conversations
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 border rounded-xl flex items-center justify-between bg-rose-500/5 border-rose-500/20">
                <div>
                  <span className="font-bold text-foreground">🔴 #CHAT-1024 — Payment issue on checkout</span>
                  <p className="text-muted-foreground text-[11px]">Assigned to: Kumar · Branch Escalation</p>
                </div>
                <Link to="/branch/live-support">
                  <Badge variant="outline" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold cursor-pointer">Reassign / Intervene</Badge>
                </Link>
              </div>

              <div className="p-3 border rounded-xl flex items-center justify-between bg-amber-500/5 border-amber-500/20">
                <div>
                  <span className="font-bold text-foreground">🔴 #CHAT-1021 — AI unresolved fallback</span>
                  <p className="text-muted-foreground text-[11px]">Assigned to: Ravi · Low AI Confidence</p>
                </div>
                <Link to="/branch/live-support">
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold cursor-pointer">View Chat</Badge>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Open Tickets</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.openTickets}</div>
          <div className="text-xs text-amber-400/90 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" /> 4 requiring urgent response
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active Agents</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.activeAgents}</div>
          <div className="text-xs text-emerald-400/90 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5" /> All online and available
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">SLA Risk & Breaches</span>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.slaBreaches}</div>
          <div className="text-xs text-rose-400/90 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> 2 tickets breached SLA
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">CSAT Score</span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.csatScore} / 5.0</div>
          <div className="text-xs text-indigo-400/90 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> +0.2 this week
          </div>
        </div>
      </div>

      {/* Branch Agent Workload & Status Matrix */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Branch Agent Workload & Live Status</h2>
            <p className="text-xs text-slate-400">Monitor agent assignment capacity and response readiness</p>
          </div>
          <a href="/branch/agents" className="text-xs text-indigo-400 hover:underline font-medium">Manage Branch Agents →</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Then Raja M", role: "Senior Support Agent", activeTickets: 3, status: "Online", avgTime: "1m 45s" },
            { name: "Sarah Jenkins", role: "Branch Support Specialist", activeTickets: 5, status: "Busy", avgTime: "2m 10s" },
            { name: "David Kim", role: "Technical Escalations", activeTickets: 2, status: "Online", avgTime: "1m 20s" },
            { name: "Elena Rostova", role: "Tier 1 Support Agent", activeTickets: 4, status: "Away", avgTime: "2m 40s" },
          ].map((agent, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-100 text-sm truncate">{agent.name}</div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  agent.status === "Online" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : agent.status === "Busy" ? "bg-amber-500" : "bg-slate-500"
                }`} />
              </div>
              <p className="text-[11px] text-slate-400 truncate">{agent.role}</p>
              <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                <span className="text-slate-400">Assigned: <strong className="text-slate-200">{agent.activeTickets} tickets</strong></span>
                <span className="text-indigo-400 font-mono text-[11px]">{agent.avgTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Ticket Volume & Resolution Velocity</h2>
            <p className="text-xs text-slate-400">Created vs resolved tickets over the past 7 days</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ticketTrend}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
              <Area type="monotone" dataKey="created" stroke="#818cf8" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
              <Area type="monotone" dataKey="resolved" stroke="#34d399" fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Queue */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Active Branch Tickets</h3>
          <a href="/branch/tickets" className="text-xs text-indigo-400 hover:underline font-medium">View All Tickets →</a>
        </div>
        <div className="divide-y divide-slate-800/60">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <div key={ticket._id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div>
                  <div className="font-medium text-slate-200 text-sm">{ticket.title || ticket.subject}</div>
                  <div className="text-xs text-slate-400 mt-1">Ticket #{ticket.ticket_number} • {ticket.category || "General"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    ticket.priority === "urgent" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-slate-800 text-slate-300"
                  }`}>
                    {ticket.priority || "Normal"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {ticket.status || "Open"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No tickets currently pending in branch queue.
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
