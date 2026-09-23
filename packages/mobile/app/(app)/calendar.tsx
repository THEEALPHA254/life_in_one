import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventFormModal } from "@/features/calendar/components/EventFormModal";
import { MonthView } from "@/features/calendar/components/MonthView";
import { WeekView } from "@/features/calendar/components/WeekView";
import {
  useCreateEvent,
  useDeleteEvent,
  useEventsInRange,
  useUpdateEvent,
  type CalendarEventRow,
} from "@/features/calendar/hooks/useCalendarEvents";
import {
  useGoogleCalendarAccount,
  useSyncGoogleCalendar,
} from "@/features/calendar/hooks/useGoogleCalendar";
import { useThemeColors } from "@/providers/ThemeProvider";

const AUTOSYNC_KEY = "lio.calendar.lastAutoSyncAt";
const AUTOSYNC_THROTTLE_MS = 5 * 60 * 1000;

type ViewMode = "agenda" | "week" | "month";

type Row =
  | { kind: "day-header"; date: Date }
  | { kind: "event"; event: CalendarEventRow };

export default function CalendarScreen() {
  const colors = useThemeColors();
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<CalendarEventRow | null>(null);
  const [initialStart, setInitialStart] = useState<Date | null>(null);

  // Range depends on view: agenda + month fetch the whole month; week fetches
  // the current 7-day window. Memoized so date isn't recomputed each render.
  const range = useMemo(() => {
    if (viewMode === "week") {
      const from = startOfWeek(cursor);
      const to = endOfWeek(cursor);
      return { fromIso: from.toISOString(), toIso: to.toISOString() };
    }
    const from = startOfMonth(cursor);
    const to = endOfMonth(cursor);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [viewMode, cursor]);

  const eventsQ = useEventsInRange(range.fromIso, range.toIso);
  const accountQ = useGoogleCalendarAccount();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const syncGoogle = useSyncGoogleCalendar();

  const connected = !!accountQ.data;

  useEffect(() => {
    if (!connected) return;
    (async () => {
      const last = await AsyncStorage.getItem(AUTOSYNC_KEY);
      const lastMs = last ? Number(last) : 0;
      if (Date.now() - lastMs < AUTOSYNC_THROTTLE_MS) return;
      await AsyncStorage.setItem(AUTOSYNC_KEY, String(Date.now()));
      syncGoogle.mutate({ silent: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const events = eventsQ.data ?? [];

  // Agenda list — either all events in range, or filtered to selectedDay when
  // the user tapped a specific day in month/week view.
  const visibleEvents = useMemo(() => {
    if (!selectedDay) return events;
    return events.filter((e) => isSameDay(new Date(e.starts_at), selectedDay));
  }, [events, selectedDay]);

  const rows: Row[] = useMemo(() => {
    const byDay = new Map<string, CalendarEventRow[]>();
    for (const e of visibleEvents) {
      const key = format(new Date(e.starts_at), "yyyy-MM-dd");
      const arr = byDay.get(key) ?? [];
      arr.push(e);
      byDay.set(key, arr);
    }
    const dayKeys = [...byDay.keys()].sort();
    const out: Row[] = [];
    for (const k of dayKeys) {
      const date = new Date(k + "T00:00:00");
      out.push({ kind: "day-header", date });
      const arr = byDay.get(k)!.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      for (const ev of arr) out.push({ kind: "event", event: ev });
    }
    return out;
  }, [visibleEvents]);

  const openCreate = (start?: Date) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(null);
    setInitialStart(start ?? selectedDay ?? new Date());
    setFormVisible(true);
  };
  const openEdit = (event: CalendarEventRow) => {
    setEditing(event);
    setInitialStart(null);
    setFormVisible(true);
  };

  const stepCursor = (dir: 1 | -1) => {
    if (viewMode === "week") setCursor(addWeeks(cursor, dir));
    else setCursor(addMonths(cursor, dir));
    setSelectedDay(null);
  };

  const cursorLabel = viewMode === "week"
    ? `${format(startOfWeek(cursor), "d MMM")} – ${format(endOfWeek(cursor), "d MMM yyyy")}`
    : format(cursor, "MMMM yyyy");

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader
        title="Calendar"
        subtitle="Agenda, week, or month."
        right={
          connected ? (
            <Pressable
              onPress={() => syncGoogle.mutate({})}
              disabled={syncGoogle.isPending}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "#eef2ff" }}
              accessibilityLabel="Sync Google Calendar"
            >
              {syncGoogle.isPending ? (
                <ActivityIndicator size="small" color="#4338ca" />
              ) : (
                <RefreshCw size={16} color="#4338ca" />
              )}
            </Pressable>
          ) : undefined
        }
      />

      <View className="px-5 pb-3 gap-2">
        <View className="flex-row gap-2">
          {(["agenda", "week", "month"] as ViewMode[]).map((v) => {
            const active = viewMode === v;
            return (
              <Pressable
                key={v}
                onPress={() => {
                  setViewMode(v);
                  setSelectedDay(null);
                }}
                className="flex-1 items-center rounded-full py-2"
                style={{
                  backgroundColor: active ? "#6366f1" : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? "#6366f1" : colors.border,
                }}
              >
                <Text
                  style={{
                    color: active ? colors.surface : colors.mutedForeground,
                    fontSize: 12,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {v}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => stepCursor(-1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronLeft size={16} color={colors.foreground2} />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-[15px] font-semibold text-foreground">{cursorLabel}</Text>
          </View>
          <Pressable
            onPress={() => stepCursor(1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronRight size={16} color={colors.foreground2} />
          </Pressable>
          <Pressable
            onPress={() => {
              setCursor(new Date());
              setSelectedDay(null);
            }}
            className="h-10 items-center justify-center rounded-full px-4"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Text style={{ color: "#4338ca", fontSize: 13, fontWeight: "600" }}>Today</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, i) =>
          r.kind === "event" ? r.event.id : `h-${r.date.toISOString().slice(0, 10)}-${i}`
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 140 }}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          viewMode !== "agenda" ? (
            <View className="mb-4">
              {viewMode === "week" ? (
                <WeekView
                  cursor={cursor}
                  selected={selectedDay}
                  events={events}
                  onSelectDay={(d) => setSelectedDay((cur) => (cur && isSameDay(cur, d) ? null : d))}
                />
              ) : (
                <MonthView
                  cursor={cursor}
                  selected={selectedDay}
                  events={events}
                  onSelectDay={(d) => setSelectedDay((cur) => (cur && isSameDay(cur, d) ? null : d))}
                  onCreateOnDay={(d) => openCreate(d)}
                />
              )}
              <View className="mt-4 flex-row items-center gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {selectedDay ? format(selectedDay, "EEE, d MMM") : "All events"}
                </Text>
                {selectedDay ? (
                  <Pressable onPress={() => setSelectedDay(null)}>
                    <Text style={{ color: "#4338ca", fontSize: 11, fontWeight: "600" }}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          eventsQ.isLoading ? (
            <Text className="mt-8 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-4">
              <EmptyState
                emoji="🗓️"
                title={selectedDay ? "Nothing this day" : "Nothing on the calendar"}
                subtitle={
                  selectedDay
                    ? "Tap the + to add an event on this day."
                    : connected
                      ? "Your Google events will show up here after the next sync."
                      : "Add local events, or connect Google Calendar on web to sync."
                }
                ctaLabel="Add event"
                onCta={() => openCreate()}
              />
            </View>
          )
        }
        renderItem={({ item }) =>
          item.kind === "day-header" ? (
            <View className="mb-1 mt-4 flex-row items-center gap-2">
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isSameDay(item.date, new Date()) ? "#6366f1" : "#cbd5e1" }}
              />
              <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                {format(item.date, "EEE, d MMM")}
              </Text>
            </View>
          ) : (
            <EventRow event={item.event} onPress={() => openEdit(item.event)} />
          )
        }
      />

      <Pressable
        onPress={() => openCreate()}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#6366f1",
          shadowColor: "#6366f1",
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
        accessibilityLabel="New event"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <EventFormModal
        visible={formVisible}
        editing={editing}
        initialStart={initialStart}
        submitting={createEvent.isPending || updateEvent.isPending || deleteEvent.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (values) => {
          if (editing) {
            await updateEvent.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createEvent.mutateAsync(values);
          }
          setFormVisible(false);
        }}
        onDelete={
          editing
            ? async () => {
                await deleteEvent.mutateAsync(editing.id);
                setFormVisible(false);
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function EventRow({ event, onPress }: { event: CalendarEventRow; onPress: () => void }) {
  const colors = useThemeColors();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  const timeLabel = event.all_day ? "All day" : `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  const isGoogle = !!event.external_id;
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl bg-surface p-4"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2">
        <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
          {event.title}
        </Text>
        {isGoogle ? (
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#eef2ff" }}>
            <Text style={{ color: "#4338ca", fontSize: 10, fontWeight: "600" }}>Google</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ marginTop: 4, color: colors.mutedForeground, fontSize: 12 }}>{timeLabel}</Text>
      {event.location ? (
        <Text style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
          📍 {event.location}
        </Text>
      ) : null}
      {event.description ? (
        <Text numberOfLines={2} style={{ marginTop: 4, color: colors.mutedForeground, fontSize: 12 }}>
          {event.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

function ItemGap() {
  return <View style={{ height: 10 }} />;
}
