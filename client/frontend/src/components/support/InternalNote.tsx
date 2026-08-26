import React from "react";
import { Lock, ShieldAlert, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InternalNoteProps {
  authorName: string;
  authorRole?: string;
  content: string;
  createdAt?: string;
}

export const InternalNote: React.FC<InternalNoteProps> = ({
  authorName,
  authorRole = "Staff",
  content,
  createdAt,
}) => {
  return (
    <div className="my-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-100 max-w-xl mx-auto w-full shadow-sm space-y-1.5">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
          <Lock size={13} className="text-amber-500" />
          <span>Internal Note</span>
          <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 uppercase px-1.5">
            Staff Only
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{authorName} ({authorRole})</span>
          {createdAt && <span>· {new Date(createdAt).toLocaleTimeString()}</span>}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-foreground font-medium italic">
        "{content}"
      </p>
    </div>
  );
};
