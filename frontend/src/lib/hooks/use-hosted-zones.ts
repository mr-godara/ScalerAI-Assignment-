import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hostedZonesApi } from "../api/hosted-zones";
import { toast } from "../toast";
import { HostedZone, ZoneListParams } from "@/types/api";

export const useZones = (params?: ZoneListParams) => {
  return useQuery({
    queryKey: ["hostedZones", params],
    queryFn: () => hostedZonesApi.getZones(params),
    staleTime: 30_000,
  });
};

export const useZone = (id: string) => {
  return useQuery({
    queryKey: ["hostedZone", id],
    queryFn: () => hostedZonesApi.getZone(id),
    enabled: !!id,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostedZonesApi.createZone,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hostedZones"] });
      toast.success("Hosted zone created", data.name);
    },
    onError: (error) => {
      toast.error(error);
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HostedZone> }) =>
      hostedZonesApi.updateZone(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hostedZones"] });
      queryClient.invalidateQueries({ queryKey: ["hostedZone", variables.id] });
      toast.success("Hosted zone updated");
    },
    onError: (error) => {
      toast.error(error);
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostedZonesApi.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostedZones"] });
      toast.success("Hosted zone deleted");
    },
    onError: (error) => {
      toast.error(error);
    },
  });
};
