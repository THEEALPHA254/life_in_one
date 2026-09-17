import { View, type ViewProps } from "react-native";

// Soft rounded surface — white bg on the muted screen background, subtle shadow.
export function Card({ style, className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl bg-surface ${className ?? ""}`}
      style={[
        {
          shadowColor: "#0f172a",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
      {...rest}
    />
  );
}
