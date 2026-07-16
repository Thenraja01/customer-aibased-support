import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users } from "lucide-react";
import type { IOrganization } from "@/types";

interface Props {
  organizations: IOrganization[];
  onEdit: (org: IOrganization) => void;
  onDelete: (org: IOrganization) => void;
  onViewUsers: (org: IOrganization) => void;
}

export default function OrganizationTable({
  organizations,
  onEdit,
  onDelete,
  onViewUsers,
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
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Org ID
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Name
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Email
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
              Phone
            </th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr
              key={org._id}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4">
                <Badge variant="outline">{org.organization_id}</Badge>
              </td>
              <td className="py-3 px-4 font-medium">{org.name || "-"}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {org.email || "-"}
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {org.phone || "-"}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onViewUsers(org)}
                    title="View Users"
                  >
                    <Users size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(org)}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => onDelete(org)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
