import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  label: string;
  error?: string;
  children?: ReactNode;
}

export function Field({ label, error, children }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-medium text-foreground-2">{label}</Text>
      {children}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

// Themed TextInput matching Field's aesthetic.
export function Input(props: TextInputProps) {
  const colors = useThemeColors();
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      className="h-12 rounded-xl bg-surface px-4 text-[15px] text-foreground"
      style={[{ borderWidth: 1, borderColor: colors.border }, props.style]}
      {...props}
    />
  );
}
