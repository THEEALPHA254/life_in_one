import { z } from "zod";

export const journalEntryCreateSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(200).optional(),
  content_json: z.unknown().optional(),
  content_text: z.string().optional(),
  mood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().optional(),
});

export const journalTagSchema = z.object({
  name: z.string().min(1).max(40),
});

export type JournalEntryInput = z.infer<typeof journalEntryCreateSchema>;
export type JournalTagInput = z.infer<typeof journalTagSchema>;
