import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DocumentTable({
  documents,
  onView,
  onDelete,
}: {
  documents: any[];
  onView: (doc: any) => void;
  onDelete: (doc: any) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No documents found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-white/[0.06]">
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Title
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Type
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Uploaded By
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Status
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Date
            </th>
            <th className="text-right font-medium text-muted-foreground px-4 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc._id}
              className="border-b dark:border-white/[0.06] hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{doc.title}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {doc.document_type_id?.name || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {doc.user_id?.name || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={statusVariant[doc.status] || ""}
                  variant="outline"
                >
                  {doc.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {doc.created_at
                  ? new Date(doc.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(doc)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(doc)}
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
