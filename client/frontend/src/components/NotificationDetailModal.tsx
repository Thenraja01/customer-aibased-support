import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, CheckCheck, Trash2, ExternalLink, Calendar, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  _id: string;
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  is_read?: boolean;
  read?: boolean;
  link?: string;
  created_at: string;
}

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  onMarkRead,
  onDelete,
}) => {
  const navigate = useNavigate();
  const markedIdsRef = useRef<Set<string>>(new Set());

  const notifId = notification?._id;
  const initialIsRead = Boolean(notification?.is_read ?? notification?.read);
  const isRead = initialIsRead || (notifId ? markedIdsRef.current.has(notifId) : false);

  useEffect(() => {
    if (notifId && !initialIsRead && onMarkRead && !markedIdsRef.current.has(notifId)) {
      markedIdsRef.current.add(notifId);
      onMarkRead(notifId);
    }
  }, [notifId, initialIsRead, onMarkRead]);

  if (!notification) return null;

  const handleNavigate = () => {
    if (notification.link) {
      onClose();
      navigate(notification.link);
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkRead && notifId && !isRead) {
      markedIdsRef.current.add(notifId);
      onMarkRead(notifId);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
              !isRead
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-slate-800/60 border-slate-700/50 text-slate-400"
            )}>
              <Bell size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-100 truncate">
                {notification.title || "Notification Details"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  notification.type === "alert" || notification.type === "urgent"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : notification.type === "message"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                )}>
                  {notification.type || notification.category || "General"}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Content Body */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 leading-relaxed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} className="text-indigo-400" /> Full Message Details
            </span>
            <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {notification.message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status</span>
              <span className={cn("font-semibold text-xs mt-0.5 inline-flex items-center gap-1", isRead ? "text-slate-400" : "text-emerald-400")}>
                <ShieldCheck size={13} /> {isRead ? "Read" : "Unread"}
              </span>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Action</span>
              <span className="font-semibold text-xs text-indigo-300 mt-0.5 truncate block">
                {notification.link ? "Direct Link Attached" : "System Alert"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {!isRead && onMarkRead && (
              <button
                onClick={handleMarkAsRead}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
              >
                <CheckCheck size={14} /> Mark as Read
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {notification.link && (
              <button
                onClick={handleNavigate}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
              >
                Open Link <ExternalLink size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
