import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queries } from "@lio/core";
import type { ProfileInput } from "@lio/core/schemas/profile";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeColors } from "@/providers/ThemeProvider";

type ThemeMode = "light" | "dark" | "system";
type ProfileRow = ProfileInput & { id: string };

const ACCENT_PRESETS = ["#6366f1", "#10b981", "#f97316", "#ec4899", "#0ea5e9", "#f59e0b"];

const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export function ProfileSection() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: queries.keys.profile.me,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data as ProfileRow;
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [accentColor, setAccentColor] = useState<string>("#6366f1");

  useEffect(() => {
    if (!profileQ.data) return;
    setDisplayName(profileQ.data.display_name ?? "");
    setThemeMode((profileQ.data.theme_mode ?? "system") as ThemeMode);
    setAccentColor(profileQ.data.accent_color ?? "#6366f1");
  }, [profileQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!displayName.trim()) throw new Error("Display name is required");
      if (!isValidHex(accentColor)) throw new Error("Accent must be a #RRGGBB colour");
      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          theme_mode: themeMode,
          accent_color: accentColor,
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.profile.me });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty =
    profileQ.data &&
    ((profileQ.data.display_name ?? "") !== displayName ||
      (profileQ.data.theme_mode ?? "system") !== themeMode ||
      (profileQ.data.accent_color ?? "#6366f1") !== accentColor);

  if (profileQ.isLoading) {
    return (
      <View className="rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="gap-3 rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
        <Text className="text-[15px] font-semibold text-foreground">Profile</Text>

        <Field label="Display name">
          <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        </Field>

        <Field label="Email">
          <Input value={user?.email ?? ""} editable={false} style={{ color: colors.mutedForeground }} />
        </Field>
      </View>

      <View className="gap-3 rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
        <Text className="text-[15px] font-semibold text-foreground">Appearance</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
          Saved to your profile and applied across web + mobile.
        </Text>

        <Field label="Theme">
          <View className="flex-row gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((m) => {
              const active = themeMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setThemeMode(m)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{
                    borderWidth: 1,
                    borderColor: active ? "#6366f1" : colors.border,
                    backgroundColor: active ? "#eef2ff" : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#4338ca" : colors.mutedForeground,
                      fontSize: 13,
                      fontWeight: active ? "600" : "500",
                      textTransform: "capitalize",
                    }}
                  >
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Accent colour">
          <View className="flex-row flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((hex) => {
              const active = accentColor.toLowerCase() === hex;
              return (
                <Pressable
                  key={hex}
                  onPress={() => setAccentColor(hex)}
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: hex,
                    borderWidth: active ? 3 : 0,
                    borderColor: colors.foreground,
                  }}
                  accessibilityLabel={`Accent ${hex}`}
                />
              );
            })}
          </View>
        </Field>
      </View>

      <PrimaryButton
        label={save.isPending ? "Saving…" : "Save changes"}
        loading={save.isPending}
        disabled={!dirty || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
