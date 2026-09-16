import type { LioClient } from "../supabase";
import type { GoalInput } from "../schemas/goals";
import type { GoalStatus } from "../types";

export async function listGoals(client: LioClient, year?: number) {
  let q = client.from("goals").select("*").order("target_date", { ascending: true, nullsFirst: false });
  if (year !== undefined) q = q.eq("year", year);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createGoal(client: LioClient, input: GoalInput & { user_id: string }) {
  const { data, error } = await client.from("goals").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateGoalStatus(client: LioClient, id: string, status: GoalStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === "achieved") patch.achieved_at = new Date().toISOString();
  const { data, error } = await client.from("goals").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(client: LioClient, id: string) {
  const { error } = await client.from("goals").delete().eq("id", id);
  if (error) throw error;
}
