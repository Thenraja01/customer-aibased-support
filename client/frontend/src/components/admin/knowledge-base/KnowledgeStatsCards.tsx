import {
  FileText,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  HelpCircle,
} from "lucide-react";

interface StatsProps {
  documents: any[];
  verifications: any[];
  faqs: any[];
  indexStatus?: any;
}

export default function KnowledgeStatsCards({ documents, verifications, faqs, indexStatus }: StatsProps) {
  const total = documents.length;
  const published = documents.filter((d) => d.status === "published").length;
  const approved = documents.filter((d) => d.status === "approved").length;
  const pendingApproval = documents.filter((d) => d.status === "pending_approval" || d.status === "pending").length;
  const readyForReview = documents.filter((d) => d.status === "ready_for_review").length;
  const needsRevision = documents.filter((d) => d.status === "needs_revision").length;
  const rejected = documents.filter((d) => d.status === "rejected").length;
  const archived = documents.filter((d) => d.status === "archived").length;
  const indexing = documents.filter((d) => d.status === "processing").length;
  const verified = verifications.filter((v) => v.status === "approved").length;
  const pendingVerifications = verifications.filter((v) => v.status === "pending").length;
  const failedFaqs = faqs.filter((f) => f.status === "rejected").length;
  const chunks = indexStatus?.vectorIndex?.chunks ?? 0;
  const indexedChunks = indexStatus?.vectorIndex?.indexed ?? 0;

  const cards = [
    {
      label: "Total Documents",
      value: total,
      icon: FileText,
      accent: "bg-primary/10 text-primary",
      sub: `${published} published`,
    },
    {
      label: "Pending Approval",
      value: pendingApproval,
      icon: Clock,
      accent: "bg-amber-500/10 text-amber-500",
      sub: `${readyForReview} ready for review`,
    },
    {
      label: "Published",
      value: published,
      icon: Globe,
      accent: "bg-green-500/10 text-green-500",
      sub: `${approved} approved`,
    },
    {
      label: "Needs Revision",
      value: needsRevision,
      icon: RefreshCw,
      accent: "bg-orange-500/10 text-orange-500",
      sub: `${rejected} rejected`,
    },
    {
      label: "Indexing",
      value: indexing,
      icon: Database,
      accent: "bg-indigo-500/10 text-indigo-500",
      sub: `${indexedChunks}/${chunks} chunks embedded`,
    },
    {
      label: "Failed / Rejected",
      value: rejected,
      icon: AlertTriangle,
      accent: "bg-red-500/10 text-red-500",
      sub: `${archived} archived`,
    },
    {
      label: "Pending Verifications",
      value: pendingVerifications,
      icon: CheckCircle2,
      accent: "bg-yellow-500/10 text-yellow-500",
      sub: `${verified} verified`,
    },
    {
      label: "FAQs",
      value: faqs.length,
      icon: HelpCircle,
      accent: "bg-blue-500/10 text-blue-500",
      sub: `${failedFaqs} rejected`,
    },
  ];

  return (
    <div className=" md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${card.accent}`}>
              <card.icon size={18} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
