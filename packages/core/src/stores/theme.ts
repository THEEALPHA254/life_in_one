import { create } from "zustand";
import type { ThemeMode } from "../types";

interface ThemeState {
  mode: ThemeMode;
  accent: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  accent: "#6366f1",
  setMode: (mode) => set({ mode }),
  setAccent: (accent) => set({ accent }),
}));
