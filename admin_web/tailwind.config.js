/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: '#1a2233',
        background: '#f8fafc',
        primary: '#2563eb', // blue-600
        secondary: '#22c55e', // green-500
        accent: '#2f95dc', // custom blue
        muted: '#e5e7eb', // gray-200
        border: '#d1d5db', // gray-300
        card: '#fff',
        icon: '#64748b', // gray-500
        danger: '#ef4444', // red-500
        warning: '#f59e42', // orange-400
        success: '#22c55e', // green-500
        info: '#38bdf8', // sky-400
        tabIconDefault: '#64748b',
        tabIconSelected: '#2563eb',
      },
    },
  },
  plugins: [],
} 