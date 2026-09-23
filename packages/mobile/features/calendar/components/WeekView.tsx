import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEventRow } from "../hooks/useCalendarEvents";
import { useThemeColors } from "@/providers/ThemeProvider";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  cursor: Date;
  selected: Date | null;
  events: CalendarEventRow[];
  onSelectDay: (day: Date) => void;
}

export function WeekView({ cursor, selected, events, onSelectDay }: Props) {
  const colors = useThemeColors();
  const weekStart = startOfWeek(cursor);
  const weekEnd = endOfWeek(cursor);
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>();
    for (const e of events) {
      const key = format(new Date(e.starts_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const today = new Date();

  return (
    <View className="flex-row gap-1.5">
      {days.map((day, i) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDay.get(key) ?? [];
        const isSelected = !!selected && isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        const inMonth = isSameMonth(day, cursor);

        return (
          <Pressable
            key={key}
            onPress={() => onSelectDay(day)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 4,
              borderRadius: 12,
              backgroundColor: isSelected ? "#6366f1" : colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? "#6366f1" : isToday ? "#c7d2fe" : colors.border,
              opacity: inMonth ? 1 : 0.5,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                color: isSelected ? "rgba(255,255,255,0.75)" : colors.mutedForeground,
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {DOW[i]!.slice(0, 3)}
            </Text>
            <Text
              style={{
                color: isSelected ? colors.surface : isToday ? "#4338ca" : colors.foreground,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              {format(day, "d")}
            </Text>
            {dayEvents.length > 0 ? (
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#eef2ff" }}
              >
                <Text
                  style={{
                    color: isSelected ? colors.surface : "#4338ca",
                    fontSize: 9,
                    fontWeight: "700",
                  }}
                >
                  {dayEvents.length}
                </Text>
              </View>
            ) : (
              <View style={{ height: 14 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
