/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary
        primary: "#00ced1",
        "accent-magenta": "#E533FF",

        // Backgrounds
        "background-light": "#f1f1f4",
        "background-dark": "#17181c",
        "surface-dark": "#23262b",
        "surface-accent": "#2a2e35",
        "card-dark": "#1b2828",

        // Borders
        "border-dark": "#395556",

        // Text
        "text-primary": "#ffffff",
        "text-secondary": "#9ca3af",
        "text-tertiary": "#64748b",
        "text-muted": "#475569",

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
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          800: "#1e293b",
        },

        // Red
        red: {
          400: "#f87171",
          700: "#b91c1c",
          900: "#7f1d1d",
        },

        // Green
        green: {
          500: "#22c55e",
          600: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["IBMPlexSans_400Regular"],
        "sans-light": ["IBMPlexSans_300Light"],
        "sans-medium": ["IBMPlexSans_500Medium"],
        "sans-semibold": ["IBMPlexSans_600SemiBold"],
        "sans-bold": ["IBMPlexSans_700Bold"],
        display: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem", 
        full: "9999px",
      },
      fontSize: {
        'xxs': '10px',
      },
      spacing: {
        '18': '4.5rem',
      },
      boxShadow: {
        "primary": "0 0 15px rgba(0, 206, 209, 0.2)",
        "primary-glow": "0 0 8px rgba(0, 206, 209, 0.5)",
        "primary-lg": "0 0 15px rgba(0, 206, 209, 0.2)",
      },
    },
  },
  plugins: [],
}