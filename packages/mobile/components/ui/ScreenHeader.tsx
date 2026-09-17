import { Text, View } from "react-native";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View className="flex-row items-end justify-between gap-3 px-5 pb-3 pt-2">
      <View className="flex-1">
        <Text className="text-[30px] font-bold leading-tight text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 text-[13px] text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
