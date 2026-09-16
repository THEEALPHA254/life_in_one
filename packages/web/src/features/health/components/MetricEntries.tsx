import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { configFor, formatValue } from "../metric-config";
import type { HealthMetricRow } from "../hooks/useHealth";

interface Props {
  metricType: string;
  rows: HealthMetricRow[];
  onDelete: (row: HealthMetricRow) => void;
}

export function MetricEntries({ metricType, rows, onDelete }: Props) {
  const config = configFor(metricType);
  const sorted = [...rows].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No entries yet for {config.label.toLowerCase()}.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {sorted.map((r) => (
        <li key={r.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium tabular-nums">{formatValue(config, r.value)}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(r.recorded_at), "EEE, d MMM yyyy · HH:mm")}
              {r.source !== "manual" ? ` · ${r.source}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(r)} aria-label="Delete entry">
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
