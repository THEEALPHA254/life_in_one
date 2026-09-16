import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { GoalRow } from "../hooks/useGoals";

interface Props {
  goals: GoalRow[];
  year: number;
}

export function GoalStats({ goals, year }: Props) {
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === "achieved").length;
    const inProgress = goals.filter((g) => g.status === "in_progress").length;
    const pending = goals.filter((g) => g.status === "pending").length;
    const abandoned = goals.filter((g) => g.status === "abandoned").length;
    const pct = total === 0 ? 0 : Math.round((achieved / total) * 100);
    return { total, achieved, inProgress, pending, abandoned, pct };
  }, [goals]);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{year} progress</p>
            <p className="text-3xl font-semibold tabular-nums">
              {stats.achieved} <span className="text-lg text-muted-foreground">of {stats.total}</span>
            </p>
          </div>
          <p className="text-sm font-medium tabular-nums">{stats.pct}%</p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.pct}%` }}
            role="progressbar"
            aria-valuenow={stats.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div className="grid grid-cols-4 gap-3 pt-2 text-center">
          <StatChip label="Pending" value={stats.pending} tone="muted" />
          <StatChip label="In progress" value={stats.inProgress} tone="primary" />
          <StatChip label="Achieved" value={stats.achieved} tone="success" />
          <StatChip label="Abandoned" value={stats.abandoned} tone="muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "muted" | "primary" | "success" }) {
  const tones = {
    muted: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-600 dark:text-emerald-400",
  } as const;
  return (
    <div className="rounded-md border p-2">
      <p className={`text-lg font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
