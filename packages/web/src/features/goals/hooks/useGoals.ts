import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { GoalInput } from "@lio/core/schemas/goals";
import type { GoalStatus } from "@lio/core/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  year: number;
  status: GoalStatus;
  target_date: string | null;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoals(year: number) {
  return useQuery({
    queryKey: queries.keys.goals.byYear(year),
    queryFn: async () => (await api.goals.listGoals(supabase, year)) as GoalRow[],
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: GoalInput) => {
      if (!user) throw new Error("Not authenticated");
      return api.goals.createGoal(supabase, { ...input, user_id: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.goals.all });
      toast.success("Goal added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GoalInput> }) => {
      const { data, error } = await supabase.from("goals").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.goals.all });
      toast.success("Goal updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useChangeGoalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GoalStatus }) =>
      api.goals.updateGoalStatus(supabase, id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queries.keys.goals.all });
      const snapshots: Array<[readonly unknown[], GoalRow[] | undefined]> = [];
      // Optimistically patch every cached year that has this goal
      qc.getQueriesData<GoalRow[]>({ queryKey: queries.keys.goals.all }).forEach(([key, rows]) => {
        snapshots.push([key, rows]);
        if (!rows) return;
        qc.setQueryData<GoalRow[]>(
          key,
          rows.map((g) =>
            g.id === id
              ? { ...g, status, achieved_at: status === "achieved" ? new Date().toISOString() : g.achieved_at }
              : g,
          ),
        );
      });
      return { snapshots };
    },
    onError: (e: Error, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, rows]) => qc.setQueryData(key, rows));
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queries.keys.goals.all }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.goals.deleteGoal(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.goals.all });
      toast.success("Goal deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
