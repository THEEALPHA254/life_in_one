import { z } from "zod";

export const bibleNoteCreateSchema = z.object({
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  service_title: z.string().max(200).optional(),
  speaker: z.string().max(120).optional(),
  content_json: z.unknown().optional(),
  content_text: z.string().optional(),
});

export const bibleVerseSchema = z.object({
  book: z.string().min(1).max(40),
  chapter: z.number().int().min(1).max(200),
  verse_start: z.number().int().min(1).max(200),
  verse_end: z.number().int().min(1).max(200).nullable().optional(),
  translation: z.string().max(20).default("KJV"),
  text: z.string().max(4000).optional(),
});

export type BibleNoteInput = z.infer<typeof bibleNoteCreateSchema>;
export type BibleVerseInput = z.infer<typeof bibleVerseSchema>;
