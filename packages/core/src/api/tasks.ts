import type { LioClient } from "../supabase";
import type { TaskCreateInput, TaskUpdateInput } from "../schemas/tasks";

export interface ListTasksFilter {
  completed?: boolean;
  categoryId?: string | null;
  from?: string;
  to?: string;
}

export async function listTasks(client: LioClient, filter: ListTasksFilter = {}) {
  let q = client.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false });
  if (filter.completed === true) q = q.not("completed_at", "is", null);
  if (filter.completed === false) q = q.is("completed_at", null);
  if (filter.categoryId !== undefined) q = filter.categoryId === null ? q.is("category_id", null) : q.eq("category_id", filter.categoryId);
  if (filter.from) q = q.gte("due_at", filter.from);
  if (filter.to) q = q.lte("due_at", filter.to);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTask(client: LioClient, input: TaskCreateInput & { user_id: string }) {
  const { data, error } = await client.from("tasks").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(client: LioClient, id: string, patch: TaskUpdateInput) {
  const { data, error } = await client.from("tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function toggleTaskComplete(client: LioClient, id: string, completed: boolean) {
  return updateTask(client, id, { completed_at: completed ? new Date().toISOString() : null });
}

export async function deleteTask(client: LioClient, id: string) {
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function listTaskCategories(client: LioClient) {
  const { data, error } = await client.from("task_categories").select("*").order("name");
  if (error) throw error;
  return data;
}
