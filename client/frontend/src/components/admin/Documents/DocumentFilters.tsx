import { Input } from '@/components/common/Forms/Input';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DocumentFiltersProps {
  filters: { search: string; status: string; type: string };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
  documentTypes?: { _id: string; name: string }[];
}

export function DocumentFilters({ filters, onFilterChange, onClear, documentTypes = [] }: DocumentFiltersProps) {
  const hasFilters = filters.search || filters.status || filters.type;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search documents..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select
        options={[
          { label: 'All Status', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ]}
        value={filters.status}
        onChange={(e: any) => onFilterChange({ ...filters, status: e.target.value })}
      />
      <Select
        options={[
          { label: 'All Types', value: '' },
          ...documentTypes.map((dt) => ({ label: dt.name, value: dt._id })),
        ]}
        value={filters.type}
        onChange={(e: any) => onFilterChange({ ...filters, type: e.target.value })}
      />
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
