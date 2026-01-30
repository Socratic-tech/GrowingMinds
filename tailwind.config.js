/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#0d9488",  // teal-600
          DEFAULT: "#0f766e", // teal-700
          dark: "#115e59",    // teal-800
          deep: "#134e4a",    // teal-900
        }
      }
    },
  },
  plugins: [],
};
