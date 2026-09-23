import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import { Plus, Trash2 } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import { MetricChart } from "@/features/health/components/MetricChart";
import { LogMetricModal } from "@/features/health/components/LogMetricModal";
import {
  useDeleteMetric,
  useDistinctMetricTypes,
  useLogMetric,
  useMetrics,
  type HealthMetricRow,
} from "@/features/health/hooks/useHealth";
import { PREDEFINED_TYPES, configFor, formatValue } from "@/features/health/metric-config";
import { useThemeColors } from "@/providers/ThemeProvider";

const RANGES = [
  { key: "7", label: "7d", days: 7 },
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
] as const;

export default function HealthScreen() {
  const colors = useThemeColors();
  const [metricType, setMetricType] = useState<string>(PREDEFINED_TYPES[0]!);
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]["key"]>("30");
  const [formVisible, setFormVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HealthMetricRow | null>(null);

  const range = RANGES.find((r) => r.key === rangeKey)!;

  // MUST memoize — `new Date()` in render body produces a fresh timestamp
  // every render, which changes the query key and causes infinite refetch.
  const { fromDate, toDate, fromIso, toIso } = useMemo(() => {
    const to = new Date();
    const from = addDays(to, -(range.days - 1));
    return { fromDate: from, toDate: to, fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [range.days]);

  const rowsQ = useMetrics(metricType, fromIso, toIso);
  const typesQ = useDistinctMetricTypes();
  const log = useLogMetric();
  const del = useDeleteMetric();

  const rows = rowsQ.data ?? [];
  const config = configFor(metricType);

  const allTypes = useMemo(() => {
    const known = new Set(PREDEFINED_TYPES);
    const extras = (typesQ.data ?? []).filter((t) => !known.has(t));
    return [...PREDEFINED_TYPES, ...extras];
  }, [typesQ.data]);

  const latest = rows[rows.length - 1] ?? null;
  const summaryValue = useMemo(() => {
    if (rows.length === 0) return null;
    if (config.aggregation === "sum") return rows.reduce((s, r) => s + r.value, 0);
    if (config.aggregation === "avg") return rows.reduce((s, r) => s + r.value, 0) / rows.length;
    return latest?.value ?? null;
  }, [rows, config, latest]);

  const openLog = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFormVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Health" subtitle="Manual metrics + trends." />

      <View className="px-5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {allTypes.map((t) => {
            const active = metricType === t;
            const c = configFor(t);
            return (
              <Pressable
                key={t}
                onPress={() => setMetricType(t)}
                className="rounded-full px-3.5 py-2"
                style={{
                  borderWidth: 1,
                  borderColor: active ? "#6366f1" : colors.border,
                  backgroundColor: active ? "#eef2ff" : colors.surface,
                }}
              >
                <Text style={{ color: active ? "#4338ca" : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-2 flex-row gap-2">
          {RANGES.map((r) => {
            const active = rangeKey === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRangeKey(r.key)}
                className="flex-1 items-center rounded-full py-2"
                style={{
                  backgroundColor: active ? "#6366f1" : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? "#6366f1" : colors.border,
                }}
              >
                <Text style={{ color: active ? colors.surface : colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={rows.slice().reverse()}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 10 }}
        ListHeaderComponent={
          <View className="gap-3 pb-2">
            <View className="rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {config.aggregation === "sum" ? `Total ${range.label}` : config.aggregation === "avg" ? `Average ${range.label}` : "Latest"}
              </Text>
              <Text style={{ marginTop: 4, color: colors.foreground, fontSize: 26, fontWeight: "700" }}>
                {summaryValue !== null ? formatValue(config, summaryValue) : "—"}
              </Text>
              {latest ? (
                <Text style={{ marginTop: 4, color: colors.mutedForeground, fontSize: 12 }}>
                  Last logged {format(new Date(latest.recorded_at), "EEE, d MMM · HH:mm")}
                </Text>
              ) : null}
            </View>

            <MetricChart metricType={metricType} rows={rows} fromDate={fromDate} toDate={toDate} />

            <View className="mt-2 flex-row items-center gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Entries
              </Text>
              <Text className="text-[12px] font-medium text-muted-foreground">· {rows.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          rowsQ.isLoading ? (
            <Text className="mt-4 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-2">
              <EmptyState
                emoji="🩺"
                title="No entries in this range"
                subtitle={`Log a ${config.label.toLowerCase()} value to see it here.`}
                ctaLabel="Log metric"
                onCta={openLog}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View
            className="flex-row items-center gap-3 rounded-xl bg-surface p-4"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-1">
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>
                {formatValue(config, item.value)}
              </Text>
              <Text style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 12 }}>
                {format(new Date(item.recorded_at), "EEE, d MMM · HH:mm")}
              </Text>
            </View>
            <Pressable
              onPress={() => setConfirmDelete(item)}
              hitSlop={6}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.destructiveSoft }}
            >
              <Trash2 size={14} color="#ef4444" />
            </Pressable>
          </View>
        )}
      />

      <Pressable
        onPress={openLog}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#6366f1",
          shadowColor: "#6366f1",
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
        accessibilityLabel="Log metric"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <LogMetricModal
        visible={formVisible}
        defaultType={metricType}
        existingCustomTypes={typesQ.data ?? []}
        submitting={log.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (values) => {
          await log.mutateAsync(values);
          if (values.metric_type !== metricType) setMetricType(values.metric_type);
          setFormVisible(false);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete entry?"
        description={
          confirmDelete
            ? `${formatValue(config, confirmDelete.value)} at ${format(new Date(confirmDelete.recorded_at), "d MMM HH:mm")} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await del.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </SafeAreaView>
  );
}
