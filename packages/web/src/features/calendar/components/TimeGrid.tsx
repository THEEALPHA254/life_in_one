import { useMemo } from "react";
import { addMinutes, differenceInMinutes, endOfDay, format, isSameDay, isToday, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEventRow } from "../hooks/useCalendarEvents";

interface Props {
  days: Date[];
  events: CalendarEventRow[];
  onSelectSlot: (day: Date, hour: number) => void;
  onSelectEvent: (event: CalendarEventRow) => void;
}

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function clampToDay(event: CalendarEventRow, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const start = new Date(Math.max(new Date(event.starts_at).getTime(), dayStart.getTime()));
  const end = new Date(Math.min(new Date(event.ends_at).getTime(), dayEnd.getTime()));
  return { start, end };
}

export function TimeGrid({ days, events, onSelectSlot, onSelectEvent }: Props) {
  const { timed, allDay } = useMemo(() => {
    const timed: CalendarEventRow[] = [];
    const allDay: CalendarEventRow[] = [];
    for (const e of events) (e.all_day ? allDay : timed).push(e);
    return { timed, allDay };
  }, [events]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header: weekday labels */}
      <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-2 py-2 text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{format(day, "EEE")}</div>
            <div
              className={cn(
                "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day strip */}
      {allDay.length > 0 ? (
        <div
          className="grid border-b bg-muted/20"
          style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="px-2 py-1 text-right text-[10px] uppercase tracking-wider text-muted-foreground">All day</div>
          {days.map((day) => {
            const forDay = allDay.filter((e) => isSameDay(new Date(e.starts_at), day));
            return (
              <div key={day.toISOString()} className="min-h-[28px] space-y-1 border-l p-1">
                {forDay.map((e) => (
                  <span
                    key={e.id}
                    onClick={() => onSelectEvent(e)}
                    className="block cursor-pointer truncate rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary"
                  >
                    {e.title}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Time grid body */}
      <div className="relative overflow-auto" style={{ maxHeight: `${HOUR_HEIGHT * 14}px` }}>
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
            height: `${HOUR_HEIGHT * 24}px`,
          }}
        >
          {/* Hour labels + grid lines column */}
          <div className="relative border-r">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: `${h * HOUR_HEIGHT}px` }}
              >
                {h === 0 ? "" : format(addMinutes(startOfDay(new Date()), h * 60), "HH:mm")}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={timed.filter((e) => overlapsDay(e, day))}
              onSelectSlot={onSelectSlot}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function overlapsDay(e: CalendarEventRow, day: Date) {
  const s = new Date(e.starts_at);
  const en = new Date(e.ends_at);
  return en >= startOfDay(day) && s <= endOfDay(day);
}

interface DayColumnProps {
  day: Date;
  events: CalendarEventRow[];
  onSelectSlot: (day: Date, hour: number) => void;
  onSelectEvent: (event: CalendarEventRow) => void;
}

function DayColumn({ day, events, onSelectSlot, onSelectEvent }: DayColumnProps) {
  return (
    <div className="relative border-r">
      {HOURS.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onSelectSlot(day, h)}
          className="absolute inset-x-0 border-t border-border/60 first:border-t-0 hover:bg-accent/30 focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring"
          style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
          aria-label={`Create event at ${String(h).padStart(2, "0")}:00 on ${format(day, "EEE d MMM")}`}
        />
      ))}
      {events.map((e) => {
        const { start, end } = clampToDay(e, day);
        const top = (start.getHours() * 60 + start.getMinutes()) * (HOUR_HEIGHT / 60);
        const heightMin = Math.max(differenceInMinutes(end, start), 20);
        const height = heightMin * (HOUR_HEIGHT / 60);
        return (
          <div
            key={e.id}
            onClick={(evt) => {
              evt.stopPropagation();
              onSelectEvent(e);
            }}
            className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-l-4 border-primary bg-primary/10 px-2 py-1 text-[11px] text-foreground hover:bg-primary/20"
            style={{ top: `${top}px`, height: `${height}px` }}
          >
            <div className="truncate font-medium">{e.title}</div>
            <div className="truncate text-muted-foreground">
              {format(new Date(e.starts_at), "HH:mm")}–{format(new Date(e.ends_at), "HH:mm")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
