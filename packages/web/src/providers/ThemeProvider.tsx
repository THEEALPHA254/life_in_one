import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@lio/core/stores/theme";
import { hexToHsl } from "@/lib/utils";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    root.classList.toggle("dark", resolved === "dark");
  }, [mode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", hexToHsl(accent));
    document.documentElement.style.setProperty("--ring", hexToHsl(accent));
  }, [accent]);

  return <>{children}</>;
}
