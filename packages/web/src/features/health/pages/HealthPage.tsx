import { useMemo, useState } from "react";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { MetricChart } from "../components/MetricChart";
import { MetricEntries } from "../components/MetricEntries";
import { LogMetricDialog } from "../components/LogMetricDialog";
import {
  useDeleteMetric,
  useDistinctMetricTypes,
  useLogMetric,
  useMetrics,
  type HealthMetricRow,
} from "../hooks/useHealth";
import { KNOWN_METRICS, PREDEFINED_TYPES, configFor, formatValue } from "../metric-config";

type RangeDays = 7 | 30 | 90;
const rangeOptions: RangeDays[] = [7, 30, 90];

export function HealthPage() {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [type, setType] = useState<string>("weight_kg");
  const [logOpen, setLogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HealthMetricRow | null>(null);

  const distinctQ = useDistinctMetricTypes();
  const distinct = distinctQ.data ?? [];

  const tabs = useMemo(() => {
    const seen = new Set<string>(PREDEFINED_TYPES);
    distinct.forEach((t) => seen.add(t));
    return Array.from(seen);
  }, [distinct]);

  const range = useMemo(() => {
    const to = endOfDay(new Date());
    const from = startOfDay(addDays(to, -(rangeDays - 1)));
    return { from, to, fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [rangeDays]);

  const metricsQ = useMetrics(type, range.fromIso, range.toIso);
  const log = useLogMetric();
  const del = useDeleteMetric();

  const rows = metricsQ.data ?? [];
  const config = configFor(type);

  const latest = useMemo(() => {
    if (rows.length === 0) return null;
    const sorted = [...rows].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    return sorted[0]!;
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Health</h1>
          <p className="text-sm text-muted-foreground">Manual entry v1. Provider sync (Google Health / Fitbit) later.</p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <Plus className="h-4 w-4" /> Log
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1 text-sm">
          {tabs.map((t) => {
            const active = type === t;
            const label = KNOWN_METRICS[t]?.label ?? t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div role="tablist" className="ml-auto flex items-center rounded-lg bg-muted p-1 text-sm">
          {rangeOptions.map((d) => {
            const active = rangeDays === d;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={active}
                onClick={() => setRangeDays(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d}d
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest {config.label.toLowerCase()}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums md:text-3xl">
          {latest ? formatValue(config, latest.value) : "—"}
        </p>
        {latest ? (
          <p className="text-xs text-muted-foreground">
            {format(new Date(latest.recorded_at), "EEE, d MMM yyyy · HH:mm")}
          </p>
        ) : null}
      </div>

      <MetricChart metricType={type} rows={rows} fromDate={range.from} toDate={range.to} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent entries</h2>
        {metricsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <MetricEntries metricType={type} rows={rows} onDelete={(r) => setConfirmDelete(r)} />
        )}
      </section>

      <LogMetricDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        defaultType={type}
        extraTypes={distinct}
        submitting={log.isPending}
        onSubmit={async (values) => {
          await log.mutateAsync(values);
          setType(values.metric_type);
          setLogOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this entry?"
        description="Removes this single reading. Cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await del.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
