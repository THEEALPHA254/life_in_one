import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteEditor } from "../components/NoteEditor";
import { useNotes, type BibleNoteWithVerses } from "../hooks/useBible";

type OpenState = { kind: "list" } | { kind: "note"; id: string } | { kind: "new" };

export function BiblePage() {
  const notesQ = useNotes();
  const [open, setOpen] = useState<OpenState>({ kind: "list" });
  const [search, setSearch] = useState("");

  const notes = notesQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const hay = [
        n.service_title ?? "",
        n.speaker ?? "",
        n.content_text ?? "",
        ...(n.verses ?? []).map((v) => `${v.book} ${v.chapter}:${v.verse_start}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [notes, search]);

  const activeNote: BibleNoteWithVerses | null = useMemo(() => {
    if (open.kind !== "note") return null;
    return notes.find((n) => n.id === open.id) ?? null;
  }, [open, notes]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bible Journal</h1>
          <p className="text-sm text-muted-foreground">Notes from services — with verses fetched on demand.</p>
        </div>
        {open.kind === "list" ? (
          <Button onClick={() => setOpen({ kind: "new" })}>
            <Plus className="h-4 w-4" /> New note
          </Button>
        ) : null}
      </header>

      {open.kind === "list" ? (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, speaker, verse, content"
              className="pl-8"
            />
          </div>

          {notesQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              {notes.length === 0 ? (
                <>
                  No notes yet.{" "}
                  <button className="font-medium text-primary hover:underline" onClick={() => setOpen({ kind: "new" })}>
                    Start one
                  </button>
                  .
                </>
              ) : (
                "No notes match."
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((n) => {
                const excerpt = (n.content_text ?? "").slice(0, 200);
                const dateLabel = n.service_date
                  ? format(new Date(n.service_date + "T00:00:00"), "EEE, d MMM yyyy")
                  : format(new Date(n.created_at), "EEE, d MMM yyyy");
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setOpen({ kind: "note", id: n.id })}
                      className="group flex w-full flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {n.service_title || (excerpt ? excerpt.split("\n")[0] : "Untitled note")}
                        </p>
                        <span className="ml-auto text-[11px] text-muted-foreground">{dateLabel}</span>
                      </div>
                      {n.speaker ? (
                        <p className="text-xs text-muted-foreground">{n.speaker}</p>
                      ) : null}
                      {excerpt ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
                      ) : null}
                      {n.verses.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {n.verses.slice(0, 4).map((v) => (
                            <span key={v.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                              {v.book} {v.chapter}:{v.verse_start}
                              {v.verse_end && v.verse_end !== v.verse_start ? `-${v.verse_end}` : ""}
                            </span>
                          ))}
                          {n.verses.length > 4 ? (
                            <span className="text-[11px] text-muted-foreground">+{n.verses.length - 4} more</span>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <NoteEditor
          key={open.kind === "note" ? open.id : "draft"}
          initialNote={activeNote}
          onClose={() => setOpen({ kind: "list" })}
          onIdAssigned={() => {
            // no-op: keep the editor mounted for this whole editing session.
            // Switching to {kind: "note", id} would change the React `key`
            // and force a remount with initialNote=null (list hasn't refetched
            // yet), stranding in-flight typing. The editor tracks its own id
            // internally for follow-up autosaves.
          }}
        />
      )}
    </div>
  );
}
