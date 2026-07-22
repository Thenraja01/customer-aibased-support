export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization_id: any;
  role_id: any;
  status: string;
  createdAt?: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  organization_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  createdAt?: string;
}

export interface IRole {
  _id: string;
  role_name: string;
  description?: string;
  createdAt?: string;
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
