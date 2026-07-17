"use client";

import { memo, useState, useCallback } from "react";
import { Headphones, MessageCircle, Plus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TicketAPI } from "@/api";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  activeChat: Chat | null;
  onOpenTicket: () => void;
}

const ChatHeader = memo(function ChatHeader({ activeChat, onOpenTicket }: ChatHeaderProps) {
  const isNew = !activeChat;
  const isClosed = activeChat?.status === "closed";
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const handleEscalate = useCallback(async () => {
    if (!activeChat?._id) return;
    setEscalating(true);
    try {
      await TicketAPI.create({
        chat_id: activeChat._id,
        subject: activeChat.topic || "Chat Escalation",
        description: "Customer requested to speak with a human agent.",
        priority: "medium",
        status: "open",
      });
      setEscalated(true);
      setTimeout(() => {
        setEscalateOpen(false);
        setEscalated(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setEscalating(false);
    }
  }, [activeChat]);

  return (
    <>
      <div className="flex items-center justify-between border-b dark:border-white/[0.06] pl-14 md:pl-6 pr-6 py-4 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm shadow-primary/20">
            {isNew ? (
              <MessageCircle size={15} className="text-primary-foreground" />
            ) : (
              <Headphones size={15} className="text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {isNew ? "New Chat" : "Support Chat"}
            </h2>
            {!isNew && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isClosed ? "bg-muted" : "bg-green-500 animate-pulse"
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  {isClosed ? "Closed" : "Online"}
                </p>
              </div>
            )}
            {isNew && (
              <p className="text-xs text-muted-foreground">Start a conversation</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && !isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEscalateOpen(true)}
              className="dark:hover:bg-primary/10 gap-2"
            >
              <UserCheck size={16} />
              <span className="hidden sm:inline">Talk to Human</span>
            </Button>
          )}
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenTicket}
              className="dark:hover:bg-primary/10 gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Ticket</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Talk to a Human Agent</DialogTitle>
            <DialogDescription>
              This will create a support ticket and flag your chat for human review. A
              team member will follow up as soon as possible.
            </DialogDescription>
          </DialogHeader>
          {escalated ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserCheck size={20} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Escalation submitted successfully!
              </p>
            </div>
          ) : (
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setEscalateOpen(false)}
                disabled={escalating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEscalate}
                disabled={escalating}
                className="bg-gradient-to-br from-primary to-secondary text-primary-foreground"
              >
                {escalating ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <UserCheck size={16} className="mr-2" />
                )}
                Confirm Escalation
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

export default ChatHeader;
