import { StatusBadge } from '@/components/common/UI/StatusBadge';

interface DocumentStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
}

export function DocumentStatus({ status, remarks }: DocumentStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <StatusBadge status={status} />
      </div>
      {remarks && (
        <div className="p-3 rounded-lg bg-muted text-sm">
          <p className="font-medium text-xs text-muted-foreground mb-1">Remarks:</p>
          <p>{remarks}</p>
        </div>
      )}
    </div>
  );
}
