import { useEffect, useState } from "react";
import { Share2, Search, Database, ExternalLink, Network, FileText } from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { KnowledgeGraphAPI } from "@/api/knowledgeGraph.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/admin/StatsCard";

export default function KnowledgeGraphPage() {
  const [stats, setStats] = useState<{ nodeCount: number; edgeCount: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await AdminAPI.getKnowledgeGraphStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load Knowledge Graph stats", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await KnowledgeGraphAPI.searchNodes({ name: searchQuery });
      if (res.data?.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="text-primary" size={28} />
            Knowledge Graph Telemetry
          </h1>
          <p className="text-muted-foreground text-sm">
            Explore entity relationships and vector space topology across all tenant documents.
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" className="gap-2 text-xs">
          <Database size={16} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Entities (Nodes)"
          value={loadingStats ? "..." : stats?.nodeCount ?? 0}
          icon={<Share2 size={20} />}
          description="Extracted global concepts"
          className="border-primary/20 bg-primary/5"
        />
        <StatsCard
          title="Total Relationships (Edges)"
          value={loadingStats ? "..." : stats?.edgeCount ?? 0}
          icon={<Network size={20} />}
          description="Contextual connections"
          className="border-secondary/20 bg-secondary/5"
        />
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b dark:border-white/[0.06]">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Search size={18} className="text-primary" />
            Global Entity Explorer
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Search for specific entities by name across the entire knowledge graph topology.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search entity name (e.g. 'Policy', 'Database')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" disabled={searching || !searchQuery.trim()} className="h-11 px-6">
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>

          {searchResults.length > 0 ? (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b dark:border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Entity Name</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Document ID</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Created At</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/[0.04]">
                  {searchResults.map((node) => (
                    <tr key={node._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Share2 size={14} className="text-primary" />
                          <span className="font-semibold">{node.entity_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {node.document_id}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(node.created_at || node.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant="outline" className="gap-1 bg-background hover:bg-muted cursor-pointer text-xs">
                          <FileText size={12} />
                          Details
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-dashed dark:border-white/[0.1]">
              <Network size={32} className="text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-medium text-foreground">No Entities Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Try searching for a different concept or ensure documents have been properly indexed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
