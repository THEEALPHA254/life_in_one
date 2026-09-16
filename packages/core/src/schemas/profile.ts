import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark", "system"]);

export const profileSchema = z.object({
  display_name: z.string().min(1).max(80).nullable(),
  avatar_url: z.string().url().nullable().optional(),
  theme_mode: themeModeSchema.default("system"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
