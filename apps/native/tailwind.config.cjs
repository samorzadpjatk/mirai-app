/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00ced1",
        "accent-pink": "#E533FF",
        "background-light": "#f1f1f4",
        "background-dark": "#17181c",
        "surface-dark": "#272935",
        "border-dark": "#395556",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
