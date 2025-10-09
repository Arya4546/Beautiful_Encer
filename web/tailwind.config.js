/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111827", // dark theme
        accent: "#ef4444",  // red accent for CTAs
      },
    },
  },
  plugins: [],
};
