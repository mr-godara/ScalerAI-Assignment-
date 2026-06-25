import { api } from "./client";
import { DNSRecord, RecordListResponse, RecordListParams } from "@/types/api";

export const dnsRecordsApi = {
  getRecords: (zoneId: string, params?: RecordListParams) => {
    return api.get<RecordListResponse>(`/hosted-zones/${zoneId}/records`, { params });
  },
  createRecord: (zoneId: string, data: Partial<DNSRecord>) => {
    return api.post<DNSRecord>(`/hosted-zones/${zoneId}/records`, data);
  },
  updateRecord: (zoneId: string, recordId: string, data: Partial<DNSRecord>) => {
    return api.put<DNSRecord>(`/hosted-zones/${zoneId}/records/${recordId}`, data);
  },
  deleteRecord: (zoneId: string, recordId: string) => {
    return api.delete<void>(`/hosted-zones/${zoneId}/records/${recordId}`);
  },
  bulkDeleteRecords: (zoneId: string, ids: string[]) => {
    // Assuming backend supports bulk delete via a POST or DELETE with body.
    // Standard REST might use a POST to a /bulk-delete endpoint.
    return api.post<{ deleted: number }>(`/hosted-zones/${zoneId}/records/bulk-delete`, { ids });
  },
};
