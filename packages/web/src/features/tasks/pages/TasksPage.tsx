import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { isPast, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  useTasks,
  useTaskCategories,
  useCreateTask,
  useUpdateTask,
  useToggleTaskComplete,
  useDeleteTask,
  type TaskRow,
} from "../hooks/useTasks";
import { TaskFilters, type StatusFilter } from "../components/TaskFilters";
import { TaskItem } from "../components/TaskItem";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Bucket = "Overdue" | "Today" | "Tomorrow" | "This week" | "Later" | "No date";
const bucketOrder: Bucket[] = ["Overdue", "Today", "Tomorrow", "This week", "Later", "No date"];

function bucketFor(t: TaskRow): Bucket {
  if (!t.due_at) return "No date";
  const d = new Date(t.due_at);
  if (isToday(d)) return "Today";
  if (isPast(d)) return "Overdue";
  if (isTomorrow(d)) return "Tomorrow";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This week";
  return "Later";
}

export function TasksPage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);

  const tasksQ = useTasks();
  const categoriesQ = useTaskCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();

  const tasks = tasksQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status === "active" && t.completed_at) return false;
      if (status === "done" && !t.completed_at) return false;
      if (categoryId !== null && t.category_id !== categoryId) return false;
      return true;
    });
  }, [tasks, status, categoryId]);

  const grouped = useMemo(() => {
    if (status === "done") return { Done: filtered } as Record<string, TaskRow[]>;
    const buckets: Record<Bucket, TaskRow[]> = {
      Overdue: [], Today: [], Tomorrow: [], "This week": [], Later: [], "No date": [],
    };
    for (const t of filtered) buckets[bucketFor(t)].push(t);
    return buckets;
  }, [filtered, status]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: TaskRow) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tasks</h1>
          <p className="text-sm text-muted-foreground">Everything you need to do, in one list.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </header>

      <TaskFilters
        status={status}
        onStatusChange={setStatus}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      {tasksQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nothing here.{" "}
          <button className="font-medium text-primary hover:underline" onClick={openCreate}>
            Add your first task
          </button>
          .
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped as Record<string, TaskRow[]>) as [string, TaskRow[]][])
            .filter(([, items]) => items.length > 0)
            .sort(([a], [b]) => bucketOrder.indexOf(a as Bucket) - bucketOrder.indexOf(b as Bucket))
            .map(([bucket, items]) => (
              <section key={bucket}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {bucket}
                </h2>
                <ul className="space-y-2">
                  {items.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      categories={categories}
                      onToggle={(id, completed) => toggleTask.mutate({ id, completed })}
                      onEdit={openEdit}
                      onDelete={(task) => setDeleting(task)}
                    />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        submitting={createTask.isPending || updateTask.isPending}
        onSubmit={async (values) => {
          if (editing) {
            await updateTask.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createTask.mutateAsync(values);
          }
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete task?"
        description={deleting ? `"${deleting.title}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        destructive
        pending={deleteTask.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteTask.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
