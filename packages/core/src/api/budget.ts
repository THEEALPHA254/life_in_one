import type { LioClient } from "../supabase";
import type { BudgetCategoryInput, BudgetTransactionInput } from "../schemas/budget";

export async function listCategories(client: LioClient) {
  const { data, error } = await client.from("budget_categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createCategory(client: LioClient, input: BudgetCategoryInput & { user_id: string }) {
  const { data, error } = await client.from("budget_categories").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listTransactions(client: LioClient, opts: { from?: string; to?: string } = {}) {
  let q = client.from("budget_transactions").select("*, category:budget_categories(id,name,kind,color)").order("occurred_on", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTransaction(client: LioClient, input: BudgetTransactionInput & { user_id: string }) {
  const { data, error } = await client.from("budget_transactions").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(client: LioClient, id: string) {
  const { error } = await client.from("budget_transactions").delete().eq("id", id);
  if (error) throw error;
}
