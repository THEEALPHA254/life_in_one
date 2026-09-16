import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { goalCreateSchema, type GoalInput } from "@lio/core/schemas/goals";
import type { GoalStatus } from "@lio/core/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { GoalRow } from "../hooks/useGoals";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: GoalRow | null;
  defaultYear: number;
  onSubmit: (values: GoalInput) => Promise<void> | void;
  submitting?: boolean;
}

interface FormValues {
  title: string;
  description?: string;
  year: number;
  status: GoalStatus;
  target_date?: string | null;
}

const emptyValues = (year: number): FormValues => ({
  title: "",
  description: "",
  year,
  status: "pending",
  target_date: null,
});

const statuses: { value: GoalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "achieved", label: "Achieved" },
  { value: "abandoned", label: "Abandoned" },
];

export function GoalFormDialog({ open, onOpenChange, editing, defaultYear, onSubmit, submitting }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(goalCreateSchema),
    defaultValues: emptyValues(defaultYear),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            title: editing.title,
            description: editing.description ?? "",
            year: editing.year,
            status: editing.status,
            target_date: editing.target_date ?? null,
          }
        : emptyValues(defaultYear),
    );
  }, [open, editing, defaultYear, form]);

  const submit = form.handleSubmit(async (raw) => {
    const values: GoalInput = {
      title: raw.title,
      description: raw.description?.trim() ? raw.description : undefined,
      year: Number(raw.year),
      status: raw.status,
      target_date: raw.target_date ?? null,
    };
    await onSubmit(values);
  });

  const targetDate = form.watch("target_date");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>Goals belong to a year — with an optional target date.</DialogDescription>
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
            <Textarea id="description" rows={3} {...form.register("description")} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                {...form.register("year", { valueAsNumber: true })}
                aria-invalid={!!form.formState.errors.year}
              />
              {form.formState.errors.year ? (
                <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...form.register("status")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target_date">Target date</Label>
            <DatePicker
              id="target_date"
              value={targetDate ? new Date(targetDate + "T00:00:00") : null}
              onChange={(d) => form.setValue("target_date", d ? format(d, "yyyy-MM-dd") : null, { shouldDirty: true })}
              placeholder="Optional"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Add goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
