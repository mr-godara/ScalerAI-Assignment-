import { api } from "./client";
import { HostedZone, PaginatedResponse, ZoneListParams } from "@/types/api";

export const hostedZonesApi = {
  getZones: (params?: ZoneListParams) => {
    return api.get<PaginatedResponse<HostedZone>>("/hosted-zones", { params });
  },
  getZone: (id: string) => {
    return api.get<HostedZone>(`/hosted-zones/${id}`);
  },
  createZone: (data: Partial<HostedZone>) => {
    return api.post<HostedZone>("/hosted-zones", data);
  },
  updateZone: (id: string, data: Partial<HostedZone>) => {
    return api.put<HostedZone>(`/hosted-zones/${id}`, data);
  },
  deleteZone: (id: string) => {
    return api.delete<void>(`/hosted-zones/${id}`);
  },
};
