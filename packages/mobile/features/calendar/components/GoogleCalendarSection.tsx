import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react-native";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import {
  useDisconnectGoogleCalendar,
  useGoogleCalendarAccount,
  useSyncGoogleCalendar,
} from "../hooks/useGoogleCalendar";
import { useThemeColors } from "@/providers/ThemeProvider";

export function GoogleCalendarSection() {
  const colors = useThemeColors();
  const accountQ = useGoogleCalendarAccount();
  const sync = useSyncGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const account = accountQ.data;

  return (
    <View className="gap-3 rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
      <Text className="text-[15px] font-semibold text-foreground">Google Calendar</Text>

      {accountQ.isLoading ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Checking connection…</Text>
      ) : account ? (
        <View className="gap-3">
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "500" }}>
                Connected
              </Text>
            </View>
            {account.google_calendar_id ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
                {account.google_calendar_id}
              </Text>
            ) : null}
            {account.expires_at ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                Token refreshes automatically · last checked {format(new Date(account.expires_at), "d MMM HH:mm")}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => sync.mutate({})}
              disabled={sync.isPending}
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl"
              style={{ backgroundColor: "#eef2ff" }}
            >
              {sync.isPending ? (
                <ActivityIndicator size="small" color="#4338ca" />
              ) : (
                <RefreshCw size={14} color="#4338ca" />
              )}
              <Text style={{ color: "#4338ca", fontSize: 13, fontWeight: "600" }}>Sync now</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmDisconnect(true)}
              className="h-11 items-center justify-center rounded-xl px-4"
              style={{ backgroundColor: colors.destructiveSoft }}
            >
              <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600" }}>Disconnect</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: "#cbd5e1" }} />
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "500" }}>Not connected</Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            Connect Google Calendar on the web app at{" "}
            <Text style={{ color: "#4338ca" }}>life-in-one-web.vercel.app</Text>. Once connected, sync from mobile works automatically.
          </Text>
        </View>
      )}

      <ConfirmDialog
        visible={confirmDisconnect}
        title="Disconnect Google Calendar?"
        description="Synced events stay in your local calendar, but new changes won't push to Google."
        confirmLabel="Disconnect"
        destructive
        pending={disconnect.isPending}
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={async () => {
          if (!account) return;
          await disconnect.mutateAsync(account.id);
          setConfirmDisconnect(false);
        }}
      />
    </View>
  );
}
