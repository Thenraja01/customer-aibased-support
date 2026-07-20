import { Input } from '@/components/common/Forms/Input';
import { Select } from '@/components/common/Forms/Select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface UserFiltersProps {
  filters: { search: string; role: string; status: string };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function UserFilters({ filters, onFilterChange, onClear }: UserFiltersProps) {
  const hasFilters = filters.search || filters.role || filters.status;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select
        options={[
          { label: 'All Roles', value: '' },
          { label: 'Admin', value: 'admin' },
          { label: 'Agent', value: 'agent' },
          { label: 'Customer', value: 'customer' },
        ]}
        value={filters.role}
        onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
      />
      <Select
        options={[
          { label: 'All Status', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Blocked', value: 'blocked' },
        ]}
        value={filters.status}
        onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
      />
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
