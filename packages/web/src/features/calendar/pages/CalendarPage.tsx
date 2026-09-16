import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarToolbar, type CalendarView } from "../components/CalendarToolbar";
import { MonthView } from "../components/MonthView";
import { TimeGrid } from "../components/TimeGrid";
import { EventFormDialog } from "../components/EventFormDialog";
import {
  useCreateEvent,
  useDeleteEvent,
  useEventsInRange,
  useUpdateEvent,
  type CalendarEventRow,
} from "../hooks/useCalendarEvents";

function rangeFor(view: CalendarView, cursor: Date) {
  if (view === "month") {
    return {
      from: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
      to: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    };
  }
  if (view === "week") {
    return {
      from: startOfWeek(cursor, { weekStartsOn: 1 }),
      to: endOfWeek(cursor, { weekStartsOn: 1 }),
    };
  }
  return { from: startOfDay(cursor), to: endOfDay(cursor) };
}

function titleFor(view: CalendarView, cursor: Date) {
  if (view === "month") return format(cursor, "LLLL yyyy");
  if (view === "week") {
    const from = startOfWeek(cursor, { weekStartsOn: 1 });
    const to = endOfWeek(cursor, { weekStartsOn: 1 });
    return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
  }
  return format(cursor, "EEEE, d LLLL yyyy");
}

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventRow | null>(null);
  const [initialStart, setInitialStart] = useState<Date | null>(null);

  const range = useMemo(() => rangeFor(view, cursor), [view, cursor]);
  const eventsQ = useEventsInRange(range.from.toISOString(), range.to.toISOString());
  const events = eventsQ.data ?? [];

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const openCreate = (start?: Date) => {
    setEditing(null);
    setInitialStart(start ?? null);
    setFormOpen(true);
  };
  const openEdit = (event: CalendarEventRow) => {
    setEditing(event);
    setInitialStart(null);
    setFormOpen(true);
  };

  const move = (dir: -1 | 1) => {
    setCursor((c) => {
      if (view === "month") return addMonths(c, dir);
      if (view === "week") return addWeeks(c, dir);
      return addDays(c, dir);
    });
  };

  const days = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(s, i));
    }
    if (view === "day") return [startOfDay(cursor)];
    return [];
  }, [view, cursor]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Calendar</h1>
        <p className="text-sm text-muted-foreground">Month, week, day — click any empty spot to add.</p>
      </header>

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        title={titleFor(view, cursor)}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onToday={() => setCursor(new Date())}
        onNew={() => openCreate()}
      />

      {eventsQ.isLoading && !eventsQ.data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : view === "month" ? (
        <MonthView
          cursor={cursor}
          events={events}
          onSelectDay={(day) => {
            const start = new Date(day);
            start.setHours(9, 0, 0, 0);
            openCreate(start);
          }}
          onSelectEvent={openEdit}
        />
      ) : (
        <TimeGrid
          days={days}
          events={events}
          onSelectSlot={(day, hour) => {
            const start = new Date(day);
            start.setHours(hour, 0, 0, 0);
            openCreate(start);
          }}
          onSelectEvent={openEdit}
        />
      )}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        initialStart={initialStart}
        submitting={createEvent.isPending || updateEvent.isPending}
        onSubmit={async (values) => {
          if (editing) {
            await updateEvent.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createEvent.mutateAsync(values);
          }
          setFormOpen(false);
        }}
        onDelete={
          editing
            ? async () => {
                if (!editing) return;
                await deleteEvent.mutateAsync(editing.id);
                setFormOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
