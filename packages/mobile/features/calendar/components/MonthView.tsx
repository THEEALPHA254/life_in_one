import { useMemo } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
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
  onCreateOnDay: (day: Date) => void;
}

export function MonthView({ cursor, selected, events, onSelectDay, onCreateOnDay }: Props) {
  const colors = useThemeColors();
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

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

  const cellSize = (Dimensions.get("window").width - 40 - 6 * 4) / 7; // 20px page padding both sides + 4px gap between cells

  const today = new Date();

  return (
    <View className="gap-2">
      <View className="flex-row">
        {DOW.map((d) => (
          <View key={d} style={{ flex: 1 }} className="items-center">
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isSelected = !!selected && isSameDay(day, selected);
          const isToday = isSameDay(day, today);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDay(day)}
              onLongPress={() => onCreateOnDay(day)}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 10,
                padding: 4,
                backgroundColor: isSelected ? "#6366f1" : colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? "#6366f1" : isToday ? "#c7d2fe" : colors.border,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <Text
                style={{
                  color: isSelected ? colors.surface : isToday ? "#4338ca" : colors.foreground,
                  fontSize: 12,
                  fontWeight: isToday || isSelected ? "700" : "500",
                }}
              >
                {format(day, "d")}
              </Text>
              <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                  {dayEvents.slice(0, 3).map((e) => (
                    <View
                      key={e.id}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: isSelected
                          ? colors.surface
                          : e.external_id
                            ? "#4338ca"
                            : "#10b981",
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 ? (
                    <Text
                      style={{
                        color: isSelected ? colors.surface : colors.mutedForeground,
                        fontSize: 8,
                        fontWeight: "700",
                      }}
                    >
                      +{dayEvents.length - 3}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-1 text-[11px] text-muted-foreground">
        Tap a day to see its events · long-press to add one
      </Text>
    </View>
  );
}
