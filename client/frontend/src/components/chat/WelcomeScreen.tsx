import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Ticket,
  Truck,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  FileText,
  Zap,
  BookOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
}

const ICON_MAP: Record<string, any> = {
  refund: RefreshCw,
  return: RefreshCw,
  shipping: Truck,
  delivery: Truck,
  billing: CreditCard,
  payment: CreditCard,
  pricing: CreditCard,
  invoice: CreditCard,
  security: ShieldCheck,
  auth: ShieldCheck,
  "2fa": ShieldCheck,
  complaint: AlertTriangle,
  sla: FileCheck,
  sop: FileCheck,
  document: FileText,
  doc: FileText,
  ticket: Ticket,
  support: Ticket,
  faq: HelpCircle,
  ai: Sparkles,
  diagnostic: Zap,
};

const STYLES_PALETTE = [
  { gradient: "from-primary/15 via-primary/5 to-transparent", border: "border-primary/25 hover:border-primary/50", iconBg: "bg-primary/10 text-primary" },
  { gradient: "from-flax/15 via-flax/5 to-transparent", border: "border-flax/25 hover:border-flax/50", iconBg: "bg-flax/10 text-flax" },
  { gradient: "from-caution/15 via-caution/5 to-transparent", border: "border-caution/25 hover:border-caution/50", iconBg: "bg-caution/10 text-caution" },
  { gradient: "from-success/15 via-success/5 to-transparent", border: "border-success/25 hover:border-success/50", iconBg: "bg-success/10 text-success" },
];

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage }: WelcomeScreenProps) {
  const { user, orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "Support AI Copilot";
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  // Purely dynamic backend knowledge query: fetches dynamic actions, topics, and document summaries
  const { data: dynamicActions, isLoading } = useQuery({
    queryKey: ["welcome-knowledge-shortcuts", user?.organization_id],
    queryFn: async () => {
      try {
        // 1. Try unified intelligence endpoint (Topics + Doc Summaries + Graph Nodes + Crowd Queries)
        const res = await AxiosInstance.get("/chats/quick-actions");
        const actions = res.data?.quickActions || res.data?.data || [];
        if (Array.isArray(actions) && actions.length > 0) {
          return actions;
        }

        // 2. Query published documents to extract AI summaries & titles
        const docRes = await AxiosInstance.get("/documents", { params: { status: "published", limit: 6 } });
        const docs = docRes.data?.data?.documents || docRes.data?.documents || docRes.data?.data || [];
        if (Array.isArray(docs) && docs.length > 0) {
          return docs.map((d: any) => {
            const cleanTitle = (d.title || "Knowledge Document").replace(/\.[a-zA-Z0-9]+$/, "").trim();
            const summary = d.summary || d.context_summary || d.description || `Information extracted from ${cleanTitle}`;
            return {
              id: d._id || cleanTitle,
              label: cleanTitle,
              description: summary,
              query: `Summarize the key takeaways and policies from "${cleanTitle}".`,
              icon: "document",
            };
          });
        }

        // 3. Fallback to configured topics
        const topicRes = await AxiosInstance.get("/topics");
        const topicList = topicRes.data?.data || topicRes.data || [];
        if (Array.isArray(topicList) && topicList.length > 0) {
          return topicList.filter((t: any) => t.enabled !== false).map((t: any) => ({
            id: t._id || t.name,
            label: t.name,
            description: t.description || `Guidelines and knowledge about ${t.name}`,
            query: `Tell me about ${t.name} and related policies from the knowledge base.`,
            icon: t.name,
          }));
        }

        return [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const shortcuts = useMemo(() => {
    if (!dynamicActions || dynamicActions.length === 0) return [];

    return dynamicActions.slice(0, 4).map((item: any, idx: number) => {
      const name = item.label || item.name || item.title || "Knowledge Base";
      const lowerName = name.toLowerCase();

      let matchedIcon = HelpCircle;
      for (const [key, icon] of Object.entries(ICON_MAP)) {
        if (lowerName.includes(key) || (item.icon && item.icon.toLowerCase().includes(key))) {
          matchedIcon = icon;
          break;
        }
      }

      const style = STYLES_PALETTE[idx % STYLES_PALETTE.length];
      return {
        icon: matchedIcon,
        title: name,
        desc: item.description || `Instant rules and guidelines for ${name}`,
        query: item.query || `Tell me about ${name} from our verified knowledge docs.`,
        gradient: style.gradient,
        border: style.border,
        iconBg: style.iconBg,
      };
    });
  }, [dynamicActions]);

  return (
    <div className="flex-1 flex flex-col justify-between items-center px-4 sm:px-6 py-4 w-full h-full overflow-hidden select-none relative">
      {/* Top Spacer */}
      <div className="hidden sm:block shrink-0 h-2" />

      {/* Center AI Showcase & Dynamic Shortcuts */}
      <div className="flex flex-col items-center justify-center max-w-2xl w-full my-auto space-y-5">
        {/* 3D Holographic AI Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 blur-2xl animate-pulse pointer-events-none" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-flax to-success p-[1.5px] shadow-[0_0_30px_rgba(216,101,62,0.35)]">
            <div className="w-full h-full rounded-[14px] bg-neutral-950 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Clean Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="text-center space-y-1"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            How can <span className="bg-gradient-to-r from-primary via-flax to-success bg-clip-text text-transparent">{botName}</span> assist you, {firstName}?
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Directly connected to verified knowledge docs, policies, workflows, and automated system diagnostics.
          </p>
        </motion.div>

        {/* Dynamic Knowledge Shortcuts from Backend */}
        {shortcuts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full"
          >
            {shortcuts.map((item: any, idx: number) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onStartWithMessage(item.query)}
                  className={`group relative flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br ${item.gradient} border ${item.border} backdrop-blur-md transition-all duration-200 text-left hover:scale-[1.015] active:scale-[0.99] shadow-xs`}
                >
                  <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        ) : !isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-card/60 border border-border/60 text-center max-w-md"
          >
            <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Ask any question below to query the enterprise knowledge base, or search documentation in real time.
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* Bottom Spacer */}
      <div className="hidden sm:block shrink-0 h-4" />
    </div>
  );
});

export default WelcomeScreen;
