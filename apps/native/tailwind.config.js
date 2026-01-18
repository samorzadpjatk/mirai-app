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
        primary: "#00ced1",
        "background-light": "#fafafa", 
        "background-dark": "#17191c",
        "surface-dark": "#23262b",
        "surface-accent": "#2a2e35",
      },
      fontFamily: {
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