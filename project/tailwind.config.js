/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#f9f5f6',
          100: '#f4e9ec',
          200: '#e9d3d8',
          300: '#d8adb5',
          400: '#c7868f',
          500: '#b15d68',
          600: '#9a404e',
          700: '#8E354A', // Primary maroon
          800: '#6d2c3e',
          900: '#5c2835',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FFD700', // Primary gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};