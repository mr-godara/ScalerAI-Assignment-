export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AppError {
  message: string;
  status?: number;
  field_errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface HostedZone {
  id: string;
  name: string;
  caller_reference: string;
  comment?: string;
  private_zone: boolean;
  resource_record_set_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
  routing_policy: string;
  health_check_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ZoneListParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface RecordListParams {
  page?: number;
  size?: number;
  search?: string;
  type?: string;
}
