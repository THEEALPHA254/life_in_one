import { format, isPast, isToday } from "date-fns";
import { Trash2, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./PriorityBadge";
import type { TaskRow, TaskCategoryRow } from "../hooks/useTasks";

interface Props {
  task: TaskRow;
  categories: TaskCategoryRow[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
}

export function TaskItem({ task, categories, onToggle, onEdit, onDelete }: Props) {
  const done = !!task.completed_at;
  const category = task.category_id ? categories.find((c) => c.id === task.category_id) : undefined;

  const dueLabel = task.due_at ? format(new Date(task.due_at), "EEE, d MMM · HH:mm") : null;
  const dueOverdue = !!task.due_at && !done && isPast(new Date(task.due_at)) && !isToday(new Date(task.due_at));
  const dueToday = !!task.due_at && !done && isToday(new Date(task.due_at));

  return (
    <li className="group flex items-start gap-3 rounded-lg border bg-card px-3 py-3 transition-colors hover:border-primary/40">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        aria-label={done ? "Mark as not done" : "Mark as done"}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</p>
        {task.description ? (
          <p className={cn("line-clamp-2 text-xs text-muted-foreground", done && "line-through")}>{task.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <PriorityBadge priority={task.priority} />
          {dueLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                dueOverdue && "bg-destructive/10 text-destructive",
                dueToday && "bg-primary/10 text-primary",
                !dueOverdue && !dueToday && "bg-muted text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" aria-hidden />
              {dueLabel}
            </span>
          ) : null}
          {category ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
              style={{
                backgroundColor: (category.color ?? "#94a3b8") + "22",
                color: category.color ?? "#475569",
              }}
            >
              {category.name}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(task)} aria-label="Delete task">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
