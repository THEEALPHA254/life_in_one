import { Text, View } from "react-native";

const labels: Record<number, string> = { 1: "Urgent", 2: "Normal", 3: "Low", 4: "Someday" };
const colours: Record<number, { bg: string; fg: string; dot: string }> = {
  1: { bg: "#fef2f2", fg: "#b91c1c", dot: "#ef4444" },
  2: { bg: "#eef2ff", fg: "#4338ca", dot: "#6366f1" },
  3: { bg: "#f8fafc", fg: "#64748b", dot: "#94a3b8" },
  4: { bg: "#f8fafc", fg: "#64748b", dot: "#94a3b8" },
};

export function PriorityBadge({ priority }: { priority: 1 | 2 | 3 | 4 }) {
  const c = colours[priority]!;
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: c.bg }}
    >
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      <Text style={{ color: c.fg, fontSize: 11, fontWeight: "600" }}>{labels[priority]}</Text>
    </View>
  );
}
