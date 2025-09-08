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
        // Light theme colors
        light: {
          primary: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
          accent: {
            50: '#fef7ee',
            100: '#fdedd3',
            200: '#fbd6a5',
            300: '#f8b86d',
            400: '#f49332',
            500: '#f1770a',
            600: '#e25d05',
            700: '#bb4208',
            800: '#95350e',
            900: '#792d0f',
          }
        },
        // Dark theme colors (black and gold)
        dark: {
          primary: {
            50: '#f7f7f7',
            100: '#e3e3e3',
            200: '#c8c8c8',
            300: '#a4a4a4',
            400: '#818181',
            500: '#666666',
            600: '#515151',
            700: '#434343',
            800: '#383838',
            900: '#000000', // Pure black
          },
          accent: {
            50: '#fffdf2',
            100: '#fffbe5',
            200: '#fef7c7',
            300: '#feef9e',
            400: '#fde047', // Light gold
            500: '#fcd34d',
            600: '#f59e0b', // Main gold
            700: '#d97706',
            800: '#b45309',
            900: '#92400e', // Dark gold
          }
        },
        // Keep existing for backward compatibility
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