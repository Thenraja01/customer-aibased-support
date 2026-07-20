export interface Document {
  _id: string;
  user_id: string;
  organization_id: string;
  document_type_id?: string;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_mimetype: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface DocumentType {
  _id: string;
  name: string;
  description?: string;
  required: boolean;
  created_at: string;
}

export interface DocumentVerification {
  _id: string;
  document_id: string | Document;
  verified_by: string | { _id: string; name: string };
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentUploadRequest {
  title: string;
  description?: string;
  document_type_id?: string;
  file: File;
}

export interface DocumentFilter {
  status?: string;
  document_type_id?: string;
  user_id?: string;
  organization_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}
