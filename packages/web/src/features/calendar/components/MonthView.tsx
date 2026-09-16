import { useMemo } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEventRow } from "../hooks/useCalendarEvents";

interface Props {
  cursor: Date;
  events: CalendarEventRow[];
  onSelectDay: (day: Date) => void;
  onSelectEvent: (event: CalendarEventRow) => void;
}

const MAX_PILLS = 3;

function eventsOnDay(events: CalendarEventRow[], day: Date) {
  return events
    .filter((e) => {
      const start = new Date(e.starts_at);
      const end = new Date(e.ends_at);
      return day >= startOfDayLocal(start) && day <= endOfDayLocal(end);
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

function startOfDayLocal(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDayLocal(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export function MonthView({ cursor, events, onSelectDay, onSelectEvent }: Props) {
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) list.push(d);
    return list;
  }, [cursor]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEE"));
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {weekdayLabels.map((l) => (
          <div key={l} className="py-2">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 [grid-auto-rows:minmax(6rem,1fr)]">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const dayEvents = eventsOnDay(events, day);
          const overflow = dayEvents.length - MAX_PILLS;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "group flex flex-col gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
              aria-label={format(day, "EEEE, d MMMM yyyy")}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-medium",
                  today && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, MAX_PILLS).map((e) => (
                  <span
                    key={e.id}
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onSelectEvent(e);
                    }}
                    className={cn(
                      "cursor-pointer truncate rounded px-1.5 py-0.5 text-[11px]",
                      e.all_day
                        ? "bg-primary/15 text-primary"
                        : "bg-primary/10 text-foreground hover:bg-primary/20",
                    )}
                  >
                    {!e.all_day ? <span className="mr-1 opacity-70">{format(new Date(e.starts_at), "HH:mm")}</span> : null}
                    {e.title}
                  </span>
                ))}
                {overflow > 0 ? (
                  <span className="text-[11px] text-muted-foreground">+{overflow} more</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

