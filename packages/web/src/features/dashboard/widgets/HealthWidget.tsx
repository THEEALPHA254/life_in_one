import { useMemo } from "react";
import { Heart } from "lucide-react";
import { addDays, format, startOfDay } from "date-fns";
import { useMetrics } from "@/features/health/hooks/useHealth";
import { configFor, formatValue } from "@/features/health/metric-config";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

export function HealthWidget() {
  const to = new Date();
  const from = startOfDay(addDays(to, -6));
  const stepsQ = useMetrics("steps", from.toISOString(), to.toISOString());
  const weightQ = useMetrics("weight_kg", from.toISOString(), to.toISOString());

  const stepsRows = stepsQ.data ?? [];
  const weightRows = weightQ.data ?? [];

  const stats = useMemo(() => {
    const stepsToday = stepsRows
      .filter((r) => format(new Date(r.recorded_at), "yyyy-MM-dd") === format(to, "yyyy-MM-dd"))
      .reduce((s, r) => s + r.value, 0);
    const latestWeight = [...weightRows].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0] ?? null;
    return { stepsToday, latestWeight };
  }, [stepsRows, weightRows, to]);

  const stepsConfig = configFor("steps");
  const weightConfig = configFor("weight_kg");

  if (stepsRows.length === 0 && weightRows.length === 0) {
    return (
      <WidgetCard to="/health" title="Health" icon={Heart}>
        <WidgetEmpty text="Log a metric to see it here." />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard to="/health" title="Health" icon={Heart}>
      {stepsRows.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground">Steps today</p>
          <p className="text-2xl font-semibold tabular-nums">{formatValue(stepsConfig, stats.stepsToday)}</p>
        </div>
      ) : null}
      {stats.latestWeight ? (
        <div>
          <p className="text-xs text-muted-foreground">Latest weight</p>
          <p className="text-sm font-medium">
            {formatValue(weightConfig, stats.latestWeight.value)}
            <span className="ml-2 text-xs text-muted-foreground">
              {format(new Date(stats.latestWeight.recorded_at), "d MMM")}
            </span>
          </p>
        </div>
      ) : null}
    </WidgetCard>
  );
}
