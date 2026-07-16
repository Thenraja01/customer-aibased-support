import { useState } from "react";
import { Search, Users, FileText, MessageSquare, Ticket } from "lucide-react";
import { ChatAPI, UsersAPI, TicketAPI, DocumentAPI } from "@/api";

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "chats" | "tickets" | "documents">("all");

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults({});
      return;
    }

    setLoading(true);
    try {
      const [usersRes, chatsRes, ticketsRes, docsRes] = await Promise.all([
        UsersAPI.getAll({ search: searchQuery }).catch(() => ({ data: { success: false, data: [] } })),
        ChatAPI.search({ q: searchQuery }).catch(() => ({ data: { success: false, data: [] } })),
        TicketAPI.getAll({ search: searchQuery }).catch(() => ({ data: { success: false, data: [] } })),
        DocumentAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const filteredDocs = docsRes.data.success 
        ? docsRes.data.data.filter((doc: any) => 
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

      setResults({
        users: usersRes.data.success ? usersRes.data.data : [],
        chats: chatsRes.data.success ? chatsRes.data.data : [],
        tickets: ticketsRes.data.success ? ticketsRes.data.data : [],
        documents: filteredDocs,
      });
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = Object.values(results).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Global Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across users, chats, tickets, and documents.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for anything..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background dark:bg-card/50 dark:border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-white/[0.06]">
        {[
          { id: "all", label: "All", count: totalResults },
          { id: "users", label: "Users", count: results.users?.length || 0, icon: Users },
          { id: "chats", label: "Chats", count: results.chats?.length || 0, icon: MessageSquare },
          { id: "tickets", label: "Tickets", count: results.tickets?.length || 0, icon: Ticket },
          { id: "documents", label: "Documents", count: results.documents?.length || 0, icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Searching...</div>
        </div>
      ) : !query ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Enter a search query to begin</div>
        </div>
      ) : totalResults === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">No results found for "{query}"</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Users */}
          {(activeTab === "all" || activeTab === "users") && results.users?.length > 0 && (
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h3 className="text-sm font-medium">Users</h3>
                <span className="text-xs text-muted-foreground">({results.users.length})</span>
              </div>
              <div className="divide-y dark:divide-white/[0.04]">
                {results.users.map((user: any) => (
                  <div key={user._id} className="px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03]">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chats */}
          {(activeTab === "all" || activeTab === "chats") && results.chats?.length > 0 && (
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                <h3 className="text-sm font-medium">Chats</h3>
                <span className="text-xs text-muted-foreground">({results.chats.length})</span>
              </div>
              <div className="divide-y dark:divide-white/[0.04]">
                {results.chats.map((chat: any) => (
                  <div key={chat._id} className="px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03]">
                    <p className="text-sm font-medium">{chat.topic || "Support Chat"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(chat.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {(activeTab === "all" || activeTab === "tickets") && results.tickets?.length > 0 && (
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-2">
                <Ticket size={16} className="text-primary" />
                <h3 className="text-sm font-medium">Tickets</h3>
                <span className="text-xs text-muted-foreground">({results.tickets.length})</span>
              </div>
              <div className="divide-y dark:divide-white/[0.04]">
                {results.tickets.map((ticket: any) => (
                  <div key={ticket._id} className="px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03]">
                    <p className="text-sm font-medium">{ticket.subject || ticket.title}</p>
                    <p className="text-xs text-muted-foreground">{ticket.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {(activeTab === "all" || activeTab === "documents") && results.documents?.length > 0 && (
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-sm font-medium">Documents</h3>
                <span className="text-xs text-muted-foreground">({results.documents.length})</span>
              </div>
              <div className="divide-y dark:divide-white/[0.04]">
                {results.documents.map((doc: any) => (
                  <div key={doc._id} className="px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03]">
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
