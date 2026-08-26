import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";

export default function BranchCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBranchCustomers();
  }, []);

  const fetchBranchCustomers = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/users?role=customer");
      if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Branch Customers</h1>
          <p className="text-slate-400 text-sm mt-1">Directory of customers associated with this branch and their ticket histories.</p>
        </div>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter customers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-slate-200 text-sm focus:outline-none"
        />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading customers...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-medium text-slate-200">{c.name}</td>
                  <td className="p-4 text-slate-400">{c.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
