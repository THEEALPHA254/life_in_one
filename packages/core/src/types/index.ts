export type { Database } from "./supabase";

export type Priority = 1 | 2 | 3 | 4;
export type GoalStatus = "pending" | "in_progress" | "achieved" | "abandoned";
export type BudgetKind = "income" | "expense" | "savings";
export type ThemeMode = "light" | "dark" | "system";
export type HealthMetricType =
  | "steps"
  | "weight_kg"
  | "sleep_min"
  | "heart_rate_bpm"
  | "water_ml"
  | (string & {});
