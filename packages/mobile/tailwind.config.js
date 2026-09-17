/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-foreground": "#ffffff",
        "primary-soft": "#e0e7ff",
        // Screen sits on subtle off-white so white surfaces pop with soft shadow
        background: "#f7f8fa",
        surface: "#ffffff",
        foreground: "#0f172a",
        "foreground-2": "#334155",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        border: "#e2e8f0",
        destructive: "#ef4444",
        "destructive-soft": "#fee2e2",
        success: "#10b981",
        "success-soft": "#d1fae5",
      },
    },
  },
  plugins: [],
};
