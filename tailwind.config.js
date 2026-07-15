/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0E1526',
          light: '#141D33',
        },
        brand: {
          50: '#EEF4FF',
          100: '#DCE9FF',
          200: '#B3D0FF',
          400: '#5B8DFF',
          500: '#2F6FED',
          600: '#2158D1',
          700: '#1A46A8',
        },
        fresh: {
          500: '#16A34A',
          600: '#128a3e',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(14, 21, 38, 0.06)',
        cardHover: '0 8px 24px rgba(14, 21, 38, 0.12)',
      },
    },
  },
  plugins: [],
}
