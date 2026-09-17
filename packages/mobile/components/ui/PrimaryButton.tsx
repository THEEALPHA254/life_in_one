import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import type { ReactNode } from "react";

interface Props extends Omit<PressableProps, "children"> {
  label: string;
  loading?: boolean;
  variant?: "primary" | "ghost" | "destructive";
  leading?: ReactNode;
}

export function PrimaryButton({ label, loading, variant = "primary", leading, onPress, disabled, ...rest }: Props) {
  const bg = variant === "primary" ? "#6366f1" : variant === "destructive" ? "#ef4444" : "transparent";
  const fg = variant === "ghost" ? "#0f172a" : "#ffffff";
  return (
    <Pressable
      onPress={(e) => {
        if (!disabled && !loading) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }
      }}
      disabled={disabled || loading}
      className="h-12 flex-row items-center justify-center gap-2 rounded-xl px-5"
      style={{
        backgroundColor: bg,
        opacity: disabled || loading ? 0.6 : 1,
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leading}
          <Text style={{ color: fg, fontSize: 15, fontWeight: "600" }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
