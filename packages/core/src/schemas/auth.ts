import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
});

export const registerSchema = loginSchema.extend({
  display_name: z.string().min(1, "Required").max(80).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
