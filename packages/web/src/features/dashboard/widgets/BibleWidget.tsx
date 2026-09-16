import { BookMarked } from "lucide-react";
import { format } from "date-fns";
import { useNotes } from "@/features/bible/hooks/useBible";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

export function BibleWidget() {
  const q = useNotes();
  const notes = q.data ?? [];
  const latest = notes[0];
  const latestVerse = latest?.verses?.[latest.verses.length - 1] ?? null;

  return (
    <WidgetCard to="/bible" title="Bible" icon={BookMarked}>
      {!latest ? (
        <WidgetEmpty text="No notes yet." />
      ) : (
        <>
          <div>
            <p className="truncate text-sm font-medium">{latest.service_title || "Untitled note"}</p>
            <p className="text-xs text-muted-foreground">
              {latest.service_date
                ? format(new Date(latest.service_date + "T00:00:00"), "EEE, d MMM yyyy")
                : format(new Date(latest.created_at), "EEE, d MMM yyyy")}
              {latest.speaker ? ` · ${latest.speaker}` : ""}
            </p>
          </div>
          {latestVerse ? (
            <div className="rounded-md border bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-primary">
                {latestVerse.book} {latestVerse.chapter}:{latestVerse.verse_start}
                {latestVerse.verse_end && latestVerse.verse_end !== latestVerse.verse_start ? `-${latestVerse.verse_end}` : ""}
              </p>
              {latestVerse.text ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{latestVerse.text}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{latest.verses.length} verses attached</p>
          )}
        </>
      )}
    </WidgetCard>
  );
}
