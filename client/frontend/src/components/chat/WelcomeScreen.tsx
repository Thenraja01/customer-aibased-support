"use client";

import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Plus,
  MessageSquare,
  Shield,
  CreditCard,
  HelpCircle,
  Zap,
  Sparkles,
  FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/animations";
import ChatInput from "@/components/chat/ChatInput";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
  onStartWithDocument?: (message: string) => void;
  onOpenTicket: () => void;
  documents?: Array<{ _id?: string; id?: string; title?: string; filename?: string }>;
}

const floatingIcons = [
  { Icon: MessageSquare, delay: 0, x: -60, y: -40 },
  { Icon: Shield, delay: 0.5, x: 50, y: -30 },
  { Icon: CreditCard, delay: 1, x: -40, y: 30 },
  { Icon: HelpCircle, delay: 1.5, x: 60, y: 20 },
  { Icon: Zap, delay: 2, x: -20, y: -60 },
];

const defaultSuggestions = [
  { label: "Get help with your account", message: "I need help with my account", icon: Shield },
  { label: "Report an issue", message: "I want to report an issue", icon: MessageSquare },
  { label: "Billing questions", message: "I have a billing question", icon: CreditCard },
  { label: "General inquiry", message: "I have a general question", icon: HelpCircle },
];

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage, onStartWithDocument, onOpenTicket, documents }: WelcomeScreenProps) {
  const documentSuggestions = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    return documents.slice(0, 4).map((doc) => ({
      label: `Ask about ${doc.title || doc.filename || "document"}`,
      message: `Tell me about "${doc.title || doc.filename || "document"}"`,
      icon: FileText,
    }));
  }, [documents]);

  const suggestions = documentSuggestions.length > 0 ? documentSuggestions : defaultSuggestions;

  const handleChatInput = useCallback(
    (text: string, _file?: File) => {
      if (text.trim()) {
        onStartWithMessage(text.trim());
      }
    },
    [onStartWithMessage]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Gradient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto relative z-10">
        {/* Floating icons */}
      <div className="relative mb-8">
        {floatingIcons.map(({ Icon, delay, x, y }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.15,
              scale: 1,
              y: [0, -8, 0],
            }}
            transition={{
              opacity: { delay, duration: 0.5 },
              scale: { delay, duration: 0.5 },
              y: { delay: delay + 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute text-primary"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          >
            <Icon size={20} />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <Headphones className="w-8 h-8 text-primary-foreground" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            How can I help you today?
          </span>
          <Sparkles size={20} className="text-primary" />
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ask questions, report issues, or get help with your account. Our AI assistant is here to assist.
        </p>
      </motion.div>

      {documentSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2"
        >
          <BookOpen size={12} />
          Ask about your documents
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full mb-6"
      >
        {suggestions.map((s) => {
          const Icon = s.icon;
          const isDocument = Icon === FileText;
          return (
            <motion.div key={s.label} variants={staggerItem}>
              <Button
                variant="outline"
                className="w-full h-auto py-3 px-4 text-left text-sm justify-start gap-3 rounded-xl dark:border-white/[0.06] dark:hover:bg-primary/10 dark:hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/10"
                onClick={() =>
                  isDocument && onStartWithDocument
                    ? onStartWithDocument(s.message)
                    : onStartWithMessage(s.message)
                }
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="line-clamp-2">{s.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTicket}
          className="dark:hover:bg-primary/10 gap-2 text-muted-foreground"
        >
          <Plus size={16} />
          <span>Create a Support Ticket</span>
        </Button>
      </motion.div>
      </div>

      <div className="relative z-10 border-t dark:border-white/[0.06] bg-background/80 backdrop-blur-xl shrink-0">
        <ChatInput onSend={handleChatInput} disabled={false} />
      </div>
    </div>
  );
});

export default WelcomeScreen;
