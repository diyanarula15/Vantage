/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        vantage: {
          dark: '#0A0F1A',
          primary: '#2F6BFF',
          accent: '#8A4FFF',
        }
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
      boxShadow: {
        'glow-indigo': '0 0 60px -15px rgba(99, 102, 241, 0.25)',
        'glow-violet': '0 0 60px -15px rgba(139, 92, 246, 0.25)',
      }
    },
  },
  plugins: [],
}