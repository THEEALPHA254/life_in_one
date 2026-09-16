import { z } from "zod";

export const goalStatusSchema = z.enum(["pending", "in_progress", "achieved", "abandoned"]);

export const goalCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  year: z.number().int().min(2000).max(2100),
  status: goalStatusSchema.default("pending"),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export type GoalInput = z.infer<typeof goalCreateSchema>;
