/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          light: '#8EBBFF',
          DEFAULT: '#4B8BF4',
          dark: '#1E40AF',
        },
        accent: {
          blue: '#1D9BF0',
          lightBlue: '#8EBBFF',
          navy: '#1E3A8A',
          cyan: '#0EA5E9'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-custom': 'linear-gradient(to right, #1E3A8A, #3B82F6, #60A5FA)',
      },
    },
  },
  plugins: [],
}