import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatAPI } from '@/api/chat.api';
import { TicketAPI } from '@/api/ticket.api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { toast } from 'sonner';
import {
  MessageSquare, Send, Loader2, ExternalLink, Ticket as TicketIcon,
  User, Clock, Search, RefreshCw, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/UI/StatusBadge';

/**
 * LiveChat — Support agent live chat monitoring panel.
 *
 * Features:
 *  - Browse all active org chat sessions (sidebar)
 *  - Read full message transcript
 *  - Send direct messages into the chat as agent (within org context)
 *  - One-click escalation: create a ticket from a chat
 *  - Real-time polling every 15s for new messages
 */

interface Message {
  _id: string;
  content: string;
  is_ai: boolean;
  sender_id: string;
  created_at: string;
}

interface ChatSession {
  _id: string;
  topic: string;
  status: string;
  user_id: { _id: string; name: string; email: string };
  created_at: string;
  messages_count?: number;
}

function SessionItem({
  session, active, onClick,
}: { session: ChatSession; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
          {session.user_id?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session.user_id?.name ?? 'Customer'}</p>
          <p className="text-xs text-muted-foreground truncate">{session.topic}</p>
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 ${session.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
      </div>
    </button>
  );
}

function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: string }) {
  const isOwn = !msg.is_ai && msg.sender_id === currentUserId;
  const isAI  = msg.is_ai;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
        isOwn
          ? 'bg-primary text-primary-foreground rounded-br-sm'
          : isAI
          ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-foreground rounded-bl-sm'
          : 'bg-muted dark:bg-white/[0.06] text-foreground rounded-bl-sm'
      }`}>
        {isAI && <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">AI Assistant</span>}
        {isOwn && <span className="text-[10px] font-semibold opacity-70 block mb-0.5">You (Agent)</span>}
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <span className={`text-[10px] mt-1 block ${isOwn ? 'opacity-70 text-right' : 'text-muted-foreground'}`}>
          {formatRelativeTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

export function LiveChat() {
  const { user } = useSelector((state: RootState) => state.user as any);

  const [sessions,        setSessions]       = useState<ChatSession[]>([]);
  const [activeSession,   setActiveSession]  = useState<ChatSession | null>(null);
  const [messages,        setMessages]       = useState<Message[]>([]);
  const [newMsg,          setNewMsg]         = useState('');
  const [sessionsLoading, setSessionsLoading]= useState(true);
  const [msgsLoading,     setMsgsLoading]    = useState(false);
  const [sending,         setSending]        = useState(false);
  const [escalating,      setEscalating]     = useState(false);
  const [search,          setSearch]         = useState('');
  const [showSidebar,     setShowSidebar]    = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(async (quiet = false) => {
    if (!quiet) setSessionsLoading(true);
    try {
      const res = await ChatAPI.getAll({ limit: '50', sort: 'created_at:desc' });
      const raw = res.data.data ?? res.data;
      setSessions(Array.isArray(raw) ? raw : []);
    } catch {
      // silent
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // ── Load messages for a session ────────────────────────────────────────────
  const loadMessages = useCallback(async (chatId: string, quiet = false) => {
    if (!quiet) setMsgsLoading(true);
    try {
      const { MessageAPI } = await import('@/api/message.api');
      const res = await (MessageAPI as any).getByChatId(chatId);
      const raw = res.data.data ?? res.data;
      setMessages(Array.isArray(raw) ? raw : []);
    } catch {
      // silent
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Poll for new messages every 15s when a session is active
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeSession?._id) {
      pollRef.current = setInterval(() => {
        loadMessages(activeSession._id, true);
      }, 15_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeSession?._id, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSession(session);
    setMessages([]);
    await loadMessages(session._id);
  };

  // ── Send direct message as agent ───────────────────────────────────────────
  const handleSend = async () => {
    if (!newMsg.trim() || !activeSession || !user) return;
    setSending(true);
    try {
      const { MessageAPI } = await import('@/api/message.api');
      const res = await (MessageAPI as any).send({
        chat_id:      activeSession._id,
        sender_id:    user._id,
        content:      newMsg.trim(),
        message_type: 'text',
        is_ai:        false,
      });
      const created = res.data.data ?? res.data;
      setMessages(prev => [...prev, created]);
      setNewMsg('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Escalate chat to ticket ────────────────────────────────────────────────
  const handleEscalate = async () => {
    if (!activeSession) return;
    setEscalating(true);
    try {
      await ChatAPI.escalate(activeSession._id, {
        title:       `Chat escalation: ${activeSession.topic}`,
        description: `Escalated from live chat session by support agent`,
        priority:    'high',
      });
      toast.success('Chat escalated to ticket successfully');
    } catch {
      toast.error('Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    !search || s.topic?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_id?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-0 h-[calc(100vh-9rem)] rounded-xl border dark:border-white/[0.06] overflow-hidden shadow-sm">
      {/* ─── Sessions sidebar ─────────────────────────────────────────────── */}
      {showSidebar && (
        <div className="w-72 shrink-0 border-r dark:border-white/[0.06] bg-card flex flex-col">
          <div className="p-3 border-b dark:border-white/[0.06]">
            <h3 className="text-sm font-semibold mb-2">Active Sessions</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border dark:border-white/[0.08] bg-muted/50 dark:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {sessionsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
              ))
            ) : filteredSessions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                No chat sessions
              </div>
            ) : (
              filteredSessions.map(s => (
                <SessionItem
                  key={s._id}
                  session={s}
                  active={activeSession?._id === s._id}
                  onClick={() => handleSelectSession(s)}
                />
              ))
            )}
          </div>
          <div className="p-2 border-t dark:border-white/[0.06]">
            <button
              onClick={() => loadSessions(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw size={12} /> Refresh sessions
            </button>
          </div>
        </div>
      )}

      {/* ─── Chat area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background">
        {activeSession ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.06] bg-card">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                >
                  <ChevronRight size={16} className={`transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-muted-foreground" />
                    <span className="text-sm font-semibold">{activeSession.user_id?.name ?? 'Customer'}</span>
                    <StatusBadge status={activeSession.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{activeSession.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} /> {formatRelativeTime(activeSession.created_at)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={escalating}
                  onClick={handleEscalate}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  {escalating
                    ? <Loader2 size={13} className="animate-spin mr-1" />
                    : <TicketIcon size={13} className="mr-1" />}
                  Escalate to Ticket
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {msgsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages in this session yet
                </div>
              ) : (
                <>
                  {messages.map(m => (
                    <MessageBubble key={m._id} msg={m} currentUserId={user?._id ?? ''} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t dark:border-white/[0.06] bg-card p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Send a message directly to this chat as support agent…"
                  rows={2}
                  className="flex-1 resize-none text-sm rounded-xl border dark:border-white/[0.08] bg-muted/30 dark:bg-white/[0.03] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button onClick={handleSend} disabled={sending || !newMsg.trim()} size="sm" className="h-[56px] px-4">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Sending as support agent · Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="absolute top-4 left-4 p-1.5 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} className={showSidebar ? 'rotate-180' : ''} />
            </button>
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a chat session</p>
            <p className="text-sm mt-1">Choose a customer conversation from the sidebar to monitor and respond</p>
          </div>
        )}
      </div>
    </div>
  );
}
