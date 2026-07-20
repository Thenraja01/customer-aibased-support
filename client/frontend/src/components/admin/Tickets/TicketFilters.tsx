import { Input } from '@/components/common/Forms/Input';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TicketFiltersProps {
  filters: { search: string; status: string; priority: string };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function TicketFilters({ filters, onFilterChange, onClear }: TicketFiltersProps) {
  const hasFilters = filters.search || filters.status || filters.priority;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select
        options={[
          { label: 'All Status', value: '' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
        ]}
        value={filters.status}
        onChange={(e: any) => onFilterChange({ ...filters, status: e.target.value })}
      />
      <Select
        options={[
          { label: 'All Priority', value: '' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ]}
        value={filters.priority}
        onChange={(e: any) => onFilterChange({ ...filters, priority: e.target.value })}
      />
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
