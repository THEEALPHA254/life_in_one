import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Option<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  options: Option<V>[];
  value: V;
  onChange: (value: V) => void;
}

export function SegmentedControl<V extends string>({ options, value, onChange }: Props<V>) {
  const colors = useThemeColors();
  return (
    <View className="flex-row rounded-full bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (opt.value !== value) {
                void Haptics.selectionAsync();
                onChange(opt.value);
              }
            }}
            className="flex-1 items-center rounded-full py-2"
            style={active ? {
              backgroundColor: colors.surface,
              shadowColor: colors.foreground,
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            } : undefined}
          >
            <Text
              className="text-[13px]"
              style={active ? { color: colors.foreground, fontWeight: "600" } : { color: colors.mutedForeground }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
