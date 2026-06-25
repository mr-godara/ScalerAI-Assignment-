import { z } from "zod";

export const zoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").endsWith(".", "Zone name must end with a dot"),
  comment: z.string().optional(),
  privateZone: z.boolean().default(false),
});

export type ZoneFormValues = z.infer<typeof zoneSchema>;
