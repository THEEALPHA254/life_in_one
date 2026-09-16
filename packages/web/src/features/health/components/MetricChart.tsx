import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, differenceInCalendarDays, format, isSameDay, startOfDay } from "date-fns";
import { configFor, formatValue, type MetricConfig } from "../metric-config";
import type { HealthMetricRow } from "../hooks/useHealth";

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
      if (config.aggregation === "sum") {
        value = dayRows.reduce((s, r) => s + r.value, 0);
      } else if (config.aggregation === "avg") {
        value = dayRows.reduce((s, r) => s + r.value, 0) / dayRows.length;
      } else {
        value = dayRows[dayRows.length - 1]!.value;
      }
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
  const config = configFor(metricType);
  const points = useMemo(() => aggregateDaily(rows, config, startOfDay(fromDate), startOfDay(toDate)), [rows, config, fromDate, toDate]);

  const hasAny = points.some((p) => p.value !== null);
  const displayFactor = config.displayFactor ?? 1;
  const displayed = points.map((p) => ({ ...p, displayed: p.value === null ? null : p.value * displayFactor }));

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{config.label} trend</h3>
        <span className="text-xs text-muted-foreground">
          {format(fromDate, "d MMM")} – {format(toDate, "d MMM yyyy")}
        </span>
      </div>
      {!hasAny ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No data in this range.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayed} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip
                formatter={(v: number) =>
                  typeof v === "number" ? formatValue(config, v / (config.displayFactor ?? 1)) : String(v)
                }
              />
              <Line
                type="monotone"
                dataKey="displayed"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
