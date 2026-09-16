import { z } from "zod";

export const calendarEventCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    all_day: z.boolean().default(false),
  })
  .refine((v) => new Date(v.ends_at) >= new Date(v.starts_at), {
    message: "ends_at must be on or after starts_at",
    path: ["ends_at"],
  });

export type CalendarEventInput = z.infer<typeof calendarEventCreateSchema>;
