import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { GoalStatus } from "@lio/core/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { GoalStats } from "../components/GoalStats";
import { GoalItem } from "../components/GoalItem";
import { GoalFormDialog } from "../components/GoalFormDialog";
import {
  useChangeGoalStatus,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
  type GoalRow,
} from "../hooks/useGoals";

type Filter = "all" | "active" | "achieved" | "abandoned";
const filters: { value: Filter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "achieved", label: "Achieved" },
  { value: "abandoned", label: "Abandoned" },
  { value: "all", label: "All" },
];

export function GoalsPage() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [filter, setFilter] = useState<Filter>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GoalRow | null>(null);

  const goalsQ = useGoals(year);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const changeStatus = useChangeGoalStatus();
  const deleteGoal = useDeleteGoal();

  const goals = goalsQ.data ?? [];

  const filtered = useMemo(() => {
    return goals.filter((g) => {
      if (filter === "all") return true;
      if (filter === "active") return g.status === "pending" || g.status === "in_progress";
      return g.status === filter;
    });
  }, [goals, filter]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: GoalRow) => {
    setEditing(g);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Goals</h1>
          <p className="text-sm text-muted-foreground">Yearly ambitions — track what you're going after.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[5rem] text-center text-sm font-medium tabular-nums">{year}</div>
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setYear(new Date().getFullYear())} disabled={year === new Date().getFullYear()}>
            This year
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New goal
          </Button>
        </div>
      </header>

      <GoalStats goals={goals} year={year} />

      <div role="tablist" className="flex flex-wrap items-center rounded-lg bg-muted p-1 text-sm w-fit">
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {goalsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {goals.length === 0 ? (
            <>
              No goals for {year} yet.{" "}
              <button className="font-medium text-primary hover:underline" onClick={openCreate}>
                Set your first one
              </button>
              .
            </>
          ) : (
            "Nothing here in this filter."
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => (
            <GoalItem
              key={g.id}
              goal={g}
              onEdit={openEdit}
              onDelete={(goal) => setConfirmDelete(goal)}
              onChangeStatus={(goal, status: GoalStatus) => changeStatus.mutate({ id: goal.id, status })}
            />
          ))}
        </ul>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        defaultYear={year}
        submitting={createGoal.isPending || updateGoal.isPending}
        onSubmit={async (values) => {
          if (editing) {
            await updateGoal.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createGoal.mutateAsync(values);
            if (values.year !== year) setYear(values.year);
          }
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete goal?"
        description={confirmDelete ? `"${confirmDelete.title}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        destructive
        pending={deleteGoal.isPending}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteGoal.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
