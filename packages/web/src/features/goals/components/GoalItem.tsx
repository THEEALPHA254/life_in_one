import { format, differenceInCalendarDays } from "date-fns";
import { Check, CircleDot, Pencil, Trash2, Undo2, XCircle } from "lucide-react";
import type { GoalStatus } from "@lio/core/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoalRow } from "../hooks/useGoals";

interface Props {
  goal: GoalRow;
  onEdit: (goal: GoalRow) => void;
  onDelete: (goal: GoalRow) => void;
  onChangeStatus: (goal: GoalRow, status: GoalStatus) => void;
}

const statusStyles: Record<GoalStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  achieved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  abandoned: "bg-muted text-muted-foreground line-through",
};

const statusLabel: Record<GoalStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  achieved: "Achieved",
  abandoned: "Abandoned",
};

function targetLabel(target: string | null, status: GoalStatus): { text: string; tone: "muted" | "warn" | "success" } | null {
  if (!target) return null;
  const date = new Date(target + "T00:00:00");
  const days = differenceInCalendarDays(date, new Date());
  const base = format(date, "d MMM yyyy");
  if (status === "achieved") return { text: `Done · ${base}`, tone: "success" };
  if (days < 0) return { text: `Overdue by ${Math.abs(days)}d · ${base}`, tone: "warn" };
  if (days === 0) return { text: `Due today · ${base}`, tone: "warn" };
  if (days <= 14) return { text: `In ${days}d · ${base}`, tone: "warn" };
  return { text: base, tone: "muted" };
}

export function GoalItem({ goal, onEdit, onDelete, onChangeStatus }: Props) {
  const done = goal.status === "achieved";
  const target = targetLabel(goal.target_date, goal.status);
  return (
    <li className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground")}>{goal.title}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyles[goal.status])}>
            {statusLabel[goal.status]}
          </span>
        </div>
        {goal.description ? (
          <p className={cn("line-clamp-2 text-xs text-muted-foreground", done && "line-through")}>{goal.description}</p>
        ) : null}
        {target ? (
          <p
            className={cn(
              "text-[11px]",
              target.tone === "warn" && "text-destructive",
              target.tone === "success" && "text-emerald-600 dark:text-emerald-400",
              target.tone === "muted" && "text-muted-foreground",
            )}
          >
            {target.text}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:opacity-100">
        {goal.status === "achieved" ? (
          <Button variant="ghost" size="icon" onClick={() => onChangeStatus(goal, "in_progress")} aria-label="Mark as in progress">
            <Undo2 className="h-4 w-4" />
          </Button>
        ) : (
          <>
            {goal.status !== "in_progress" ? (
              <Button variant="ghost" size="icon" onClick={() => onChangeStatus(goal, "in_progress")} aria-label="Mark as in progress">
                <CircleDot className="h-4 w-4" />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={() => onChangeStatus(goal, "achieved")} aria-label="Mark as achieved">
              <Check className="h-4 w-4" />
            </Button>
            {goal.status !== "abandoned" ? (
              <Button variant="ghost" size="icon" onClick={() => onChangeStatus(goal, "abandoned")} aria-label="Abandon">
                <XCircle className="h-4 w-4" />
              </Button>
            ) : null}
          </>
        )}
        <Button variant="ghost" size="icon" onClick={() => onEdit(goal)} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(goal)} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
