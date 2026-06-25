export interface PaginatedResponse<T> {
  // This is a generic, but we actually need specific types to match backend keys
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ZoneListResponse extends PaginatedResponse<HostedZone> {
  zones: HostedZone[];
}

export interface RecordListResponse extends PaginatedResponse<DNSRecord> {
  records: DNSRecord[];
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
  type: string; // The backend returns ZoneType which is a string (e.g., 'PUBLIC' or 'PRIVATE')
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: string;
  value: string[];
  ttl: number;
  routing_policy: string;
  alias: boolean;
  alias_target?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ZoneListParams {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
}

export interface RecordListParams {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
}

