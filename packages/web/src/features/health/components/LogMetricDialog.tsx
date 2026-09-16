import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { HealthMetricInput } from "@lio/core/schemas/health";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { KNOWN_METRICS, PREDEFINED_TYPES, configFor } from "../metric-config";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: string;
  extraTypes: string[]; // user-added custom types seen in DB
  onSubmit: (values: HealthMetricInput) => Promise<void> | void;
  submitting?: boolean;
}

interface FormValues {
  metricSelect: string;     // predefined type OR __custom__
  customType?: string;
  value: string;
  recorded_at: string;
}

const empty = (defaultType: string): FormValues => ({
  metricSelect: PREDEFINED_TYPES.includes(defaultType) ? defaultType : "__custom__",
  customType: PREDEFINED_TYPES.includes(defaultType) ? "" : defaultType,
  value: "",
  recorded_at: new Date().toISOString(),
});

export function LogMetricDialog({ open, onOpenChange, defaultType, extraTypes, onSubmit, submitting }: Props) {
  const form = useForm<FormValues>({ defaultValues: empty(defaultType) });

  useEffect(() => {
    if (!open) return;
    form.reset(empty(defaultType));
  }, [open, defaultType, form]);

  const metricSelect = form.watch("metricSelect");
  const isCustom = metricSelect === "__custom__";
  const effectiveType = isCustom ? (form.watch("customType") ?? "").trim() : metricSelect;
  const config = configFor(effectiveType);

  const submit = form.handleSubmit(async (raw) => {
    const type = isCustom ? (raw.customType ?? "").trim() : raw.metricSelect;
    if (!type) {
      form.setError("customType", { message: "Name your metric" });
      return;
    }
    const num = Number(raw.value);
    if (!Number.isFinite(num)) {
      form.setError("value", { message: "Enter a number" });
      return;
    }
    await onSubmit({
      metric_type: type,
      value: num,
      recorded_at: raw.recorded_at,
      source: "manual",
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a value</DialogTitle>
          <DialogDescription>Pick a metric, enter a number, choose when it happened.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="metric">Metric</Label>
            <select
              id="metric"
              {...form.register("metricSelect")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <optgroup label="Predefined">
                {Object.values(KNOWN_METRICS).map((m) => (
                  <option key={m.type} value={m.type}>{m.label} ({m.unit})</option>
                ))}
              </optgroup>
              {extraTypes.filter((t) => !PREDEFINED_TYPES.includes(t)).length > 0 ? (
                <optgroup label="Your custom">
                  {extraTypes.filter((t) => !PREDEFINED_TYPES.includes(t)).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </optgroup>
              ) : null}
              <option value="__custom__">Custom…</option>
            </select>
          </div>

          {isCustom ? (
            <div className="space-y-1.5">
              <Label htmlFor="customType">Metric name</Label>
              <Input
                id="customType"
                placeholder="e.g. blood_pressure_sys"
                {...form.register("customType")}
                aria-invalid={!!form.formState.errors.customType}
              />
              {form.formState.errors.customType ? (
                <p className="text-xs text-destructive">{form.formState.errors.customType.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="value">Value {config.unit ? `(${config.unit})` : ""}</Label>
            <Input
              id="value"
              type="number"
              inputMode="decimal"
              step="any"
              autoFocus
              {...form.register("value")}
              aria-invalid={!!form.formState.errors.value}
            />
            {form.formState.errors.value ? (
              <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recorded_at">When</Label>
            <DateTimePicker
              id="recorded_at"
              value={form.watch("recorded_at")}
              onChange={(iso) => iso && form.setValue("recorded_at", iso, { shouldDirty: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
