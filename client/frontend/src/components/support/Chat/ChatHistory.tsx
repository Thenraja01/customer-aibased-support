import { ChatSessionList } from '@/components/customer/Chat/ChatSessionList';

export function SupportChatHistory() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Chat History</h2>
      <div className="border rounded-xl bg-card p-4">
        <ChatSessionList />
      </div>
    </div>
  );
}
