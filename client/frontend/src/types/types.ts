export type {
  IRole,
  IOrganization,
  IUser,
  IDocument,
  IDocumentType,
  IDocumentVerification,
} from "./index";

export interface ISubscription {
  _id?: string;
  organization_id: string;
  plan: "Starter" | "Professional" | "Enterprise";
  status: "active" | "trial" | "past_due" | "cancelled";
  billingCycle: "monthly" | "quarterly" | "annual";
  tokenLimit: number;
  userLimit: number;
  documentLimit: number;
  startDate?: string;
  nextBilling?: string;
}

export interface IKnowledgeBase {
  _id?: string;
  organization_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface IAIConfig {
  _id?: string;
  organization_id: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enabledFeatures: string[];
  updated_at?: string;
}

export interface IConversation {
  _id?: string;
  chat_id: string;
  user_id: string;
  organization_id: string;
  topic: string;
  status: "open" | "closed" | "escalated";
  satisfaction?: number;
  created_at?: string;
  updated_at?: string;
}
