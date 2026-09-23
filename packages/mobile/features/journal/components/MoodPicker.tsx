import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/providers/ThemeProvider";

type Mood = 1 | 2 | 3 | 4 | 5;

const options: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😐", label: "Meh" },
  { value: 3, emoji: "🙂", label: "OK" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

interface Props {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(active ? null : o.value)}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{
              backgroundColor: active ? "#eef2ff" : colors.surface,
              borderWidth: 1,
              borderColor: active ? "#6366f1" : colors.border,
            }}
            accessibilityLabel={`Mood: ${o.label}`}
          >
            <Text style={{ fontSize: 20 }}>{o.emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
