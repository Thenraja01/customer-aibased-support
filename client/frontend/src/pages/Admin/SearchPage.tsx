import { useState, useCallback } from "react";
import { Search, Users, FileText, MessageSquare, Ticket, Filter, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchAPI } from "@/api/search.api";

type SearchCategory = "all" | "users" | "chats" | "tickets" | "documents" | "faqs";
type TabOption = { id: SearchCategory; label: string; icon: any };

const tabs: TabOption[] = [
  { id: "all", label: "All", icon: Search },
  { id: "faqs", label: "FAQs", icon: Search },
  { id: "users", label: "Users", icon: Users },
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "documents", label: "Documents", icon: FileText },
];

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  user: string;
  category: string;
}

interface SearchResults {
  faqs: any[];
  users: never[];
  chats: any[];
  tickets: any[];
  documents: any[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ faqs: [], users: [], chats: [], tickets: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchCategory>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ dateFrom: "", dateTo: "", status: "", user: "", category: "" });

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleSearch = useCallback(async (searchQuery: string, currentFilters: SearchFilters) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults({ faqs: [], users: [], chats: [], tickets: [], documents: [] });
      return;
    }

    setLoading(true);
    try {
      const params: any = { q: searchQuery };
      if (currentFilters.dateFrom) params.dateFrom = currentFilters.dateFrom;
      if (currentFilters.dateTo) params.dateTo = currentFilters.dateTo;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.user) params.userId = currentFilters.user;
      if (currentFilters.category) params.category = currentFilters.category;

      const res = await SearchAPI.query(params);
      if (res.data.success) {
        const data = res.data.data || { faqs: [], users: [], chats: [], tickets: [], documents: [] };
        setResults({
          faqs: data.faqs || [],
          users: [],
          chats: data.chats || [],
          tickets: data.tickets || [],
          documents: data.documents || [],
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearchChange = (value: string) => {
    handleSearch(value, filters);
  };

  const applyFilters = () => {
    handleSearch(query, filters);
  };

  const resetFilters = () => {
    const empty = { dateFrom: "", dateTo: "", status: "", user: "", category: "" };
    setFilters(empty);
    if (query) handleSearch(query, empty);
  };

  const totalResults = results.faqs.length + results.users.length + results.chats.length + results.tickets.length + results.documents.length;

  const renderResultItem = (item: any, type: string) => (
    <div key={item._id} className="px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors">
      <p className="text-sm font-medium">
        {type === "faqs" && item.question}
        {type === "users" && item.name}
        {type === "chats" && (item.topic || "Support Chat")}
        {type === "tickets" && (item.subject || item.title)}
        {type === "documents" && item.title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {type === "faqs" && item.answer?.slice(0, 120)}
        {type === "users" && item.email}
        {type === "chats" && new Date(item.created_at).toLocaleString()}
        {type === "tickets" && `${item.status} ${item.priority ? `- ${item.priority}` : ""}`}
        {type === "documents" && `${item.status} ${item.file_name ? `- ${item.file_name}` : ""}`}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Search across FAQs, users, chats, tickets, and documents with filters.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for anything..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background dark:bg-card/50 dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            aria-label="Search query"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter size={16} className="mr-1" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {showFilters && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Filter size={14} /> Filters
            </h3>
            <button onClick={resetFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                placeholder="Filter by category"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="resolved">Resolved</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>
          <Button onClick={applyFilters} size="sm" className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </div>
      )}

      <div className="flex gap-1 border-b dark:border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab.id === "all"
            ? totalResults
            : (results[tab.id as keyof SearchResults] as any[])?.length || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {count > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        </div>
      ) : !query ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Search size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Enter a search query to begin</p>
          </div>
        </div>
      ) : totalResults === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No results found for "{query}"</p>
            {hasActiveFilters && <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === "all" || activeTab === "faqs") && results.faqs.length > 0 && (
            <ResultSection icon={Search} title="FAQs" count={results.faqs.length}>
              {results.faqs.map((f) => renderResultItem(f, "faqs"))}
            </ResultSection>
          )}
          {(activeTab === "all" || activeTab === "users") && results.users.length > 0 && (
            <ResultSection icon={Users} title="Users" count={results.users.length}>
              {results.users.map((u) => renderResultItem(u, "users"))}
            </ResultSection>
          )}
          {(activeTab === "all" || activeTab === "chats") && results.chats.length > 0 && (
            <ResultSection icon={MessageSquare} title="Chats" count={results.chats.length}>
              {results.chats.map((c) => renderResultItem(c, "chats"))}
            </ResultSection>
          )}
          {(activeTab === "all" || activeTab === "tickets") && results.tickets.length > 0 && (
            <ResultSection icon={Ticket} title="Tickets" count={results.tickets.length}>
              {results.tickets.map((t) => renderResultItem(t, "tickets"))}
            </ResultSection>
          )}
          {(activeTab === "all" || activeTab === "documents") && results.documents.length > 0 && (
            <ResultSection icon={FileText} title="Documents" count={results.documents.length}>
              {results.documents.map((d) => renderResultItem(d, "documents"))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ icon: Icon, title, count, children }: { icon: any; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
      <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      <div className="divide-y dark:divide-white/[0.04]">{children}</div>
    </div>
  );
}
