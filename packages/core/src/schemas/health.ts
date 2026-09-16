import { z } from "zod";

export const healthMetricSchema = z.object({
  metric_type: z.string().min(1).max(40),
  value: z.number().finite(),
  recorded_at: z.string().datetime(),
  source: z.string().default("manual"),
  external_id: z.string().nullable().optional(),
});

export type HealthMetricInput = z.infer<typeof healthMetricSchema>;
