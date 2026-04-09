/**
 * Design tokens - Colors
 * Web-first color definitions using Tailwind-compatible format
 */

export const colors = {
  // Primary colors
  primary: "#00ced1",
  accent: "#E533FF",

  // Background colors
  background: {
    light: "#f1f1f4",
    dark: "#17181c",
    darkAlt: "#102222",
  },

  // Surface/Card colors
  surface: {
    dark: "#272935",
    card: "#1b2828",
  },

  // Border colors
  border: {
    dark: "#395556",
    white5: "rgba(255, 255, 255, 0.05)",
    white10: "rgba(255, 255, 255, 0.1)",
    white18: "rgba(255, 255, 255, 0.18)",
    zinc700: "rgba(48, 54, 61, 1)",
  },

  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "#9ca3af",
    tertiary: "#64748b",
    muted: "#475569",
  },

  // Gray scale
  gray: {
    50: "#f9fafb",
    100: "#f1f1f4",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Slate scale
  slate: {
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    800: "#1e293b",
  },

  // Semantic colors
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",

  // Status colors
  status: {
    hidden: "#64748b",
    visible: "#0ea5e9",
    active: "#22c55e",
    votingPhase: "#f59e0b",
    completed: "#10b981",
  },

  // Tile accent colors (per-category)
  tile: {
    // Cyan group: Users, Transactions, Challenges
    users: "#00ced1",
    transactions: "#00ced1",
    challenges: "#00ced1",
    // Magenta group: Coins, Notifications, Rewards
    coins: "#E533FF",
    notifications: "#E533FF",
    rewards: "#E533FF",
    // Slate group: Groups, Activity
    groups: "#94a3b8",
    activity: "#94a3b8",
    schedules: "#94a3b8",
  },

  // Tile accent backgrounds (10% opacity variants)
  tileBackground: {
    users: "rgba(0, 206, 209, 0.1)",
    transactions: "rgba(0, 206, 209, 0.1)",
    challenges: "rgba(0, 206, 209, 0.1)",
    coins: "rgba(229, 51, 255, 0.1)",
    notifications: "rgba(229, 51, 255, 0.1)",
    rewards: "rgba(229, 51, 255, 0.1)",
    groups: "rgba(27, 40, 40, 0.4)",
    activity: "rgba(27, 40, 40, 0.4)",
    schedules: "rgba(27, 40, 40, 0.4)",
  },

  // Opacity variants
  opacity: {
    primary10: "rgba(0, 206, 209, 0.1)",
    primary12: "rgba(0, 206, 209, 0.12)",
    primary20: "rgba(0, 206, 209, 0.2)",
    primary30: "rgba(0, 206, 209, 0.3)",
    primary80: "rgba(0, 206, 209, 0.8)",
    accent10: "rgba(229, 51, 255, 0.1)",
    accent20: "rgba(229, 51, 255, 0.2)",
    accent30: "rgba(229, 51, 255, 0.3)",
    accent80: "rgba(229, 51, 255, 0.8)",
    white90: "rgba(255, 255, 255, 0.9)",
    white70: "rgba(255, 255, 255, 0.7)",
    white40: "rgba(255, 255, 255, 0.4)",
    white20: "rgba(255, 255, 255, 0.2)",
    white10: "rgba(255, 255, 255, 0.1)",
    white5: "rgba(255, 255, 255, 0.05)",
    black40: "rgba(0, 0, 0, 0.4)",
    black12: "rgba(0, 0, 0, 0.12)",
  },

  // Additional color variants for extended palette
  red: {
    300: "#fecaca",
    400: "#f87171",
    700: "#b91c1c",
    900: "#7f1d1d",
  },

  green: {
    400: "#4ade80",
    500: "#22c55e",
    700: "#16a34a",
  },

  blue: {
    100: "#dbeafe",
    400: "#60a5fa",
    500: "#3b82f6",
    700: "#1d4ed8",
  },

  sky: {
    400: "#38bdf8",
    500: "#0ea5e9",
    700: "#0284c7",
  },

  orange: {
    400: "#fb923c",
    500: "#f97316",
    700: "#c2410c",
  },

  yellow: {
    400: "#facc15",
  },

  emerald: {
    400: "#4ade80",
    500: "#22c55e",
    700: "#16a34a",
  },

  zinc: {
    100: "#f4f4f5",
    700: "#52525b",
    800: "#27272a",
    900: "#18181b",
  },
} as const;

export type Colors = typeof colors;
