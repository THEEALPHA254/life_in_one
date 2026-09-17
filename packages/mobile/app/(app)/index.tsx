import { format } from "date-fns";
import { Link } from "expo-router";
import { ArrowUpRight, BookMarked, BookOpen, Calendar as CalendarIcon, CheckSquare, Heart, Target, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/providers/AuthProvider";

function greetingFor(hour: number) {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night";
}

const shortcuts = [
  { href: "/(app)/tasks",    label: "Tasks",    icon: CheckSquare, tint: "#e0e7ff", fg: "#4338ca" },
  { href: "/(app)/calendar", label: "Calendar", icon: CalendarIcon, tint: "#dcfce7", fg: "#166534" },
  { href: "/(app)/journal",  label: "Journal",  icon: BookOpen,     tint: "#fef3c7", fg: "#92400e" },
  { href: "/(app)/budget",   label: "Budget",   icon: Wallet,       tint: "#fee2e2", fg: "#b91c1c" },
  { href: "/(app)/goals",    label: "Goals",    icon: Target,       tint: "#f3e8ff", fg: "#6b21a8" },
  { href: "/(app)/health",   label: "Health",   icon: Heart,        tint: "#fce7f3", fg: "#9d174d" },
  { href: "/(app)/bible",    label: "Bible",    icon: BookMarked,   tint: "#e0f2fe", fg: "#075985" },
] as const;

export default function DashboardScreen() {
  const { user } = useAuth();
  const now = new Date();
  const name = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "there";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title={`${greetingFor(now.getHours())}, ${name}`} subtitle={format(now, "EEEE, d MMMM yyyy")} />

      <View className="px-5 pt-2">
        <Card className="p-5">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Life OS · mobile v1
          </Text>
          <Text className="mt-1 text-lg font-semibold text-foreground">
            Everything in one place
          </Text>
          <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
            Data syncs with the web instantly. Module widgets fill in as each phase ships.
          </Text>
        </Card>
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          Modules
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} asChild>
              <Pressable className="flex-1 min-w-[46%]">
                <Card className="gap-3 p-4">
                  <View className="flex-row items-center justify-between">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: s.tint }}
                    >
                      <s.icon size={18} color={s.fg} />
                    </View>
                    <ArrowUpRight size={16} color="#94a3b8" />
                  </View>
                  <Text className="text-[15px] font-semibold text-foreground">{s.label}</Text>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
