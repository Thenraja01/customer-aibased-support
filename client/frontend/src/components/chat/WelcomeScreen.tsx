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
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "@/api/axiosInstance";
import ChatInput from "./ChatInput";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
}

const DEFAULT_ENTERPRISE_SHORTCUTS = [
  {
    icon: RefreshCw,
    title: "Refunds & Policy Guidelines",
    desc: "Instant rules from documentation & eligibility checks",
    query: "What are the refund and return policies according to our knowledge docs?",
    gradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
    border: "border-emerald-500/25 hover:border-emerald-400/50",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: CreditCard,
    title: "Billing, Plans & Invoices",
    desc: "Subscription terms, payment methods & receipts",
    query: "Explain billing cycles, tax receipts, and payment method updates from the documentation.",
    gradient: "from-cyan-500/15 via-blue-500/10 to-transparent",
    border: "border-cyan-500/25 hover:border-cyan-400/50",
    iconBg: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: ShieldCheck,
    title: "Security & 2FA Setup Guide",
    desc: "Credential hygiene & multi-factor auth steps",
    query: "Provide step-by-step documentation for configuring Two-Factor Authentication and password reset.",
    gradient: "from-amber-500/15 via-orange-500/10 to-transparent",
    border: "border-amber-500/25 hover:border-amber-400/50",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Ticket,
    title: "Assisted Ticket Creation",
    desc: "AI-guided incident logging with auto-categorization",
    query: "I need to file a formal support ticket. Please guide me through collecting the required incident details.",
    gradient: "from-indigo-500/15 via-purple-500/10 to-transparent",
    border: "border-indigo-500/25 hover:border-indigo-400/50",
    iconBg: "bg-indigo-500/10 text-indigo-400",
  },
];

const TOPIC_ICON_MAP: Record<string, any> = {
  refund: RefreshCw,
  return: RefreshCw,
  shipping: Truck,
  delivery: Truck,
  billing: CreditCard,
  payment: CreditCard,
  security: ShieldCheck,
  auth: ShieldCheck,
  complaint: AlertTriangle,
  sla: FileCheck,
  sop: FileCheck,
  warranty: ShieldCheck,
  faq: HelpCircle,
};

const STYLES_PALETTE = [
  { gradient: "from-emerald-500/15 via-teal-500/10 to-transparent", border: "border-emerald-500/25 hover:border-emerald-400/50", iconBg: "bg-emerald-500/10 text-emerald-400" },
  { gradient: "from-cyan-500/15 via-blue-500/10 to-transparent", border: "border-cyan-500/25 hover:border-cyan-400/50", iconBg: "bg-cyan-500/10 text-cyan-400" },
  { gradient: "from-amber-500/15 via-orange-500/10 to-transparent", border: "border-amber-500/25 hover:border-amber-400/50", iconBg: "bg-amber-500/10 text-amber-400" },
  { gradient: "from-indigo-500/15 via-purple-500/10 to-transparent", border: "border-indigo-500/25 hover:border-indigo-400/50", iconBg: "bg-indigo-500/10 text-indigo-400" }
];

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage }: WelcomeScreenProps) {
  const { user, orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "Support AI Copilot";
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const { data: topics } = useQuery({
    queryKey: ["welcome-topics", user?.organization_id],
    queryFn: async () => {
      try {
        const res = await AxiosInstance.get("/topics");
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list.filter((t: any) => t.enabled !== false) : [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const shortcuts = useMemo(() => {
    if (!topics || topics.length === 0) return DEFAULT_ENTERPRISE_SHORTCUTS;

    return topics.slice(0, 4).map((t: any, idx: number) => {
      const lowerName = (t.name || "").toLowerCase();
      let matchedIcon = HelpCircle;
      for (const [key, icon] of Object.entries(TOPIC_ICON_MAP)) {
        if (lowerName.includes(key)) {
          matchedIcon = icon;
          break;
        }
      }

      const style = STYLES_PALETTE[idx % STYLES_PALETTE.length];
      return {
        icon: matchedIcon,
        title: t.name,
        desc: t.description || `Instant rules and guidelines for ${t.name}`,
        query: `Tell me about ${t.name} and related policies from the knowledge base.`,
        gradient: style.gradient,
        border: style.border,
        iconBg: style.iconBg,
      };
    });
  }, [topics]);

  return (
    <div className="flex-1 flex flex-col justify-between items-center px-4 sm:px-6 py-4 w-full h-full overflow-hidden select-none relative">
      {/* Top Spacer */}
      <div className="hidden sm:block shrink-0 h-2" />

      {/* Center AI Showcase & Shortcuts */}
      <div className="flex flex-col items-center justify-center max-w-2xl w-full my-auto space-y-5">
        {/* 3D Holographic AI Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 blur-2xl animate-pulse pointer-events-none" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-emerald-400 to-teal-400 p-[1.5px] shadow-[0_0_30px_rgba(16,185,129,0.35)]">
            <div className="w-full h-full rounded-[14px] bg-neutral-950 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
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
            How can <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">{botName}</span> assist you, {firstName}?
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Directly connected to verified knowledge docs, policies, workflows, and automated system diagnostics.
          </p>
        </motion.div>

        {/* 4 Smart Knowledge Shortcut Cards */}
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
                className={`relative flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${item.gradient} bg-card/60 backdrop-blur-md ${item.border} text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] shadow-sm group cursor-pointer`}
              >
                <div className={`p-2 rounded-lg ${item.iconBg} shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10.5px] text-muted-foreground truncate leading-tight mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Floating Input Bar */}
      <div className="w-full max-w-2xl shrink-0 pt-2">
        <ChatInput onSend={(text) => onStartWithMessage(text)} />
      </div>
    </div>
  );
});

export default WelcomeScreen;
