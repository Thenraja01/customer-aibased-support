export interface ChatSession {
  _id: string;
  user_id: string;
  organization_id: string;
  topic: string;
  status: 'open' | 'closed' | 'escalated';
  assigned_to?: string;
  satisfaction?: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  _id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_ai: boolean;
  metadata?: Record<string, any>;
  feedback?: 'helpful' | 'not_helpful' | null;
  created_at: string;
}

export interface SendMessageRequest {
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_ai: boolean;
}

export interface CreateChatRequest {
  user_id: string;
  organization_id: string;
  topic: string;
}

export interface AIResponse {
  message: ChatMessage;
  suggested_replies?: string[];
  faq_matches?: FAQMatch[];
}

export interface FAQMatch {
  question: string;
  answer: string;
  confidence: number;
}

export interface QuickReply {
  label: string;
  content: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  created_at: string;
}
