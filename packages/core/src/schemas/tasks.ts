import { z } from "zod";

export const prioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: prioritySchema.default(2),
  due_at: z.string().datetime().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  completed_at: z.string().datetime().nullable().optional(),
});

export const taskCategorySchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskCategoryInput = z.infer<typeof taskCategorySchema>;
