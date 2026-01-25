// Modern dark gray theme inspired by Discord/Slack
const tintColorLight = "#2563eb"; // Deep blue
const tintColorDark = "#60a5fa"; // Lighter blue for dark mode

export default {
  light: {
    text: "#111827", // Gray 900
    textSecondary: "#6b7280", // Gray 500
    background: "#f3f4f6", // Gray 100
    surface: "#ffffff",
    surfacePressed: "#f9fafb", // Gray 50
    border: "#e5e7eb", // Gray 200
    tint: tintColorLight,
    tabIconDefault: "#9ca3af",
    tabIconSelected: tintColorLight,
    error: "#ef4444", // Red 500
    success: "#10b981", // Emerald 500
    warning: "#f59e0b", // Amber 500
    shadow: "#000000",
  },
  dark: {
    text: "#f9fafb", // Gray 50
    textSecondary: "#9ca3af", // Gray 400
    background: "#0f172a", // Slate 900
    surface: "#1e293b", // Slate 800
    surfacePressed: "#334155", // Slate 700
    border: "#334155", // Slate 700
    tint: tintColorDark,
    tabIconDefault: "#64748b", // Slate 500
    tabIconSelected: tintColorDark,
    error: "#f87171", // Red 400
    success: "#34d399", // Emerald 400
    warning: "#fbbf24", // Amber 400
    shadow: "#000000",
  },
};
