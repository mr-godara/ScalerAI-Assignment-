import { api } from "./client";
import { DNSRecord, RecordListResponse, RecordListParams } from "@/types/api";

export interface ImportResponse {
  imported: number;
  skipped: number;
  errors: string[];
}

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
    return api.post<{ deleted: number }>(`/hosted-zones/${zoneId}/records/bulk-delete`, { ids });
  },
  importZoneFile: (zoneId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ImportResponse>(`/hosted-zones/${zoneId}/records/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  exportZoneFileUrl: (zoneId: string, format: "bind" | "json") => {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hosted-zones/${zoneId}/records/export?format=${format}`;
  },
};
