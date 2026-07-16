import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DocumentVerificationTable({
  verifications,
  onApprove,
  onReject,
  onDelete,
}: {
  verifications: any[];
  onApprove: (v: any) => void;
  onReject: (v: any) => void;
  onDelete: (v: any) => void;
}) {
  if (verifications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No verifications found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-white/[0.06]">
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Document
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Verified By
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Status
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Remarks
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
          {verifications.map((v) => (
            <tr
              key={v._id}
              className="border-b dark:border-white/[0.06] hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium">
                {v.document_id?.title || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {v.verified_by?.name || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={statusVariant[v.status] || ""}
                  variant="outline"
                >
                  {v.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                {v.remarks || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {v.created_at
                  ? new Date(v.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {v.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-600"
                        onClick={() => onApprove(v)}
                      >
                        <CheckCircle size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onReject(v)}
                      >
                        <XCircle size={14} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(v)}
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
