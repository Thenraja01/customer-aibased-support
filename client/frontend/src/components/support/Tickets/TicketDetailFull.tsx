import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TicketAPI } from '@/api/ticket.api';
import { ChatAPI } from '@/api/chat.api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { toast } from 'sonner';
import {
  ChevronLeft, Clock, User, Tag, MessageSquare, CheckCircle2,
  AlertTriangle, Send, Lock, Globe, Loader2, RefreshCw,
  ArrowRight, MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatRelativeTime } from '@/utils/formatters';

// ─── Status workflow ──────────────────────────────────────────────────────────
const STATUS_FLOW: Record<string, { next: string; label: string; icon: React.ReactNode; color: string }> = {
  open:        { next: 'in_progress', label: 'Start Working', icon: <ArrowRight size={14} />, color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  in_progress: { next: 'resolved',    label: 'Mark Resolved', icon: <CheckCircle2 size={14} />, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  resolved:    { next: 'closed',      label: 'Close Ticket',  icon: <CheckCircle2 size={14} />, color: 'bg-gray-500 hover:bg-gray-600 text-white' },
};

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  low:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800',
};

// ─── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: any }) {
  return (
    <div className={`flex gap-3 ${comment.is_internal ? 'opacity-80' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
        {comment.author_id?.name?.[0]?.toUpperCase() ?? 'A'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author_id?.name ?? 'Agent'}</span>
          {comment.is_internal && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
              <Lock size={9} /> Internal
            </span>
          )}
          {!comment.is_internal && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full">
              <Globe size={9} /> Customer visible
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(comment.created_at)}</span>
        </div>
        <div className="text-sm bg-muted/40 dark:bg-white/[0.03] rounded-lg px-3 py-2 border dark:border-white/[0.05]">
          {comment.content}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TicketDetailFull() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.user as any);

  const [ticket,       setTicket]       = useState<any>(null);
  const [comments,     setComments]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [commenting,   setCommenting]   = useState(false);
  const [updating,     setUpdating]     = useState(false);
  const [newComment,   setNewComment]   = useState('');
  const [isInternal,   setIsInternal]   = useState(false);
  const [showActions,  setShowActions]  = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        TicketAPI.getById(id),
        TicketAPI.getComments(id),
      ]);
      setTicket(ticketRes.data.data ?? ticketRes.data);
      const raw = commentsRes.data.data ?? commentsRes.data;
      setComments(Array.isArray(raw) ? raw : []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // ── Status transition ─────────────────────────────────────────────────────
  const handleStatusChange = async () => {
    if (!ticket) return;
    const next = STATUS_FLOW[ticket.status];
    if (!next) return;
    setUpdating(true);
    try {
      await TicketAPI.updateStatus(id!, next.next);
      setTicket((prev: any) => ({ ...prev, status: next.next }));
      toast.success(`Ticket status updated to ${next.next.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // ── Escalation ────────────────────────────────────────────────────────────
  const handleEscalate = async () => {
    try {
      await TicketAPI.escalate(id!, 'Escalated by support agent for urgent review');
      toast.success('Ticket escalated');
      setTicket((prev: any) => ({ ...prev, priority: 'urgent' }));
    } catch {
      toast.error('Escalation failed');
    }
  };

  // ── Add comment ───────────────────────────────────────────────────────────
  const handleComment = async () => {
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await TicketAPI.addComment(id!, {
        content: newComment.trim(),
        is_internal: isInternal,
        author_id: user?._id,
      });
      const created = res.data.data ?? res.data;
      setComments(prev => [...prev, { ...created, author_id: { name: user?.name } }]);
      setNewComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="h-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <AlertTriangle size={36} className="mx-auto mb-3 opacity-40" />
        <p>Ticket not found</p>
        <Button variant="ghost" onClick={() => navigate('/support/tickets')} className="mt-3">
          Back to Tickets
        </Button>
      </div>
    );
  }

  const nextAction = STATUS_FLOW[ticket.status];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/support/tickets')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} /> Back to Tickets
      </button>

      {/* Header card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge status={ticket.status} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[ticket.priority] ?? ''}`}>
                  {ticket.priority}
                </span>
              </div>
              <h1 className="text-xl font-bold">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {nextAction && (
                <button
                  onClick={handleStatusChange}
                  disabled={updating}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${nextAction.color} disabled:opacity-60`}
                >
                  {updating ? <Loader2 size={14} className="animate-spin" /> : nextAction.icon}
                  {nextAction.label}
                </button>
              )}
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-card border dark:border-white/[0.08] rounded-xl shadow-xl z-10">
                  <button
                    onClick={() => { handleEscalate(); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-t-xl transition-colors"
                  >
                    <AlertTriangle size={14} /> Escalate to Urgent
                  </button>
                  <button
                    onClick={() => { loadAll(); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted rounded-b-xl transition-colors"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t dark:border-white/[0.06] text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User size={13} />
              {ticket.user_id?.name ?? 'Unknown Customer'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              Created {formatRelativeTime(ticket.created_at)}
            </span>
            {ticket.assigned_to && (
              <span className="flex items-center gap-1.5">
                <Tag size={13} />
                Assigned to {ticket.assigned_to?.name ?? ticket.assigned_to}
              </span>
            )}
            {ticket.due_date && (
              <span className={`flex items-center gap-1.5 ${new Date(ticket.due_date) < new Date() ? 'text-red-500' : ''}`}>
                <AlertTriangle size={13} />
                Due {formatRelativeTime(ticket.due_date)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            Conversation ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No comments yet — be the first to respond</p>
            </div>
          ) : (
            comments.map((c, i) => <CommentItem key={c._id ?? i} comment={c} />)
          )}
          <div ref={commentsEndRef} />
        </CardContent>

        {/* Reply box */}
        <div className="border-t dark:border-white/[0.06] p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setIsInternal(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!isInternal ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Globe size={12} /> Customer Reply
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isInternal ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Lock size={12} /> Internal Note
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isInternal ? 'Add an internal note (not visible to customer)…' : 'Type your reply to the customer…'}
              rows={3}
              className="flex-1 resize-none text-sm rounded-lg border dark:border-white/[0.08] bg-muted/30 dark:bg-white/[0.03] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleComment(); }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Ctrl+Enter to send</span>
            <Button size="sm" onClick={handleComment} disabled={commenting || !newComment.trim()}>
              {commenting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
              {isInternal ? 'Add Note' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
