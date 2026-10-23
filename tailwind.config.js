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
          darkNavy: '#070F1E',
          navy: '#0B192C',
          slate: '#1E3E62',
          blue: '#0066FF',
          sky: '#0284C7',
          lightSky: '#38BDF8',
          orange: '#FF6B00',
          amber: '#F97316',
          warmRed: '#EA580C',
          accentRed: '#DC2626',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          darkCard: '#0F1B2E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-flow': 'signalFlow 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        signalFlow: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 30px -10px rgba(11, 25, 44, 0.08), 0 4px 6px -2px rgba(11, 25, 44, 0.03)',
        'glow-blue': '0 0 25px -5px rgba(0, 102, 255, 0.25)',
        'glow-orange': '0 0 25px -5px rgba(255, 107, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
