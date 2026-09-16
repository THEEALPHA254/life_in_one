import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskCreateSchema, type TaskCreateInput } from "@lio/core/schemas/tasks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type { TaskRow, TaskCategoryRow } from "../hooks/useTasks";
import { useCreateTaskCategory } from "../hooks/useTasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TaskRow | null;
  categories: TaskCategoryRow[];
  onSubmit: (values: TaskCreateInput) => Promise<void> | void;
  submitting?: boolean;
}

interface FormValues {
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  due_at?: string | null;
  category_id?: string | null;
}

const emptyValues: FormValues = { title: "", description: "", priority: 2, due_at: null, category_id: null };

export function TaskFormDialog({ open, onOpenChange, editing, categories, onSubmit, submitting }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: emptyValues,
  });

  const createCategory = useCreateTaskCategory();

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            title: editing.title,
            description: editing.description ?? "",
            priority: editing.priority,
            due_at: editing.due_at ?? null,
            category_id: editing.category_id ?? null,
          }
        : emptyValues,
    );
  }, [open, editing, form]);

  const submit = form.handleSubmit(async (raw) => {
    const values: TaskCreateInput = {
      title: raw.title,
      description: raw.description?.trim() ? raw.description : undefined,
      priority: raw.priority,
      due_at: raw.due_at ?? null,
      category_id: raw.category_id || null,
    };
    await onSubmit(values);
  });

  const onAddCategory = async () => {
    const name = window.prompt("New category name");
    if (!name?.trim()) return;
    const category = await createCategory.mutateAsync({ name: name.trim() });
    form.setValue("category_id", category.id, { shouldDirty: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>Title is the only required field.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...form.register("priority", { valueAsNumber: true })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={1}>Urgent</option>
                <option value={2}>Normal</option>
                <option value={3}>Low</option>
                <option value={4}>Someday</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_at">Due</Label>
              <DateTimePicker
                id="due_at"
                value={form.watch("due_at") ?? null}
                onChange={(iso) => form.setValue("due_at", iso, { shouldDirty: true })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <div className="flex gap-2">
              <select
                id="category"
                value={form.watch("category_id") ?? ""}
                onChange={(e) => form.setValue("category_id", e.target.value || null, { shouldDirty: true })}
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={onAddCategory} disabled={createCategory.isPending}>
                {createCategory.isPending ? "…" : "New"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
