import { VerificationQueue } from './VerificationQueue';

export function DocumentApproval() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Document Approval</h2>
      <VerificationQueue />
    </div>
  );
}
