import { useState } from 'react';
import { NotificationList } from '@/components/customer/Notifications/NotificationList';
import { Select } from '@/components/common/Forms/Select';

export function NotificationHistory() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notification History</h3>
        <Select
          options={[
            { label: 'All', value: 'all' },
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Success', value: 'success' },
            { label: 'Error', value: 'error' },
          ]}
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)}
        />
      </div>
      <NotificationList />
    </div>
  );
}
