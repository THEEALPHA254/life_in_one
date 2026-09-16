import type { LioClient } from "../supabase";
import type { HealthMetricInput } from "../schemas/health";

export async function listMetrics(client: LioClient, metricType: string, opts: { from?: string; to?: string; limit?: number } = {}) {
  let q = client.from("health_metrics").select("*").eq("metric_type", metricType).order("recorded_at", { ascending: false });
  if (opts.from) q = q.gte("recorded_at", opts.from);
  if (opts.to) q = q.lte("recorded_at", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function recordMetric(client: LioClient, input: HealthMetricInput & { user_id: string }) {
  const { data, error } = await client.from("health_metrics").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMetric(client: LioClient, id: string) {
  const { error } = await client.from("health_metrics").delete().eq("id", id);
  if (error) throw error;
}
