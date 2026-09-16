import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "@lio/core/utils/currency";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BudgetTransactionRow } from "../hooks/useBudget";

interface Props {
  transactions: BudgetTransactionRow[];
  onEdit: (t: BudgetTransactionRow) => void;
  onDelete: (t: BudgetTransactionRow) => void;
}

const kindColor: Record<string, string> = {
  income: "text-emerald-600 dark:text-emerald-400",
  expense: "text-destructive",
  savings: "text-primary",
};

export function TransactionList({ transactions, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No transactions in this range.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {transactions.map((t) => {
        const kind = t.category?.kind ?? "expense";
        const sign = kind === "income" ? "+" : "-";
        return (
          <li key={t.id} className="flex items-center gap-3 p-3">
            <div
              className="h-8 w-8 shrink-0 rounded-full"
              style={{ backgroundColor: (t.category?.color ?? "#94a3b8") + "22", color: t.category?.color ?? "#475569" }}
            >
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold">
                {(t.category?.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.category?.name ?? "Uncategorized"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {format(new Date(t.occurred_on + "T00:00:00"), "EEE, d MMM")}
                {t.note ? ` · ${t.note}` : ""}
              </p>
            </div>
            <p className={cn("shrink-0 text-sm font-semibold tabular-nums", kindColor[kind])}>
              {sign}
              {formatMoney(t.amount_cents, t.currency)}
            </p>
            <div className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => onEdit(t)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(t)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
