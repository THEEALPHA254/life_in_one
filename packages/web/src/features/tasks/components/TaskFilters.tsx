import { cn } from "@/lib/utils";
import type { TaskCategoryRow } from "../hooks/useTasks";

export type StatusFilter = "all" | "active" | "done";

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  categories: TaskCategoryRow[];
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

export function TaskFilters({ status, onStatusChange, categories, categoryId, onCategoryChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="tablist" className="flex items-center rounded-lg bg-muted p-1 text-sm">
        {statusOptions.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={active}
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {categories.length > 0 ? (
        <select
          value={categoryId ?? ""}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
