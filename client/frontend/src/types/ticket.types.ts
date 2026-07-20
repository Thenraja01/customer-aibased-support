export interface Ticket {
  _id: string;
  user_id: string | { _id: string; name: string; email: string };
  organization_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: string;
  assigned_to?: string | { _id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export interface TicketFilter {
  status?: string;
  priority?: string;
  assigned_to?: string;
  user_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}
