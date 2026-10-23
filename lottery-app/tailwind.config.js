/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A73E8',
          deepBlue: '#0052CC',
          sky: '#38BDF8',
          navy: '#0B1E36',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'phone': '0 25px 60px -15px rgba(0, 82, 204, 0.25), 0 0 0 12px #181c24, 0 0 0 14px #2e384d',
        'soft': '0 10px 25px -5px rgba(0, 102, 255, 0.1), 0 8px 10px -6px rgba(0, 102, 255, 0.05)',
        'btn': '0 6px 16px 0 rgba(0, 102, 255, 0.35)',
      }
    },
  },
  plugins: [],
}
