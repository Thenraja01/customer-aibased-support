
import { formatDateTime } from '@/utils/formatters';
import { Shield, User, Globe, Clock } from 'lucide-react';

interface AuditDetailsProps {
  log: any;
  onClose: () => void;
}

export function AuditDetails({ log, onClose }: AuditDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-lg w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Audit Log Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Action:</span>
              <span className="font-medium capitalize">{log.action}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium">{log.user_name || log.user_id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">IP:</span>
              <span className="font-medium">{log.ip_address || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{formatDateTime(log.created_at)}</span>
            </div>
          </div>
          {log.details && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Details:</p>
              <pre className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
