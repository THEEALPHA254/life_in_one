import { Link } from "expo-router";
import { BookMarked, ChevronRight, Heart, LogOut, Settings, Target, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

const shortcuts = [
  { href: "/(app)/budget",   label: "Budget",   icon: Wallet,     tint: "#fee2e2", fg: "#b91c1c" },
  { href: "/(app)/goals",    label: "Goals",    icon: Target,     tint: "#f3e8ff", fg: "#6b21a8" },
  { href: "/(app)/health",   label: "Health",   icon: Heart,      tint: "#fce7f3", fg: "#9d174d" },
  { href: "/(app)/bible",    label: "Bible",    icon: BookMarked, tint: "#e0f2fe", fg: "#075985" },
  { href: "/(app)/settings", label: "Settings", icon: Settings,   tint: "#e2e8f0", fg: "#334155" },
] as const;

export default function MoreScreen() {
  const { user } = useAuth();
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "?";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title="More" subtitle="Modules, profile, and sign out." />

      <View className="px-5">
        <Card className="flex-row items-center gap-3 p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">{displayName}</Text>
            <Text className="text-[13px] text-muted-foreground">{user?.email ?? "—"}</Text>
          </View>
        </Card>
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          More modules
        </Text>
        <Card className="overflow-hidden">
          {shortcuts.map((s, i) => (
            <Link key={s.href} href={s.href} asChild>
              <Pressable className="flex-row items-center gap-3 px-4 py-3.5"
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: "#f1f5f9" } : undefined}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: s.tint }}>
                  <s.icon size={16} color={s.fg} />
                </View>
                <Text className="flex-1 text-[15px] font-medium text-foreground">{s.label}</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </Pressable>
            </Link>
          ))}
        </Card>
      </View>

      <View className="mt-8 px-5">
        <PrimaryButton
          label="Sign out"
          variant="destructive"
          leading={<LogOut size={16} color="#fff" />}
          onPress={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) toast.error(error.message);
          }}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
