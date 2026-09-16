import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { budgetCategorySchema, type BudgetCategoryInput } from "@lio/core/schemas/budget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCategories, useCreateCategory, useDeleteCategory, type BudgetCategoryRow, type BudgetKind } from "../hooks/useBudget";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const kinds: { value: BudgetKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "savings", label: "Savings" },
];

export function ManageCategoriesDialog({ open, onOpenChange }: Props) {
  const categoriesQ = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();
  const [confirming, setConfirming] = useState<BudgetCategoryRow | null>(null);

  const form = useForm<BudgetCategoryInput>({
    resolver: zodResolver(budgetCategorySchema),
    defaultValues: { name: "", kind: "expense", color: "#6366f1" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync(values);
    form.reset({ name: "", kind: values.kind, color: values.color });
  });

  const categories = categoriesQ.data ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
            <DialogDescription>Deleting a category keeps its transactions but marks them uncategorized.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_60px]">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} placeholder="e.g. Groceries" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kind">Kind</Label>
                <select
                  id="kind"
                  {...form.register("kind")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {kinds.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Colour</Label>
                <Input id="color" type="color" className="h-10 w-full p-1" {...form.register("color")} />
              </div>
            </div>
            {form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={create.isPending}>
                {create.isPending ? "Adding…" : "Add category"}
              </Button>
            </div>
          </form>

          <ul className="max-h-72 divide-y overflow-auto rounded-md border">
            {categoriesQ.isLoading ? (
              <li className="p-3 text-sm text-muted-foreground">Loading…</li>
            ) : categories.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">No categories yet.</li>
            ) : (
              categories.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
                  <span className="text-sm">{c.name}</span>
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{c.kind}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => setConfirming(c)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
        title={confirming ? `Delete "${confirming.name}"?` : "Delete category?"}
        description="Transactions on this category will remain but be marked uncategorized."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={async () => {
          if (!confirming) return;
          await del.mutateAsync(confirming.id);
          setConfirming(null);
        }}
      />
    </>
  );
}
