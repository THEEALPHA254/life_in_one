import { Text, View } from "react-native";
import { useThemeColors } from "@/providers/ThemeProvider";

const labels: Record<number, string> = { 1: "Urgent", 2: "Normal", 3: "Low", 4: "Someday" };

export function PriorityBadge({ priority }: { priority: 1 | 2 | 3 | 4 }) {
  const colors = useThemeColors();
  const palette: Record<number, { bg: string; fg: string; dot: string }> = {
    1: { bg: colors.destructiveSoft, fg: colors.destructive, dot: colors.destructive },
    2: { bg: colors.primarySoft, fg: colors.primary, dot: colors.primary },
    3: { bg: colors.muted, fg: colors.mutedForeground, dot: colors.mutedForeground },
    4: { bg: colors.muted, fg: colors.mutedForeground, dot: colors.mutedForeground },
  };
  const c = palette[priority]!;
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
