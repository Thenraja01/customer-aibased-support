export interface IRole {
  _id?: string;
  role_name: string;
}

export interface IOrganization {
  _id?: string;
  organization_id: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: "active" | "inactive";
  customPrompt?: string;
  chatbot_name?: string;
  default_language?: string;
  greeting_message?: string;
  logo?: { url?: string; public_id?: string };
  brand_colors?: { primary?: string; secondary?: string; accent?: string };
  chart_colors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
    grid?: string;
    text?: string;
    background?: string;
  };
  show_charts?: boolean;
  ai_settings?: {
    temperature?: number;
    top_k?: number;
    similarity_threshold?: number;
    max_tokens?: number;
    response_style?: "concise" | "balanced" | "detailed";
  };
  guardrails?: Array<{ rule: string; enabled: boolean }>;
  working_hours?: {
    timezone?: string;
    monday?: WorkingDay;
    tuesday?: WorkingDay;
    wednesday?: WorkingDay;
    thursday?: WorkingDay;
    friday?: WorkingDay;
    saturday?: WorkingDay;
    sunday?: WorkingDay;
  };
  email_templates?: {
    ticket_assigned?: EmailTemplate;
    ticket_resolved?: EmailTemplate;
  };
}

export interface WorkingDay {
  open?: string;
  close?: string;
  enabled?: boolean;
}

export interface EmailTemplate {
  subject?: string;
  body?: string;
}

export interface IUser {
  _id?: string;

  organization_id: IOrganization;
  role_id: IRole;

  name: string;
  email: string;
  phone?: string;
  password?: string;
  dob?: string;

  auth_type: "local" | "google" | "github";
  status: "active" | "inactive" | "blocked";
  created_At?: string;
}

export interface IDocument {
  _id: string;
  user_id: string;
  organization_id: string;
  document_type_id?: string;
  title: string;
  file_url: string;
  assigned_role?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
}

export interface IDocumentType {
  _id: string;
  name: string;
  description?: string;
}

export interface IDocumentVerification {
  _id: string;
  document_id: string;
  verified_by: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}