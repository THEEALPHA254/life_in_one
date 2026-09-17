// Mirrors packages/web/src/features/tasks/hooks/useTasks.ts — same TanStack
// Query keys via @lio/core so cache is coordinated across both platforms.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { api, queries } from "@lio/core";
import type { TaskCreateInput, TaskUpdateInput, TaskCategoryInput } from "@lio/core/schemas/tasks";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 1 | 2 | 3 | 4;
  due_at: string | null;
  category_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
}

export function useTasks() {
  return useQuery({
    queryKey: queries.keys.tasks.list(),
    queryFn: async () => (await api.tasks.listTasks(supabase)) as TaskRow[],
  });
}

export function useTaskCategories() {
  return useQuery({
    queryKey: queries.keys.tasks.categories,
    queryFn: async () => (await api.tasks.listTaskCategories(supabase)) as TaskCategoryRow[],
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: TaskCreateInput) => {
      if (!user) throw new Error("Not authenticated");
      return api.tasks.createTask(supabase, { ...input, user_id: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.tasks.all });
      toast.success("Task added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TaskUpdateInput }) =>
      api.tasks.updateTask(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queries.keys.tasks.all }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleTaskComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) =>
      api.tasks.toggleTaskComplete(supabase, id, completed),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: queries.keys.tasks.all });
      const prev = qc.getQueryData<TaskRow[]>(queries.keys.tasks.list());
      qc.setQueryData<TaskRow[]>(queries.keys.tasks.list(), (rows) =>
        rows?.map((t) => (t.id === id ? { ...t, completed_at: completed ? new Date().toISOString() : null } : t)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queries.keys.tasks.list(), ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queries.keys.tasks.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.tasks.deleteTask(supabase, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queries.keys.tasks.all });
      const prev = qc.getQueryData<TaskRow[]>(queries.keys.tasks.list());
      qc.setQueryData<TaskRow[]>(queries.keys.tasks.list(), (rows) => rows?.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queries.keys.tasks.list(), ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Task deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: queries.keys.tasks.all }),
  });
}

export function useCreateTaskCategory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: TaskCategoryInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("task_categories")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TaskCategoryRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queries.keys.tasks.categories }),
    onError: (e: Error) => toast.error(e.message),
  });
}
