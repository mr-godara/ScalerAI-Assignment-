export interface PaginatedResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type HostedZoneType = "PUBLIC" | "PRIVATE";
export type DNSRecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "SOA" | "PTR" | "SRV" | "CAA";

export interface ZoneListResponse extends PaginatedResponse {
  zones: HostedZone[];
}

export interface RecordListResponse extends PaginatedResponse {
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
  created_at?: string;
  updated_at?: string;
}

export interface HostedZone {
  id: string;
  name: string;
  caller_reference?: string;
  comment?: string;
  type: HostedZoneType;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: DNSRecordType;
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
  expires_in: number;
  user: Pick<User, "id" | "email">;
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
