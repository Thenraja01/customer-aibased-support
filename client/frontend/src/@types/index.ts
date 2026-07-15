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
  organization_id: string;
  role_id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  dob?: string;
  auth_type: "local" | "google" | "github";
  status: "active" | "inactive" | "blocked";
  created_At?: string;
}
