import { useMemo } from "react";
import { Target } from "lucide-react";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

export function GoalsWidget() {
  const year = new Date().getFullYear();
  const q = useGoals(year);
  const goals = q.data ?? [];

  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === "achieved").length;
    const active = goals.filter((g) => g.status === "pending" || g.status === "in_progress").length;
    const pct = total === 0 ? 0 : Math.round((achieved / total) * 100);
    return { total, achieved, active, pct };
  }, [goals]);

  return (
    <WidgetCard to="/goals" title={`Goals · ${year}`} icon={Target}>
      {stats.total === 0 ? (
        <WidgetEmpty text="No goals set for this year." />
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {stats.achieved} <span className="text-sm text-muted-foreground">of {stats.total}</span>
            </p>
            <p className="text-xs text-muted-foreground">achieved · {stats.pct}%</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${stats.pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{stats.active} active</p>
        </>
      )}
    </WidgetCard>
  );
}
