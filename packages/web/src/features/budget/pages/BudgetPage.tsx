import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SummaryCards } from "../components/SummaryCards";
import { CategoryPie } from "../components/CategoryPie";
import { TransactionList } from "../components/TransactionList";
import { TransactionFormDialog } from "../components/TransactionFormDialog";
import { ManageCategoriesDialog } from "../components/ManageCategoriesDialog";
import {
  useCategories,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
  type BudgetTransactionRow,
} from "../hooks/useBudget";

const CURRENCY = "KES";
const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

export function BudgetPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetTransactionRow | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BudgetTransactionRow | null>(null);

  const range = useMemo(
    () => ({ from: isoDate(startOfMonth(cursor)), to: isoDate(endOfMonth(cursor)) }),
    [cursor],
  );

  const txQ = useTransactions(range.from, range.to);
  const categoriesQ = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const transactions = txQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: BudgetTransactionRow) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Budget</h1>
          <p className="text-sm text-muted-foreground">Track income, expenses, savings — monthly.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[9rem] text-center text-sm font-medium">{format(cursor, "LLLL yyyy")}</div>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>This month</Button>
        </div>
      </header>

      <SummaryCards transactions={transactions} currency={CURRENCY} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPie transactions={transactions} kind="expense" currency={CURRENCY} />
        <CategoryPie transactions={transactions} kind="income" currency={CURRENCY} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="h-4 w-4" /> Categories
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        </div>
        {txQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            You don't have any categories yet.{" "}
            <button className="font-medium text-primary hover:underline" onClick={() => setManageOpen(true)}>
              Add one
            </button>{" "}
            first, then log your first transaction.
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={openEdit}
            onDelete={(t) => setConfirmDelete(t)}
          />
        )}
      </section>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        currency={CURRENCY}
        submitting={createTx.isPending || updateTx.isPending}
        onManageCategories={() => setManageOpen(true)}
        onSubmit={async (values) => {
          if (editing) {
            await updateTx.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createTx.mutateAsync(values);
          }
          setFormOpen(false);
        }}
      />

      <ManageCategoriesDialog open={manageOpen} onOpenChange={setManageOpen} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete transaction?"
        description={confirmDelete ? "This cannot be undone." : undefined}
        confirmLabel="Delete"
        destructive
        pending={deleteTx.isPending}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteTx.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
