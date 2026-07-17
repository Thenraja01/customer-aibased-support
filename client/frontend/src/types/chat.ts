export interface Chat {
  _id: string;
  user_id: string;
  organization_id: string;
  topic: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  _id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "system";
  is_ai: boolean;
  feedback?: "helpful" | "not_helpful" | null;
  created_at: string;
}

export interface SendMessagePayload {
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "system";
  is_ai: boolean;
}
