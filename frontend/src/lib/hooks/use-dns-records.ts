import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dnsRecordsApi } from "../api/dns-records";
import { toast } from "../toast";
import { DNSRecord, RecordListParams } from "@/types/api";
import { getErrorMessage } from "@/lib/utils";

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
      toast.success("Record created successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create record");
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
      toast.success("Record saved");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update record");
    },
  });
};

export const useDeleteRecord = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => dnsRecordsApi.deleteRecord(zoneId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
      toast.success("Record deleted");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete record");
    },
  });
};

export const useBulkDeleteRecords = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isAll }: { ids: string[] | null; isAll: boolean }) =>
      dnsRecordsApi.bulkDeleteRecords(zoneId, ids, isAll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
      toast.success("Records deleted");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete records"));
    },
  });
};

export const useBulkUpdateRecords = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isAll, updates }: { ids: string[] | null; isAll: boolean; updates: { ttl?: number } }) =>
      dnsRecordsApi.bulkUpdateRecords(zoneId, ids, isAll, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
      toast.success("Records updated");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update records"));
    },
  });
};


export const useImportZoneFile = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => dnsRecordsApi.importZoneFile(zoneId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dnsRecords", zoneId] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to import zone file"));
    },
  });
};
