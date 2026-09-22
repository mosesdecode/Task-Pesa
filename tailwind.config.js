/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e0fff0',
          100: '#b3ffda',
          200: '#80ffc2',
          300: '#4dffaa',
          400: '#00C853',
          500: '#00C853',
          600: '#00a844',
          700: '#008a38',
          800: '#006c2c',
          900: '#004d1f',
          950: '#002e13',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          900: '#050B12',
          800: '#0F172A',
          700: '#1a2540',
          600: '#253350',
        },
        accent: {
          400: '#00E5FF',
          500: '#00E5FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
