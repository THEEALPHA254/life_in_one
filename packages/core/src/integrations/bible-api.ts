// Framework-agnostic Bible API client.
// Prefers scripture.api.bible when a key is provided; falls back to bible-api.com (no key).

export interface BibleConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface Passage {
  reference: string;
  translation: string;
  text: string;
}

export async function fetchPassage(reference: string, cfg: BibleConfig = {}): Promise<Passage> {
  if (cfg.apiKey && cfg.baseUrl) {
    const url = `${cfg.baseUrl}/bibles/search?query=${encodeURIComponent(reference)}`;
    const res = await fetch(url, { headers: { "api-key": cfg.apiKey } });
    if (!res.ok) throw new Error(`Bible API error: ${res.status}`);
    const json = (await res.json()) as { data?: { passages?: Array<{ reference: string; content: string }> } };
    const first = json.data?.passages?.[0];
    if (!first) throw new Error("Passage not found");
    return { reference: first.reference, translation: "api.bible", text: first.content };
  }

  const res = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
  if (!res.ok) throw new Error(`bible-api.com error: ${res.status}`);
  const json = (await res.json()) as { reference: string; text: string; translation_name?: string };
  return { reference: json.reference, translation: json.translation_name ?? "WEB", text: json.text.trim() };
}
