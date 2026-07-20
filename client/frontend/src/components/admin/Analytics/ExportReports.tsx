import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/common/Forms/Select';
import { DatePicker } from '@/components/common/Forms/DatePicker';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function ExportReports() {
  const [reportType, setReportType] = useState('usage');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { AnalyticsAPI } = await import('@/api/analytics.api');
      const res = await AnalyticsAPI.exportReport({ type: reportType, format, start: startDate, end: endDate });
      const blob = new Blob([res.data as BlobPart], { type: String((res.headers as Record<string, any>)['content-type'] ?? 'application/octet-stream') });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-xl bg-card">
      <h3 className="text-lg font-semibold">Export Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Report Type"
          options={[
            { label: 'Usage', value: 'usage' },
            { label: 'Response Times', value: 'response_times' },
            { label: 'Token Usage', value: 'token_usage' },
            { label: 'Sessions', value: 'sessions' },
            { label: 'AI Analytics', value: 'ai' },
          ]}
          value={reportType}
          onChange={(e: any) => setReportType(e.target.value)}
        />
        <Select
          label="Format"
          options={[
            { label: 'CSV', value: 'csv' },
            { label: 'PDF', value: 'pdf' },
            { label: 'Excel', value: 'xlsx' },
          ]}
          value={format}
          onChange={(e: any) => setFormat(e.target.value)}
        />
        <DatePicker label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <DatePicker label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <Button onClick={handleExport} disabled={exporting}>
        <Download size={16} className="mr-2" />
        {exporting ? 'Exporting...' : 'Export'}
      </Button>
    </div>
  );
}
