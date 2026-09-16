import { useMemo } from "react";
import { CheckSquare } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

export function TodayTasksWidget() {
  const q = useTasks();
  const tasks = q.data ?? [];

  const buckets = useMemo(() => {
    const active = tasks.filter((t) => !t.completed_at);
    const overdue = active.filter((t) => t.due_at && isPast(new Date(t.due_at)) && !isToday(new Date(t.due_at)));
    const today = active.filter((t) => t.due_at && isToday(new Date(t.due_at)));
    return { active: active.length, overdue: overdue.length, today, sample: today.slice(0, 3) };
  }, [tasks]);

  return (
    <WidgetCard to="/tasks" title="Tasks" icon={CheckSquare}>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-semibold tabular-nums">{buckets.today.length}</p>
        <p className="text-xs text-muted-foreground">due today · {buckets.active} active</p>
      </div>
      {buckets.overdue > 0 ? (
        <p className="text-xs text-destructive">{buckets.overdue} overdue</p>
      ) : null}
      {buckets.sample.length > 0 ? (
        <ul className="space-y-1 pt-1">
          {buckets.sample.map((t) => (
            <li key={t.id} className="truncate text-xs">
              <span className="text-muted-foreground">{format(new Date(t.due_at!), "HH:mm")}</span>{" "}
              <span>{t.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <WidgetEmpty text="Nothing due today." />
      )}
    </WidgetCard>
  );
}
