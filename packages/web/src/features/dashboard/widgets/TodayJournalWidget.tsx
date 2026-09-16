import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { useEntriesByDate } from "@/features/journal/hooks/useJournal";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

const moodEmoji: Record<number, string> = { 1: "😞", 2: "😐", 3: "🙂", 4: "😊", 5: "🤩" };

export function TodayJournalWidget() {
  const today = format(new Date(), "yyyy-MM-dd");
  const q = useEntriesByDate(today);
  const entries = q.data ?? [];
  const latest = entries[entries.length - 1];

  return (
    <WidgetCard to="/journal" title="Journal" icon={BookOpen}>
      {entries.length === 0 ? (
        <WidgetEmpty text="No entry today. Tap to write one." />
      ) : (
        <>
          <div className="flex items-center gap-2">
            {latest?.mood ? <span className="text-2xl" aria-hidden>{moodEmoji[latest.mood]}</span> : null}
            <p className="text-sm font-medium">
              {entries.length === 1 ? "1 entry today" : `${entries.length} entries today`}
            </p>
          </div>
          {latest ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {latest.title || (latest.content_text ?? "Empty entry")}
            </p>
          ) : null}
        </>
      )}
    </WidgetCard>
  );
}
