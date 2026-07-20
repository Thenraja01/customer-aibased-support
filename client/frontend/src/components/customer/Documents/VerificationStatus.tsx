import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatDate } from '@/utils/formatters';
import { Shield } from 'lucide-react';

interface VerificationStatusProps {
  documentId: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export function VerificationStatus({
  status,
  verifiedBy,
  verifiedAt,
  remarks,
}: VerificationStatusProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">Verification</span>
        <StatusBadge status={status} />
      </div>
      {verifiedBy && (
        <p className="text-xs text-muted-foreground">
          Verified by {verifiedBy}
          {verifiedAt && ` on ${formatDate(verifiedAt)}`}
        </p>
      )}
      {remarks && (
        <div className="p-3 rounded-lg bg-muted text-sm">
          <p className="font-medium text-xs text-muted-foreground mb-1">Remarks:</p>
          <p>{remarks}</p>
        </div>
      )}
    </div>
  );
}
