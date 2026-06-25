import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dnsRecordsApi } from "../api/dns-records";
import { DNSRecord, RecordListParams } from "@/types/api";

export const useRecords = (zoneId: string, params?: RecordListParams) => {
  return useQuery({
    queryKey: ["dnsRecords", zoneId, params],
    queryFn: () => dnsRecordsApi.getRecords(zoneId, params),
    enabled: !!zoneId,
    staleTime: 30_000,
  });
};

export const useCreateRecord = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DNSRecord>) => dnsRecordsApi.createRecord(zoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
    },
  });
};

export const useUpdateRecord = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, data }: { recordId: string; data: Partial<DNSRecord> }) =>
      dnsRecordsApi.updateRecord(zoneId, recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
    },
  });
};

export const useDeleteRecord = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => dnsRecordsApi.deleteRecord(zoneId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
    },
  });
};

export const useBulkDeleteRecords = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => dnsRecordsApi.bulkDeleteRecords(zoneId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
    },
  });
};
