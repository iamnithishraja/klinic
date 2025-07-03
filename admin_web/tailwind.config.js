/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: '#11181C',
        background: '#fff',
        tint: '#2f95dc',
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: '#2f95dc',
      },
    },
  },
  plugins: [],
} 