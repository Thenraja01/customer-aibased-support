import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { SearchIcon, FileText, MessageCircle, Ticket, Users } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  results: {
    users?: any[];
    documents?: any[];
    tickets?: any[];
    chats?: any[];
  };
  loading: boolean;
}

export function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const allResults = [
    ...(results.users || []).map((r) => ({ ...r, _type: 'user' as const })),
    ...(results.documents || []).map((r) => ({ ...r, _type: 'document' as const })),
    ...(results.tickets || []).map((r) => ({ ...r, _type: 'ticket' as const })),
    ...(results.chats || []).map((r) => ({ ...r, _type: 'chat' as const })),
  ];

  if (allResults.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground mt-6">
        <SearchIcon size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No results found</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return Users;
      case 'document': return FileText;
      case 'ticket': return Ticket;
      case 'chat': return MessageCircle;
      default: return FileText;
    }
  };

  const getLink = (item: any) => {
    switch (item._type) {
      case 'user': return `/admin/users/${item._id}`;
      case 'document': return '/admin/documents';
      case 'ticket': return `/admin/tickets/${item._id}`;
      case 'chat': return '/admin/conversations';
      default: return '#';
    }
  };

  const getTitle = (item: any) => {
    switch (item._type) {
      case 'user': return item.name || item.email;
      case 'document': return item.title || item.file_name;
      case 'ticket': return item.title;
      case 'chat': return item.topic;
      default: return '';
    }
  };

  return (
    <div className="space-y-2 mt-6">
      <p className="text-sm text-muted-foreground">
        Found {allResults.length} result{allResults.length !== 1 ? 's' : ''}
      </p>
      {allResults.map((item, index) => {
        const Icon = getIcon(item._type);
        return (
          <Link key={`${item._type}-${item._id}-${index}`} to={getLink(item)}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  item._type === 'user' && 'bg-blue-500/10',
                  item._type === 'document' && 'bg-purple-500/10',
                  item._type === 'ticket' && 'bg-orange-500/10',
                  item._type === 'chat' && 'bg-green-500/10'
                )}>
                  <Icon size={18} className={
                    item._type === 'user' ? 'text-blue-500' :
                    item._type === 'document' ? 'text-purple-500' :
                    item._type === 'ticket' ? 'text-orange-500' : 'text-green-500'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getTitle(item)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item._type}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(item.created_at || item.updated_at)}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
