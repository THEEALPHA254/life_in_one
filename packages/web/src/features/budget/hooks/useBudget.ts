import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { BudgetCategoryInput, BudgetTransactionInput } from "@lio/core/schemas/budget";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export type BudgetKind = "income" | "expense" | "savings";

export interface BudgetCategoryRow {
  id: string;
  user_id: string;
  name: string;
  kind: BudgetKind;
  color: string | null;
  created_at: string;
}

export interface BudgetTransactionRow {
  id: string;
  user_id: string;
  category_id: string | null;
  amount_cents: number;
  currency: string;
  occurred_on: string;
  note: string | null;
  created_at: string;
  category: Pick<BudgetCategoryRow, "id" | "name" | "kind" | "color"> | null;
}

export function useCategories() {
  return useQuery({
    queryKey: queries.keys.budget.categories,
    queryFn: async () => (await api.budget.listCategories(supabase)) as BudgetCategoryRow[],
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: BudgetCategoryInput) => {
      if (!user) throw new Error("Not authenticated");
      return (await api.budget.createCategory(supabase, { ...input, user_id: user.id })) as BudgetCategoryRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.budget.categories });
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_categories").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Deleting a category sets category_id NULL on its transactions (ON DELETE SET NULL) — reload both.
      qc.invalidateQueries({ queryKey: queries.keys.budget.categories });
      qc.invalidateQueries({ queryKey: queries.keys.budget.all });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTransactions(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: queries.keys.budget.transactions(fromDate, toDate),
    queryFn: async () =>
      (await api.budget.listTransactions(supabase, { from: fromDate, to: toDate })) as BudgetTransactionRow[],
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: BudgetTransactionInput) => {
      if (!user) throw new Error("Not authenticated");
      return api.budget.createTransaction(supabase, { ...input, user_id: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.budget.all });
      toast.success("Transaction added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BudgetTransactionInput> }) => {
      const { data, error } = await supabase.from("budget_transactions").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.budget.all });
      toast.success("Transaction updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.budget.deleteTransaction(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.budget.all });
      toast.success("Transaction deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
