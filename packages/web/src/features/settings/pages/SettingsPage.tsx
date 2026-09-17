import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileSchema, type ProfileInput } from "@lio/core/schemas/profile";
import { keys } from "@lio/core/queries";
import { useThemeStore } from "@lio/core/stores/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GoogleCalendarSection } from "../components/GoogleCalendarSection";

const accentPresets = ["#6366f1", "#10b981", "#f97316", "#ec4899", "#0ea5e9", "#f59e0b"];

export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  const { data: profile, isLoading } = useQuery({
    queryKey: keys.profile.me,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data as ProfileInput & { id: string };
    },
  });

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name ?? "",
      avatar_url: profile?.avatar_url ?? null,
      theme_mode: profile?.theme_mode ?? "system",
      accent_color: profile?.accent_color ?? "#6366f1",
    },
    values: profile
      ? {
          display_name: profile.display_name ?? "",
          avatar_url: profile.avatar_url ?? null,
          theme_mode: profile.theme_mode ?? "system",
          accent_color: profile.accent_color ?? "#6366f1",
        }
      : undefined,
  });

  const themeMode = form.watch("theme_mode");
  const accentColor = form.watch("accent_color");

  useEffect(() => {
    if (themeMode) setMode(themeMode);
  }, [themeMode, setMode]);

  useEffect(() => {
    if (accentColor) setAccent(accentColor);
  }, [accentColor, setAccent]);

  const save = useMutation({
    mutationFn: async (values: ProfileInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: keys.profile.me });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile and appearance.</p>
      </header>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How your account is identified.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" {...form.register("display_name")} aria-invalid={!!form.formState.errors.display_name} />
              {form.formState.errors.display_name ? (
                <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Preview updates instantly; save to persist across devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as const).map((m) => {
                  const active = themeMode === m;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => form.setValue("theme_mode", m, { shouldDirty: true })}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm capitalize transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-accent",
                      )}
                      aria-pressed={active}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent colour</Label>
              <div className="flex flex-wrap items-center gap-2">
                {accentPresets.map((hex) => {
                  const active = accentColor?.toLowerCase() === hex;
                  return (
                    <button
                      type="button"
                      key={hex}
                      aria-label={`Accent ${hex}`}
                      onClick={() => form.setValue("accent_color", hex, { shouldDirty: true })}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-transform",
                        active ? "border-foreground scale-110" : "border-transparent",
                      )}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
                <Input
                  id="accent_color"
                  type="color"
                  className="h-10 w-14 cursor-pointer p-1"
                  {...form.register("accent_color")}
                />
              </div>
              {form.formState.errors.accent_color ? (
                <p className="text-xs text-destructive">{form.formState.errors.accent_color.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <GoogleCalendarSection />
    </div>
  );
}
