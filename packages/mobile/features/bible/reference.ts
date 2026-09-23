// Same parser as packages/web/src/features/bible/reference.ts. If we edit
// either, mirror the other.
export interface ParsedReference {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
}

// Handles: "John 3:16", "1 John 3:16", "Song of Solomon 1:1", "John 3:16-18".
// Cross-chapter ranges (e.g. "John 3:16-4:2") are not supported.
const REF_RE = /^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/;

export function parseReference(input: string): ParsedReference | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(REF_RE);
  if (!m) return null;
  const [, book, chapter, vs, ve] = m;
  return {
    book: (book ?? "").trim(),
    chapter: parseInt(chapter ?? "0", 10),
    verse_start: parseInt(vs ?? "0", 10),
    verse_end: ve ? parseInt(ve, 10) : undefined,
  };
}
