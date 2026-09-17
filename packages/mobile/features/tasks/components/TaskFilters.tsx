import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type StatusFilter = "all" | "active" | "done";

const options = [
  { value: "active" as const, label: "Active" },
  { value: "done" as const, label: "Done" },
  { value: "all" as const, label: "All" },
];

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
}

export function TaskFilters({ status, onStatusChange }: Props) {
  return <SegmentedControl options={options} value={status} onChange={onStatusChange} />;
}
