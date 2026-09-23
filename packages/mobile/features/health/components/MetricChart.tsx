import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { addDays, differenceInCalendarDays, format, isSameDay, startOfDay } from "date-fns";
import { configFor, formatValue, type MetricConfig } from "../metric-config";
import type { HealthMetricRow } from "../hooks/useHealth";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  metricType: string;
  rows: HealthMetricRow[];
  fromDate: Date;
  toDate: Date;
}

interface Point {
  dateKey: string;
  label: string;
  value: number | null;
}

function aggregateDaily(rows: HealthMetricRow[], config: MetricConfig, from: Date, to: Date): Point[] {
  const spanDays = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const points: Point[] = [];
  for (let i = 0; i < spanDays; i++) {
    const day = addDays(from, i);
    const dayRows = rows
      .filter((r) => isSameDay(new Date(r.recorded_at), day))
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    let value: number | null = null;
    if (dayRows.length > 0) {
      if (config.aggregation === "sum") value = dayRows.reduce((s, r) => s + r.value, 0);
      else if (config.aggregation === "avg") value = dayRows.reduce((s, r) => s + r.value, 0) / dayRows.length;
      else value = dayRows[dayRows.length - 1]!.value;
    }
    points.push({
      dateKey: format(day, "yyyy-MM-dd"),
      label: format(day, spanDays <= 14 ? "EEE d" : "d MMM"),
      value,
    });
  }
  return points;
}

export function MetricChart({ metricType, rows, fromDate, toDate }: Props) {
  const colors = useThemeColors();
  const config = configFor(metricType);
  const points = useMemo(
    () => aggregateDaily(rows, config, startOfDay(fromDate), startOfDay(toDate)),
    [rows, config, fromDate, toDate],
  );
  const hasAny = points.some((p) => p.value !== null);

  // Every N-th tick gets a label to keep the axis readable on narrow phones.
  const labelStride = Math.max(1, Math.ceil(points.length / 7));

  const data = useMemo(
    () =>
      points.map((p, i) => ({
        value: p.value === null ? 0 : p.value * (config.displayFactor ?? 1),
        label: i % labelStride === 0 ? p.label : "",
        dataPointText:
          p.value === null
            ? ""
            : formatValue(config, p.value),
        hideDataPoint: p.value === null,
      })),
    [points, config, labelStride],
  );

  const chartWidth = Dimensions.get("window").width - 80;

  return (
    <View className="rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="text-[13px] font-semibold text-foreground">{config.label} trend</Text>
        <Text className="text-[11px] text-muted-foreground">
          {format(fromDate, "d MMM")} – {format(toDate, "d MMM yyyy")}
        </Text>
      </View>
      {!hasAny ? (
        <Text className="py-8 text-center text-sm text-muted-foreground">No data in this range.</Text>
      ) : (
        <LineChart
          data={data}
          width={chartWidth}
          height={180}
          color="#6366f1"
          thickness={2}
          hideDataPoints={false}
          dataPointsColor="#6366f1"
          dataPointsRadius={3}
          yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
          rulesColor={colors.muted}
          rulesType="solid"
          initialSpacing={10}
          spacing={Math.max(20, chartWidth / Math.max(2, data.length))}
          noOfSections={4}
          curved
          isAnimated={false}
          areaChart
          startFillColor="#6366f1"
          endFillColor={colors.surface}
          startOpacity={0.2}
          endOpacity={0}
        />
      )}
    </View>
  );
}
