import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { HealthMetricInput } from "@lio/core/schemas/health";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface HealthMetricRow {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  recorded_at: string;
  source: string;
  external_id: string | null;
  created_at: string;
}

export function useMetrics(metricType: string, fromIso: string, toIso: string) {
  return useQuery({
    queryKey: queries.keys.health.metric(metricType, fromIso, toIso),
    enabled: !!metricType,
    queryFn: async () =>
      (await api.health.listMetrics(supabase, metricType, { from: fromIso, to: toIso, limit: 500 })) as HealthMetricRow[],
  });
}

// Distinct set of metric_types this user has ever logged. Cheap to fetch —
// small table for a solo user; we dedupe client-side to avoid needing an RPC.
export function useDistinctMetricTypes() {
  return useQuery({
    queryKey: ["health", "distinctTypes"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_metrics")
        .select("metric_type")
        .order("metric_type");
      if (error) throw error;
      const rows = (data ?? []) as Array<{ metric_type: string }>;
      return Array.from(new Set(rows.map((r) => r.metric_type)));
    },
  });
}

export function useLogMetric() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: HealthMetricInput) => {
      if (!user) throw new Error("Not authenticated");
      return api.health.recordMetric(supabase, { ...input, user_id: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.health.all });
      qc.invalidateQueries({ queryKey: ["health", "distinctTypes"] });
      toast.success("Logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.health.deleteMetric(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.health.all });
      qc.invalidateQueries({ queryKey: ["health", "distinctTypes"] });
      toast.success("Entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
