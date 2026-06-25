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
  bulkDeleteRecords: (zoneId: string, ids: string[] | null, isAll: boolean = false) => {
    return api.post<{ deleted: number }>(`/hosted-zones/${zoneId}/records/bulk-delete`, { record_ids: ids, all: isAll });
  },
  bulkUpdateRecords: (zoneId: string, ids: string[] | null, isAll: boolean, updates: { ttl?: number }) => {
    return api.patch<{ updated_count: number }>(`/hosted-zones/${zoneId}/records/bulk`, {
      record_ids: ids,
      all: isAll,
      updates
    });
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
  exportZoneFileUrl: (zoneId: string, format: "bind" | "json", recordIds?: string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    let url = `${baseUrl}/hosted-zones/${zoneId}/records/export?format=${format}`;
    if (recordIds && recordIds.length > 0) {
      url += `&record_ids=${recordIds.join(",")}`;
    }
    return url;
  },
  downloadExport: async (zoneId: string, format: "bind" | "json", recordIds?: string[]) => {
    let url = `/hosted-zones/${zoneId}/records/export?format=${format}`;
    if (recordIds && recordIds.length > 0) {
      url += `&record_ids=${recordIds.join(",")}`;
    }
    // We use the raw axios instance to get the Blob response directly
    const { apiClient } = await import("./client");
    const response = await apiClient.get(url, { responseType: "blob" });
    return response.data as Blob;
  },
};
