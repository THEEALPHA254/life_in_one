import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addHours } from "date-fns";

// All-day storage convention: noon UTC on the target local date.
function localDateToNoonUtcIso(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
}
import { calendarEventCreateSchema, type CalendarEventInput } from "@lio/core/schemas/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type { CalendarEventRow } from "../hooks/useCalendarEvents";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CalendarEventRow | null;
  initialStart?: Date | null;
  onSubmit: (values: CalendarEventInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitting?: boolean;
}

interface FormValues {
  title: string;
  description?: string;
  location?: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
}

const emptyFrom = (start: Date) => ({
  title: "",
  description: "",
  location: "",
  starts_at: start.toISOString(),
  ends_at: addHours(start, 1).toISOString(),
  all_day: false,
});

export function EventFormDialog({ open, onOpenChange, editing, initialStart, onSubmit, onDelete, submitting }: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(calendarEventCreateSchema),
    defaultValues: emptyFrom(initialStart ?? new Date()),
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description ?? "",
        location: editing.location ?? "",
        starts_at: editing.starts_at,
        ends_at: editing.ends_at,
        all_day: editing.all_day,
      });
    } else {
      form.reset(emptyFrom(initialStart ?? new Date()));
    }
  }, [open, editing, initialStart, form]);

  const allDay = form.watch("all_day");
  const startsAt = form.watch("starts_at");
  const endsAt = form.watch("ends_at");

  const setAllDay = (next: boolean) => {
    form.setValue("all_day", next, { shouldDirty: true });
    if (!startsAt) return;
    if (next) {
      // All-day events store as noon UTC on the target LOCAL date. This avoids
      // day-shift under timezone conversion (start-of-day in KE+3 becomes
      // 21:00 UTC the previous day, which then displays on the wrong date).
      form.setValue("starts_at", localDateToNoonUtcIso(new Date(startsAt)), { shouldDirty: true });
      form.setValue("ends_at", localDateToNoonUtcIso(new Date(endsAt || startsAt)), { shouldDirty: true });
    }
  };

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    if (new Date(v.ends_at) < new Date(v.starts_at)) {
      setError("End time must be on or after start time.");
      return;
    }
    await onSubmit({
      title: v.title,
      description: v.description?.trim() ? v.description : undefined,
      location: v.location?.trim() ? v.location : undefined,
      starts_at: v.starts_at,
      ends_at: v.ends_at,
      all_day: v.all_day,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>Give it a title and a time range.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            All day
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="starts_at">Starts</Label>
              <DateTimePicker
                id="starts_at"
                value={startsAt}
                onChange={(iso) => iso && form.setValue("starts_at", iso, { shouldDirty: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ends_at">Ends</Label>
              <DateTimePicker
                id="ends_at"
                value={endsAt}
                onChange={(iso) => iso && form.setValue("ends_at", iso, { shouldDirty: true })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register("location")} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <DialogFooter>
            {editing && onDelete ? (
              <Button type="button" variant="destructive" onClick={() => onDelete()} className="sm:mr-auto">
                Delete
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Add event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
