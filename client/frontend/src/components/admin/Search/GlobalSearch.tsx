import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function GlobalSearch({ onSearch, loading }: GlobalSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={handleChange}
        placeholder="Search users, documents, tickets, chats..."
        className="w-full h-12 pl-10 pr-12 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {loading && (
        <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </form>
  );
}
