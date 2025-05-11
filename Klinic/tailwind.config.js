/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: '#4F46E5',
        secondary: '#A5B4FC',
        accent: '#EF4444',
        success: '#34D399',
        warning: '#FBBF24',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        divider: '#E5E7EB',
      },
      fontFamily: {
        'roboto': ['Roboto-Regular'],
        'roboto-bold': ['Roboto-Bold'],
        'opensans': ['OpenSans-Regular'],
        'opensans-bold': ['OpenSans-Bold'],
      },
    },
  },
  plugins: [],
} 