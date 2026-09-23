import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GoogleCalendarSection } from "@/features/calendar/components/GoogleCalendarSection";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Settings" subtitle="Account, appearance, and connections." />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 120 }}>
        <ProfileSection />
        <GoogleCalendarSection />
        <PrimaryButton
          label="Sign out"
          variant="destructive"
          onPress={async () => {
            await supabase.auth.signOut();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
