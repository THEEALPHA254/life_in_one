import { Redirect, Tabs } from "expo-router";
import { BookOpen, Calendar as CalendarIcon, CheckSquare, Home, MoreHorizontal } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Home",     tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="tasks"    options={{ title: "Tasks",    tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: ({ color, size }) => <CalendarIcon size={size} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="journal"  options={{ title: "Journal",  tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="more"     options={{ title: "More",     tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="budget"   options={{ href: null }} />
      <Tabs.Screen name="goals"    options={{ href: null }} />
      <Tabs.Screen name="health"   options={{ href: null }} />
      <Tabs.Screen name="bible"    options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
