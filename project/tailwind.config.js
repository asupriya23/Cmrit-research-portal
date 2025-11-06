/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Re-purpose the existing `maroon` color key across the app to a
        // cool blue / slate theme so existing Tailwind utility classes keep
        // working without changing many files.
        maroon: {
          50: '#f5f7fb',
          100: '#e6eefb',
          200: '#cfe0fb',
          300: '#99c0f6',
          400: '#4f86f6',
          500: '#2563eb', // primary blue
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0f172a',
        },
        gold: {
            // Re-purpose 'gold' into a teal/soft accent palette to match the
            // new blue/gray theme.
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4', // primary teal accent
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};