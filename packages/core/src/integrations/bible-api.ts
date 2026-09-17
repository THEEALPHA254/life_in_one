// Framework-agnostic Bible API client.
// Prefers scripture.api.bible when both `apiKey` and `bibleId` are provided;
// otherwise falls back to bible-api.com (no key required).

export interface BibleConfig {
  /** API key from scripture.api.bible (dashboard → Applications). */
  apiKey?: string;
  /** Base URL (default: https://api.scripture.api.bible/v1). */
  baseUrl?: string;
  /** Bible ID from api.bible. Default: KJV (`de4e12af7f28f599-02`). */
  bibleId?: string;
}

export interface Passage {
  reference: string;
  translation: string;
  text: string;
}

const DEFAULT_BASE = "https://api.scripture.api.bible/v1";
const DEFAULT_BIBLE_ID = "de4e12af7f28f599-02"; // KJV

interface ApiBibleSearchHit {
  reference?: string;
  text?: string;
  content?: string;
  bibleId?: string;
}

interface ApiBibleSearchResponse {
  data?: {
    passages?: ApiBibleSearchHit[];
    verses?: ApiBibleSearchHit[];
  };
}

interface BibleApiComResponse {
  reference: string;
  text: string;
  translation_name?: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchPassage(reference: string, cfg: BibleConfig = {}): Promise<Passage> {
  if (cfg.apiKey) {
    const baseUrl = cfg.baseUrl ?? DEFAULT_BASE;
    const bibleId = cfg.bibleId ?? DEFAULT_BIBLE_ID;
    // Search endpoint accepts a reference-style query and returns the best-matching passage.
    const url = `${baseUrl}/bibles/${encodeURIComponent(bibleId)}/search?query=${encodeURIComponent(reference)}&limit=1`;
    const res = await fetch(url, { headers: { "api-key": cfg.apiKey } });
    if (!res.ok) throw new Error(`api.bible error: ${res.status}`);
    const json = (await res.json()) as ApiBibleSearchResponse;
    const hit = json.data?.passages?.[0] ?? json.data?.verses?.[0];
    if (!hit) throw new Error(`Passage not found: ${reference}`);
    const raw = hit.content ?? hit.text ?? "";
    return {
      reference: hit.reference ?? reference,
      translation: "api.bible",
      text: stripTags(raw),
    };
  }

  const res = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
  if (!res.ok) throw new Error(`bible-api.com error: ${res.status}`);
  const json = (await res.json()) as BibleApiComResponse;
  return {
    reference: json.reference,
    translation: json.translation_name ?? "WEB",
    text: json.text.trim(),
  };
}
