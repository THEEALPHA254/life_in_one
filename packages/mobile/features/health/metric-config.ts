// Same registry as packages/web/src/features/health/metric-config.ts.
// Kept mirrored here rather than moved to @lio/core to avoid churn on web.
// If we edit either, sync the other.
export type Aggregation = "sum" | "last" | "avg";

export interface MetricConfig {
  type: string;
  label: string;
  unit: string;
  displayUnit?: string;
  displayFactor?: number;
  aggregation: Aggregation;
  precision?: number;
}

export const KNOWN_METRICS: Record<string, MetricConfig> = {
  steps:          { type: "steps",          label: "Steps",       unit: "steps", aggregation: "sum",  precision: 0 },
  weight_kg:      { type: "weight_kg",      label: "Weight",      unit: "kg",    aggregation: "last", precision: 1 },
  sleep_min:      { type: "sleep_min",      label: "Sleep",       unit: "min",   displayUnit: "hours", displayFactor: 1 / 60, aggregation: "sum", precision: 1 },
  heart_rate_bpm: { type: "heart_rate_bpm", label: "Heart rate",  unit: "bpm",   aggregation: "avg",  precision: 0 },
  water_ml:       { type: "water_ml",       label: "Water",       unit: "ml",    aggregation: "sum",  precision: 0 },
};

export const PREDEFINED_TYPES = Object.keys(KNOWN_METRICS);

export function configFor(type: string): MetricConfig {
  return (
    KNOWN_METRICS[type] ?? {
      type,
      label: type,
      unit: "",
      aggregation: "last",
      precision: 2,
    }
  );
}

export function formatValue(config: MetricConfig, value: number): string {
  const displayed = value * (config.displayFactor ?? 1);
  const rounded = Number.isFinite(displayed) ? displayed.toFixed(config.precision ?? 0) : String(displayed);
  const unit = config.displayUnit ?? config.unit;
  return unit ? `${rounded} ${unit}` : rounded;
}
