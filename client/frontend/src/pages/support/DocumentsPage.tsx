import { VerificationQueue } from '@/components/support/Documents/VerificationQueue';

export default function SupportDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Verification</h1>
        <p className="text-muted-foreground">Verify and approve customer documents</p>
      </div>
      <VerificationQueue />
    </div>
  );
}
