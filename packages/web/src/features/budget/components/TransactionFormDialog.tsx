import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { budgetTransactionSchema, type BudgetTransactionInput } from "@lio/core/schemas/budget";
import { unitsToCents, centsToUnits } from "@lio/core/utils/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import type { BudgetCategoryRow, BudgetTransactionRow } from "../hooks/useBudget";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BudgetTransactionRow | null;
  categories: BudgetCategoryRow[];
  currency: string;
  onSubmit: (values: BudgetTransactionInput) => Promise<void> | void;
  onManageCategories: () => void;
  submitting?: boolean;
}

interface FormValues {
  category_id: string;
  amount: string;              // displayed as decimal units
  occurred_on: string;         // yyyy-MM-dd
  note?: string;
}

const emptyValues = (): FormValues => ({
  category_id: "",
  amount: "",
  occurred_on: format(new Date(), "yyyy-MM-dd"),
  note: "",
});

export function TransactionFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  currency,
  onSubmit,
  onManageCategories,
  submitting,
}: Props) {
  const form = useForm<FormValues>({ defaultValues: emptyValues() });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        category_id: editing.category_id ?? "",
        amount: String(centsToUnits(editing.amount_cents)),
        occurred_on: editing.occurred_on,
        note: editing.note ?? "",
      });
    } else {
      form.reset(emptyValues());
    }
  }, [open, editing, form]);

  const submit = form.handleSubmit(async (raw) => {
    const amountUnits = Number(raw.amount);
    if (!Number.isFinite(amountUnits) || amountUnits <= 0) {
      form.setError("amount", { message: "Enter a positive amount" });
      return;
    }
    if (!raw.category_id) {
      form.setError("category_id", { message: "Pick a category" });
      return;
    }
    const values: BudgetTransactionInput = {
      category_id: raw.category_id,
      amount_cents: unitsToCents(amountUnits),
      currency,
      occurred_on: raw.occurred_on,
      note: raw.note?.trim() ? raw.note : undefined,
    };
    const parsed = budgetTransactionSchema.safeParse(values);
    if (!parsed.success) {
      form.setError("amount", { message: parsed.error.errors[0]?.message ?? "Invalid" });
      return;
    }
    await onSubmit(parsed.data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Amount in {currency}. Kind (income/expense/savings) comes from the category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoFocus
              {...form.register("amount")}
              aria-invalid={!!form.formState.errors.amount}
            />
            {form.formState.errors.amount ? (
              <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category_id">Category</Label>
            <div className="flex gap-2">
              <select
                id="category_id"
                {...form.register("category_id")}
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a category</option>
                {(["income", "expense", "savings"] as const).map((kind) => {
                  const inKind = categories.filter((c) => c.kind === kind);
                  if (inKind.length === 0) return null;
                  return (
                    <optgroup key={kind} label={kind[0]!.toUpperCase() + kind.slice(1)}>
                      {inKind.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <Button type="button" variant="outline" onClick={onManageCategories}>Manage</Button>
            </div>
            {form.formState.errors.category_id ? (
              <p className="text-xs text-destructive">{form.formState.errors.category_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="occurred_on">Date</Label>
            <DatePicker
              id="occurred_on"
              value={form.watch("occurred_on") ? new Date(form.watch("occurred_on") + "T00:00:00") : new Date()}
              onChange={(d) => form.setValue("occurred_on", d ? format(d, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), { shouldDirty: true })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input id="note" {...form.register("note")} placeholder="Optional" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
