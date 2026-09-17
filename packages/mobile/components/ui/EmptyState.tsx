import { Pressable, Text, View } from "react-native";

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ emoji = "✨", title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View className="items-center gap-2 rounded-2xl bg-surface px-6 py-12">
      <Text className="text-4xl" accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="text-center text-[13px] text-muted-foreground">{subtitle}</Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Pressable onPress={onCta} className="mt-3 rounded-full bg-primary px-5 py-2.5">
          <Text className="text-sm font-semibold text-primary-foreground">{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
