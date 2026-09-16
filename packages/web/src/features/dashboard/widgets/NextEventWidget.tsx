import { useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, formatDistanceToNow } from "date-fns";
import { useEventsInRange } from "@/features/calendar/hooks/useCalendarEvents";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

export function NextEventWidget() {
  const from = new Date();
  const to = addDays(from, 7);
  const q = useEventsInRange(from.toISOString(), to.toISOString());
  const events = q.data ?? [];

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.starts_at).getTime() >= now || (new Date(e.ends_at).getTime() >= now && !e.all_day))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const next = upcoming[0];
  const rest = upcoming.slice(1, 3);

  return (
    <WidgetCard to="/calendar" title="Calendar" icon={CalendarIcon}>
      {next ? (
        <>
          <div>
            <p className="truncate text-sm font-medium">{next.title}</p>
            <p className="text-xs text-muted-foreground">
              {next.all_day
                ? `All day · ${format(new Date(next.starts_at), "EEE, d MMM")}`
                : `${format(new Date(next.starts_at), "EEE, d MMM · HH:mm")} · in ${formatDistanceToNow(new Date(next.starts_at))}`}
            </p>
          </div>
          {rest.length > 0 ? (
            <ul className="space-y-1 pt-1">
              {rest.map((e) => (
                <li key={e.id} className="truncate text-xs text-muted-foreground">
                  {format(new Date(e.starts_at), "EEE HH:mm")} · {e.title}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <WidgetEmpty text="Nothing coming up in the next 7 days." />
      )}
    </WidgetCard>
  );
}
