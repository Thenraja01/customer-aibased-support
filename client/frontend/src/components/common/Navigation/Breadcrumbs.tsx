import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat',
  tickets: 'Tickets',
  documents: 'Documents',
  profile: 'Profile',
  notifications: 'Notifications',
  faq: 'FAQ',
  admin: 'Admin',
  users: 'Users',
  'document-types': 'Document Types',
  verifications: 'Verifications',
  analytics: 'Analytics',
  'audit-logs': 'Audit Logs',
  agent: 'Agent',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>
      {pathnames.map((segment, index) => {
        const href = '/' + pathnames.slice(0, index + 1).join('/');
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === pathnames.length - 1;

        return (
          <span key={segment} className="flex items-center gap-1">
            <ChevronRight size={12} />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
