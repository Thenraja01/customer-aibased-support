import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import type { IOrganization } from "@/types";

interface Props {
  organizations: IOrganization[];
  onEdit: (org: IOrganization) => void;
  onDelete: (org: IOrganization) => void;
  onViewUsers: (org: IOrganization) => void;
  onViewDetails?: (org: IOrganization) => void;
  onToggleStatus?: (org: IOrganization) => void;
}

export default function OrganizationTable({
  organizations,
  onEdit,
  onDelete,
  onViewUsers,
  onViewDetails,
  onToggleStatus,
}: Props) {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No organizations found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-white/[0.06]">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Org ID</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Custom Prompt</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => {
            const isActive = org.status !== "inactive";
            return (
              <tr key={org._id} className={`border-b dark:border-white/[0.06] hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors ${!isActive ? "opacity-60" : ""}`}>
                <td className="py-3 px-4">
                  <Badge variant="outline">{org.organization_id}</Badge>
                </td>
                <td className="py-3 px-4 font-medium">
                  {onViewDetails ? (
                    <button
                      onClick={() => onViewDetails(org)}
                      className="text-primary font-semibold hover:underline text-left flex items-center gap-1.5"
                    >
                      <span>{org.name || "-"}</span>
                      <ExternalLink size={12} className="opacity-70" />
                    </button>
                  ) : (
                    org.name || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{org.email || "-"}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`} role="status" aria-label={isActive ? "Active" : "Suspended"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-primary" : "bg-destructive"}`} />
                    {isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  {org.customPrompt ? (
                    <Badge variant="secondary" className="text-xs">Configured</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Default</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    {onViewDetails && (
                      <Button variant="ghost" size="icon-sm" onClick={() => onViewDetails(org)} title="Organization Details & Analytics">
                        <ExternalLink size={14} className="text-primary" />
                      </Button>
                    )}
                    {onToggleStatus && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleStatus(org)}
                        title={isActive ? "Suspend Organization" : "Activate Organization"}
                        className={!isActive ? "text-primary" : "text-muted-foreground"}
                      >
                        {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => onViewUsers(org)} title="View Users">
                      <Users size={14} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(org)} title="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button variant="destructive" size="icon-sm" onClick={() => onDelete(org)} title="Delete">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
