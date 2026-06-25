import { z } from "zod";

export const zoneSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  comment: z.string().optional(),
  privateZone: z.boolean(),
});

export type ZoneFormValues = z.infer<typeof zoneSchema>;
