import { z } from "zod";

export const recordSchema = z.object({
  name: z.string().min(1, "Record name is required"),
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "PTR"]),
  ttl: z.number().int().min(0, "TTL must be positive"),
  value: z.string().min(1, "Value is required"),
  routingPolicy: z.enum(["Simple", "Weighted", "Latency", "Failover", "Geolocation"]).default("Simple"),
});

export type RecordFormValues = z.infer<typeof recordSchema>;
