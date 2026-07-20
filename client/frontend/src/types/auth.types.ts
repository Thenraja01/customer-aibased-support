export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  organization_id?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  organization?: Organization;
  avatar?: string;
  auth_type: 'local' | 'google' | 'github';
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface SocialLoginRequest {
  token: string;
  provider: 'google' | 'github';
}
