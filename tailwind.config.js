/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "Inter", "ui-sans-serif", "system-ui"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        space: {
          bg: "#0a0d1a",
          glow: "#8ab4ff",
          accent: "#a78bfa",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(138,180,255,.25)",
      },
    },
  },
  plugins: [],
}
