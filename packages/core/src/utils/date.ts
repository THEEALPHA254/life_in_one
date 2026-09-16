import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export const isoDate = (d: Date | string) => format(new Date(d), "yyyy-MM-dd");

export const dayRange = (d: Date | string) => ({
  from: startOfDay(new Date(d)).toISOString(),
  to: endOfDay(new Date(d)).toISOString(),
});

export const weekRange = (d: Date | string) => ({
  from: startOfWeek(new Date(d), { weekStartsOn: 1 }).toISOString(),
  to: endOfWeek(new Date(d), { weekStartsOn: 1 }).toISOString(),
});

export const monthRange = (d: Date | string) => ({
  from: startOfMonth(new Date(d)).toISOString(),
  to: endOfMonth(new Date(d)).toISOString(),
});
