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