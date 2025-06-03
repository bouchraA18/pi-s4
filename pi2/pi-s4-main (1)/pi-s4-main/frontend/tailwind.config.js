/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",   //  ← tells Tailwind to scan all your React code
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
