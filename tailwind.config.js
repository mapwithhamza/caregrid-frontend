/** @type {import('tailwindcss').Config} */
export default {
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
      }
    }
  },
  plugins: []
};
