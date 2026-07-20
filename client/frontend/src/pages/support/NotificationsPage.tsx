import { NotificationList } from '@/components/customer/Notifications/NotificationList';
import { NotificationPreferences } from '@/components/customer/Notifications/NotificationPreferences';

export default function SupportNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage your notification settings</p>
      </div>
      <NotificationList />
      <NotificationPreferences />
    </div>
  );
}
