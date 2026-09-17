import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export function Placeholder({
  title,
  subtitle,
  emoji = "🚧",
  hint,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  hint?: string;
}) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title={title} subtitle={subtitle} />
      <View className="px-5 pt-2">
        <EmptyState
          emoji={emoji}
          title="Coming soon"
          subtitle={hint ?? "This module is being ported to mobile. Use the web app in the meantime."}
        />
      </View>
    </SafeAreaView>
  );
}
