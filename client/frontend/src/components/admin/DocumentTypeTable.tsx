import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export default function DocumentTypeTable({
  documentTypes,
  onEdit,
  onDelete,
}: {
  documentTypes: any[];
  onEdit: (dt: any) => void;
  onDelete: (dt: any) => void;
}) {
  if (documentTypes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No document types found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-white/[0.06]">
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Name
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Description
            </th>
            <th className="text-right font-medium text-muted-foreground px-4 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {documentTypes.map((dt) => (
            <tr
              key={dt._id}
              className="border-b dark:border-white/[0.06] hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{dt.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {dt.description || "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(dt)}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(dt)}
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
