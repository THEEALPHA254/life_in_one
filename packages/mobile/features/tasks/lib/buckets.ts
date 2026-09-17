import { isPast, isToday, isTomorrow, isThisWeek } from "date-fns";
import type { TaskRow } from "../hooks/useTasks";

export type Bucket = "Overdue" | "Today" | "Tomorrow" | "This week" | "Later" | "No date";
export const bucketOrder: Bucket[] = ["Overdue", "Today", "Tomorrow", "This week", "Later", "No date"];

export function bucketFor(t: TaskRow): Bucket {
  if (!t.due_at) return "No date";
  const d = new Date(t.due_at);
  if (isToday(d)) return "Today";
  if (isPast(d)) return "Overdue";
  if (isTomorrow(d)) return "Tomorrow";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This week";
  return "Later";
}
