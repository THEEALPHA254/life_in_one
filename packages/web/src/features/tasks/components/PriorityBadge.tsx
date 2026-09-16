import { cn } from "@/lib/utils";

const labels: Record<number, string> = { 1: "Urgent", 2: "Normal", 3: "Low", 4: "Someday" };
const styles: Record<number, string> = {
  1: "bg-destructive/10 text-destructive",
  2: "bg-primary/10 text-primary",
  3: "bg-muted text-muted-foreground",
  4: "bg-muted text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: 1 | 2 | 3 | 4 }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[priority])}>
      {labels[priority]}
    </span>
  );
}
