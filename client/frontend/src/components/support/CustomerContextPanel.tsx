import React from "react";
import { User, Mail, Building2, Phone, Calendar, History, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomerContextPanelProps {
  customer?: any;
  branch?: any;
  totalConversations?: number;
  totalTickets?: number;
}

export const CustomerContextPanel: React.FC<CustomerContextPanelProps> = ({
  customer,
  branch,
  totalConversations = 3,
  totalTickets = 1,
}) => {
  if (!customer) {
    return (
      <div className="p-4 bg-card border rounded-2xl text-xs text-muted-foreground text-center">
        No customer metadata attached.
      </div>
    );
  }

  const name = customer.name || customer.username || "Customer";
  const email = customer.email || "N/A";
  const role = customer.role || "Customer";
  const branchName = branch?.name || customer.branch_id?.name || "Global / Default Branch";

  return (
    <div className="p-4 bg-card border rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center gap-3 border-b pb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
          <User size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm truncate">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      {/* Customer Info Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 size={13} className="text-primary" /> Branch Scope
          </span>
          <span className="font-semibold text-foreground">{branchName}</span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" /> Account Tier
          </span>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Verified Customer
          </Badge>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <History size={13} className="text-indigo-500" /> Total Support History
          </span>
          <span className="font-semibold text-foreground">
            {totalConversations} Chats · {totalTickets} Tickets
          </span>
        </div>
      </div>
    </div>
  );
};
