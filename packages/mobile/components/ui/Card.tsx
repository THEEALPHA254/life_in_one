import { View, type ViewProps } from "react-native";

export function Card({ style, className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl bg-surface ${className ?? ""}`}
      style={[
        {
          shadowColor: "#000",
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
