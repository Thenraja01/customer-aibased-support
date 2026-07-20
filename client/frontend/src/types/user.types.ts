export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dob?: string;
  address?: string;
  auth_type: 'local' | 'google' | 'github';
  role: { _id: string; name: string };
  organization?: { _id: string; name: string };
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  updated_at?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  dob?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ActivityLog {
  _id: string;
  user_id: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
