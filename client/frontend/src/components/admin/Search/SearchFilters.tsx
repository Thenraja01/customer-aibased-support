import { Select } from '@/components/common/Forms/Select';

interface SearchFiltersProps {
  type: string;
  onTypeChange: (type: string) => void;
}

export function SearchFilters({ type, onTypeChange }: SearchFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        options={[
          { label: 'All', value: 'all' },
          { label: 'Users', value: 'users' },
          { label: 'Documents', value: 'documents' },
          { label: 'Tickets', value: 'tickets' },
          { label: 'Chats', value: 'chats' },
        ]}
        value={type}
        onChange={(e: any) => onTypeChange(e.target.value)}
      />
    </div>
  );
}
