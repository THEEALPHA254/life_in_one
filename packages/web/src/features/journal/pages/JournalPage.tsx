import { useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { EntryEditor } from "../components/EntryEditor";
import { useEntries, useEntriesByDate, type JournalEntryWithTags } from "../hooks/useJournal";

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

const moodEmoji: Record<number, string> = { 1: "😞", 2: "😐", 3: "🙂", 4: "😊", 5: "🤩" };

type OpenState = { kind: "list" } | { kind: "entry"; id: string } | { kind: "new" };

export function JournalPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<OpenState>({ kind: "list" });

  const dateKey = isoDate(cursor);
  const dayEntriesQ = useEntriesByDate(dateKey);
  const entriesQ = useEntries(search);

  const changeDate = (next: Date) => {
    setOpen({ kind: "list" });
    setCursor(next);
  };

  const openEntry = (entry: JournalEntryWithTags) => {
    if (!isSameDay(new Date(entry.entry_date + "T00:00:00"), cursor)) {
      setCursor(new Date(entry.entry_date + "T00:00:00"));
    }
    setOpen({ kind: "entry", id: entry.id });
  };

  const initialForEditor: JournalEntryWithTags | null = useMemo(() => {
    if (open.kind !== "entry") return null;
    return (dayEntriesQ.data ?? []).find((e) => e.id === open.id) ?? null;
  }, [open, dayEntriesQ.data]);

  const dayEntries = dayEntriesQ.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Journal</h1>
          <p className="text-sm text-muted-foreground">{format(cursor, "EEEE, d MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => changeDate(addDays(cursor, -1))} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DatePicker value={cursor} onChange={(d) => d && changeDate(d)} align="end" />
          <Button variant="outline" size="icon" onClick={() => changeDate(addDays(cursor, 1))} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => changeDate(new Date())} disabled={isSameDay(cursor, new Date())}>
            Today
          </Button>
        </div>
      </header>

      {open.kind === "list" || open.kind === "new" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Entries today</h2>
            <Button size="sm" onClick={() => setOpen({ kind: "new" })}>
              <Plus className="h-4 w-4" /> New entry
            </Button>
          </div>

          {open.kind === "new" ? (
            <EntryEditor
              entryDate={dateKey}
              initialEntry={null}
              onClose={() => setOpen({ kind: "list" })}
              onIdAssigned={() => {
                // no-op: keep the editor mounted for this whole editing session.
                // Switching to {kind: "entry", id} moves the editor to a different
                // render branch with a new key → remount with initialEntry=null,
                // stranding in-flight typing.
              }}
            />
          ) : dayEntriesQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dayEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nothing written yet.{" "}
              <button className="font-medium text-primary hover:underline" onClick={() => setOpen({ kind: "new" })}>
                Start an entry
              </button>
              .
            </div>
          ) : (
            <ul className="space-y-2">
              {dayEntries.map((e) => {
                const excerpt = (e.content_text ?? "").slice(0, 200);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => openEntry(e)}
                      className="group flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {e.mood ? <span aria-hidden>{moodEmoji[e.mood]}</span> : null}
                          <p className="truncate text-sm font-medium">
                            {e.title || (excerpt ? excerpt.split("\n")[0] : "Untitled entry")}
                          </p>
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {format(new Date(e.updated_at), "HH:mm")}
                          </span>
                        </div>
                        {excerpt ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
                        ) : (
                          <p className="mt-1 text-xs italic text-muted-foreground">Empty entry</p>
                        )}
                        {e.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {e.tags.map((t) => (
                              <span key={t.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section>
          <EntryEditor
            key={open.id}
            entryDate={dateKey}
            initialEntry={initialForEditor}
            onClose={() => setOpen({ kind: "list" })}
            onIdAssigned={() => {
              // no-op: id already set for existing entries
            }}
          />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Across all days</h2>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries"
              className="pl-8"
            />
          </div>
        </div>
        {entriesQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (entriesQ.data ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {search ? "No entries match." : "No entries yet."}
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {(entriesQ.data ?? []).map((e) => {
              const excerpt = (e.content_text ?? "").slice(0, 140);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent/40"
                    onClick={() => {
                      const d = new Date(e.entry_date + "T00:00:00");
                      setCursor(d);
                      setOpen({ kind: "entry", id: e.id });
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {format(new Date(e.entry_date + "T00:00:00"), "EEE, d MMM yyyy")}
                        {e.title ? <span className="ml-2 text-muted-foreground">· {e.title}</span> : null}
                      </div>
                      {excerpt ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
                      ) : (
                        <p className="mt-0.5 text-xs italic text-muted-foreground">Empty entry</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
