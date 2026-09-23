import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance, View } from "react-native";
import { vars } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@lio/core";
import type { ProfileInput } from "@lio/core/schemas/profile";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

type ThemeMode = "light" | "dark" | "system";
type EffectiveMode = "light" | "dark";

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  background: string;
  surface: string;
  foreground: string;
  foreground2: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  destructiveSoft: string;
  success: string;
}

// Hex values used by useThemeColors() for inline styles.
const LIGHT: ThemeColors = {
  primary: "#6366f1",
  primaryForeground: "#ffffff",
  primarySoft: "#e0e7ff",
  background: "#f7f8fa",
  surface: "#ffffff",
  foreground: "#0f172a",
  foreground2: "#334155",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  destructive: "#ef4444",
  destructiveSoft: "#fee2e2",
  success: "#10b981",
};

const DARK: ThemeColors = {
  primary: "#818cf8",
  primaryForeground: "#ffffff",
  primarySoft: "#3730a3",
  background: "#030712",
  surface: "#111827",
  foreground: "#f8fafc",
  foreground2: "#e2e8f0",
  muted: "#1e293b",
  mutedForeground: "#94a3b8",
  border: "#334155",
  destructive: "#f87171",
  destructiveSoft: "#7f1d1d",
  success: "#34d399",
};

// Same values as ThemeColors but as space-separated RGB strings, injected as
// CSS variables via vars() so `rgb(var(--color-X) / <alpha>)` tokens in
// tailwind.config resolve at runtime.
const LIGHT_VARS = {
  "--color-primary": "99 102 241",
  "--color-primary-fg": "255 255 255",
  "--color-primary-soft": "224 231 255",
  "--color-background": "247 248 250",
  "--color-surface": "255 255 255",
  "--color-foreground": "15 23 42",
  "--color-foreground-2": "51 65 85",
  "--color-muted": "241 245 249",
  "--color-muted-fg": "100 116 139",
  "--color-border": "226 232 240",
  "--color-destructive": "239 68 68",
  "--color-destructive-soft": "254 226 226",
  "--color-success": "16 185 129",
  "--color-success-soft": "209 250 229",
} as const;

const DARK_VARS = {
  "--color-primary": "129 140 248",
  "--color-primary-fg": "255 255 255",
  "--color-primary-soft": "55 48 163",
  "--color-background": "3 7 18",
  "--color-surface": "17 24 39",
  "--color-foreground": "248 250 252",
  "--color-foreground-2": "226 232 240",
  "--color-muted": "30 41 59",
  "--color-muted-fg": "148 163 184",
  "--color-border": "51 65 85",
  "--color-destructive": "248 113 113",
  "--color-destructive-soft": "127 29 29",
  "--color-success": "52 211 153",
  "--color-success-soft": "6 78 59",
} as const;

interface ThemeContextValue {
  mode: ThemeMode;
  effective: EffectiveMode;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  effective: "light",
  colors: LIGHT,
});

function resolveEffective(mode: ThemeMode, systemScheme: EffectiveMode): EffectiveMode {
  return mode === "system" ? systemScheme : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const profileQ = useQuery({
    queryKey: queries.keys.profile.me,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data as ProfileInput & { id: string };
    },
  });

  const mode = (profileQ.data?.theme_mode ?? "system") as ThemeMode;

  const [systemScheme, setSystemScheme] = useState<EffectiveMode>(
    () => (Appearance.getColorScheme() === "dark" ? "dark" : "light"),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: cs }) => {
      setSystemScheme(cs === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  const effective = resolveEffective(mode, systemScheme);

  // NOTE: intentionally do NOT call `colorScheme.set(effective)` here.
  // NativeWind's colorScheme.set() calls Appearance.setColorScheme() under the
  // hood, which OVERRIDES what the OS reports. So flipping Light → System
  // would leave getColorScheme() stuck on "light" instead of returning to the
  // OS's actual scheme. Our theming goes entirely through vars() + the
  // useThemeColors() hook — no `dark:` variants exist in the codebase — so
  // colorScheme.set() adds no value and only breaks system-mode behavior.

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, effective, colors: effective === "dark" ? DARK : LIGHT }),
    [mode, effective],
  );

  // vars() creates a style object that scopes CSS variables to descendants.
  // Every tailwind class using rgb(var(--color-X)) picks these up.
  const themeVars = effective === "dark" ? DARK_VARS : LIGHT_VARS;

  return (
    <ThemeContext.Provider value={value}>
      <View style={vars(themeVars)} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}
