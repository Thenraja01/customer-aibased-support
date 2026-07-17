import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { cn } from "@/lib/utils";

const PLANS = {
  Starter: {
    monthlyPrice: 29,
    tokenLimit: 100000,
    userLimit: 5,
    documentLimit: 50,
    color: "text-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
  },
  Professional: {
    monthlyPrice: 99,
    tokenLimit: 500000,
    userLimit: 25,
    documentLimit: 200,
    color: "text-violet-500",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
  },
  Enterprise: {
    monthlyPrice: 299,
    tokenLimit: 2000000,
    userLimit: -1,
    documentLimit: -1,
    color: "text-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
  },
};

const CYCLES = ["monthly", "quarterly", "annual"] as const;

interface OrgSubscription {
  id: string;
  orgId: string;
  orgName: string;
  plan: keyof typeof PLANS;
  status: "active" | "trial" | "past_due" | "cancelled";
  billingCycle: string;
  startDate: string;
  nextBilling: string;
  tokensUsed: number;
  tokensLimit: number;
}

const MOCK_SUBSCRIPTIONS: OrgSubscription[] = [
  { id: "sub_1", orgId: "org_1", orgName: "Acme Corp", plan: "Enterprise", status: "active", billingCycle: "annual", startDate: "2025-01-15", nextBilling: "2026-01-15", tokensUsed: 1450000, tokensLimit: 2000000 },
  { id: "sub_2", orgId: "org_2", orgName: "TechStart Inc", plan: "Professional", status: "active", billingCycle: "monthly", startDate: "2025-06-01", nextBilling: "2026-08-01", tokensUsed: 380000, tokensLimit: 500000 },
  { id: "sub_3", orgId: "org_3", orgName: "Global Solutions", plan: "Professional", status: "trial", billingCycle: "monthly", startDate: "2026-06-10", nextBilling: "2026-07-10", tokensUsed: 45000, tokensLimit: 500000 },
  { id: "sub_4", orgId: "org_4", orgName: "LocalBiz", plan: "Starter", status: "active", billingCycle: "monthly", startDate: "2025-11-20", nextBilling: "2026-08-20", tokensUsed: 72000, tokensLimit: 100000 },
  { id: "sub_5", orgId: "org_5", orgName: "DataFlow Ltd", plan: "Starter", status: "past_due", billingCycle: "quarterly", startDate: "2025-09-01", nextBilling: "2026-06-01", tokensUsed: 98000, tokensLimit: 100000 },
  { id: "sub_6", orgId: "org_6", orgName: "InnovateHub", plan: "Enterprise", status: "trial", billingCycle: "annual", startDate: "2026-06-20", nextBilling: "2026-07-20", tokensUsed: 12000, tokensLimit: 2000000 },
  { id: "sub_7", orgId: "org_7", orgName: "Pinnacle Systems", plan: "Professional", status: "cancelled", billingCycle: "monthly", startDate: "2025-03-10", nextBilling: "2026-05-10", tokensUsed: 290000, tokensLimit: 500000 },
  { id: "sub_8", orgId: "org_8", orgName: "BrightPath AI", plan: "Starter", status: "active", billingCycle: "annual", startDate: "2026-01-05", nextBilling: "2027-01-05", tokensUsed: 31000, tokensLimit: 100000 },
];

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "active") return "default";
  if (s === "trial") return "secondary";
  if (s === "past_due") return "destructive";
  return "outline";
}

export default function SubscriptionManagementPage() {
  const [subscriptions, setSubscriptions] = useState<OrgSubscription[]>(MOCK_SUBSCRIPTIONS);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingSub, setEditingSub] = useState<OrgSubscription | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");
  const [newCycle, setNewCycle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch = s.orgName.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || s.plan === planFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [subscriptions, search, planFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === "active").length;
    const trialOrgs = subscriptions.filter((s) => s.status === "trial").length;
    const mrr = subscriptions
      .filter((s) => s.status === "active" || s.status === "past_due")
      .reduce((sum, s) => {
        const price = PLANS[s.plan].monthlyPrice;
        if (s.billingCycle === "annual") return sum + price / 12;
        if (s.billingCycle === "quarterly") return sum + price / 3;
        return sum + price;
      }, 0);
    return { activeSubs, trialOrgs, mrr };
  }, [subscriptions]);

  const handlePlanChange = () => {
    if (!editingSub || !newPlan) return;
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === editingSub.id
          ? {
              ...s,
              plan: newPlan as keyof typeof PLANS,
              billingCycle: newCycle || s.billingCycle,
              tokensLimit: PLANS[newPlan as keyof typeof PLANS].tokenLimit,
            }
          : s
      )
    );
    setEditingSub(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading subscriptions...
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">Manage organization plans, billing, and token limits.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 400); }}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold mt-2">${stats.mrr.toFixed(0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
              <DollarSign size={20} className="text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold mt-2">{stats.activeSubs}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <CreditCard size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trial Organizations</p>
              <p className="text-2xl font-bold mt-2">{stats.trialOrgs}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <Users size={20} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orgs</p>
              <p className="text-2xl font-bold mt-2">{subscriptions.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp size={20} className="text-accent-foreground" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard size={18} className="text-primary" /> Plans &amp; Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([name, plan]) => (
                <div
                  key={name}
                  className={cn(
                    "rounded-xl border p-5 space-y-3 dark:border-white/[0.06]",
                    name === "Professional" && "ring-2 ring-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", plan.color)}>{name}</span>
                    {name === "Professional" && <Badge variant="default">Popular</Badge>}
                  </div>
                  <p className="text-2xl font-bold">
                    ${plan.monthlyPrice}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>{formatTokens(plan.tokenLimit)} tokens / month</p>
                    <p>{plan.userLimit === -1 ? "Unlimited" : plan.userLimit} users</p>
                    <p>{plan.documentLimit === -1 ? "Unlimited" : plan.documentLimit} documents</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead className="text-right">Tokens Used</TableHead>
              <TableHead>Token Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub) => {
                const usagePct = sub.tokensLimit > 0 ? (sub.tokensUsed / sub.tokensLimit) * 100 : 0;
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="font-medium">{sub.orgName}</p>
                      <p className="text-xs text-muted-foreground">{sub.orgId}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-sm font-medium", PLANS[sub.plan].color)}>
                        {sub.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sub.status)} className="capitalize">
                        {sub.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm capitalize">{sub.billingCycle}</p>
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(sub.nextBilling).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-medium">{formatTokens(sub.tokensUsed)}</p>
                      <p className="text-xs text-muted-foreground">
                        of {formatTokens(sub.tokensLimit)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              usagePct > 90
                                ? "bg-destructive"
                                : usagePct > 70
                                  ? "bg-amber-500"
                                  : "bg-primary"
                            )}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {usagePct.toFixed(0)}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSub(sub);
                          setNewPlan(sub.plan);
                          setNewCycle(sub.billingCycle);
                        }}
                      >
                        Change Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!editingSub} onOpenChange={(open) => { if (!open) setEditingSub(null); }}>
        <DialogContent className="dark:bg-card dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>Change Plan — {editingSub?.orgName}</DialogTitle>
            <DialogDescription>
              Update the subscription plan and billing cycle for this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Plan</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p} — ${PLANS[p].monthlyPrice}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select value={newCycle} onValueChange={setNewCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newPlan && (
              <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1 dark:border-white/[0.06]">
                <p>
                  <span className="font-medium text-foreground">Token Limit:</span>{" "}
                  {formatTokens(PLANS[newPlan as keyof typeof PLANS].tokenLimit)}/mo
                </p>
                <p>
                  <span className="font-medium text-foreground">User Limit:</span>{" "}
                  {PLANS[newPlan as keyof typeof PLANS].userLimit === -1
                    ? "Unlimited"
                    : PLANS[newPlan as keyof typeof PLANS].userLimit}
                </p>
                <p>
                  <span className="font-medium text-foreground">Document Limit:</span>{" "}
                  {PLANS[newPlan as keyof typeof PLANS].documentLimit === -1
                    ? "Unlimited"
                    : PLANS[newPlan as keyof typeof PLANS].documentLimit}
                </p>
              </div>
            )}
            {editingSub && newPlan && newPlan !== editingSub.plan && (
              <div className="flex items-center gap-2 text-xs text-amber-500">
                <AlertTriangle size={14} />
                {PLANS[PLANS[newPlan as keyof typeof PLANS] ? newPlan as keyof typeof PLANS : editingSub.plan].monthlyPrice >
                PLANS[editingSub.plan].monthlyPrice ? (
                  <span className="flex items-center gap-1">
                    Upgrading <ArrowUpRight size={12} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Downgrading <ArrowDownRight size={12} />
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSub(null)}>
              Cancel
            </Button>
            <Button onClick={handlePlanChange} disabled={!newPlan}>
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
