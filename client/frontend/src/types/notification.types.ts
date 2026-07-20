export interface Notification {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  status: 'unread' | 'read';
  created_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  types: {
    ticket_updates: boolean;
    document_updates: boolean;
    chat_messages: boolean;
    system_alerts: boolean;
  };
}

export interface BroadcastRequest {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_roles?: string[];
  target_organizations?: string[];
}
