import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

interface ChatbotProps {
  chatId?: string | null;
}

export function Chatbot({ chatId }: ChatbotProps) {
  const { user } = useAuth();
  const {
    chats,
    activeChat,
    messages,
    messagesLoading,
    aiThinking,
    loadMessages,
    selectChat,
    startNewChat,
    sendWithAI,
    resetMessages,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      const chat = chats.find((c) => c._id === chatId);
      if (chat) {
        selectChat(chat);
        loadMessages(chatId);
      }
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  const handleSend = (content: string) => {
    if (!user?._id || !activeChat?._id) return;
    sendWithAI(activeChat._id, user._id, content);
  };

  const handleNewChat = () => {
    if (!user?._id) return;
    startNewChat({
      user_id: user._id,
      organization_id: user.organization_id?._id || '',
      topic: 'New Chat',
    });
    resetMessages();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {activeChat?.topic || 'AI Assistant'}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNewChat}>
          <Plus size={16} className="mr-1" /> New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-sm max-w-md">
              Ask me anything about your documents, tickets, or general support questions.
            </p>
            <Button className="mt-4" onClick={handleNewChat}>
              Start New Chat
            </Button>
          </div>
        ) : messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-16 bg-muted animate-pulse rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg._id} message={msg} />
            ))}
            {aiThinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <ChatInput onSend={handleSend} disabled={!activeChat || aiThinking} />
      </div>
    </div>
  );
}
