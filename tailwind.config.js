/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        caregrid: {
          navy: "#0f172a",
          slate: "#1e293b",
          teal: "#0f766e",
          mint: "#ccfbf1"
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in":    "fade-in 0.4s ease-out forwards",
        "pulse-dot":  "pulse-dot 1.8s ease-in-out infinite",
        "gradient":   "gradient-shift 6s ease infinite"
      }
    }
  },
  plugins: []
};
