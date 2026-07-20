import { useState } from 'react';
import { Toggle } from '@/components/common/Forms/Toggle';

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    ticket_updates: true,
    document_updates: true,
    chat_messages: true,
    system_alerts: false,
  });

  const handleToggle = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      const { NotificationAPI } = await import('@/api/notification.api');
      await NotificationAPI.create({ type: 'preferences', data: newPrefs });
    } catch {
      setPrefs(prefs);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Channels</p>
          <Toggle
            label="Email notifications"
            checked={prefs.email_notifications}
            onChange={() => handleToggle('email_notifications')}
          />
          <Toggle
            label="Push notifications"
            checked={prefs.push_notifications}
            onChange={() => handleToggle('push_notifications')}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Types</p>
          <Toggle
            label="Ticket updates"
            checked={prefs.ticket_updates}
            onChange={() => handleToggle('ticket_updates')}
          />
          <Toggle
            label="Document updates"
            checked={prefs.document_updates}
            onChange={() => handleToggle('document_updates')}
          />
          <Toggle
            label="Chat messages"
            checked={prefs.chat_messages}
            onChange={() => handleToggle('chat_messages')}
          />
          <Toggle
            label="System alerts"
            checked={prefs.system_alerts}
            onChange={() => handleToggle('system_alerts')}
          />
        </div>
      </div>
    </div>
  );
}
