import { Input } from '@/components/common/Forms/Input';
import { Select } from '@/components/common/Forms/Select';
import { DatePicker } from '@/components/common/Forms/DatePicker';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AuditFiltersProps {
  filters: { search: string; action: string; startDate: string; endDate: string };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function AuditFilters({ filters, onFilterChange, onClear }: AuditFiltersProps) {
  const hasFilters = filters.search || filters.action || filters.startDate || filters.endDate;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        placeholder="Search logs..."
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
      />
      <Select
        options={[
          { label: 'All Actions', value: '' },
          { label: 'Login', value: 'login' },
          { label: 'Logout', value: 'logout' },
          { label: 'Create', value: 'create' },
          { label: 'Update', value: 'update' },
          { label: 'Delete', value: 'delete' },
        ]}
        value={filters.action}
        onChange={(e: any) => onFilterChange({ ...filters, action: e.target.value })}
      />
      <DatePicker label="From" value={filters.startDate} onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })} />
      <DatePicker label="To" value={filters.endDate} onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })} />
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
