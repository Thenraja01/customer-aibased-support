import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Ticket, FileText, HelpCircle } from 'lucide-react';

const actions = [
  { name: 'Start Chat', path: '/chat', icon: MessageCircle, color: 'text-blue-500' },
  { name: 'New Ticket', path: '/tickets', icon: Ticket, color: 'text-orange-500' },
  { name: 'Upload Document', path: '/documents', icon: FileText, color: 'text-purple-500' },
  { name: 'View FAQ', path: '/faq', icon: HelpCircle, color: 'text-green-500' },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.name} to={action.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Icon size={24} className={`mx-auto mb-2 ${action.color}`} />
                  <p className="text-sm font-medium">{action.name}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
