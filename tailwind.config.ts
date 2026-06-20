import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#080c14',
        'bg-card': '#0f1520',
        'bg-card2': '#131a25',
        'brand-blue': '#3b82f6',
        'brand-emerald': '#10b981',
        'brand-amber': '#f59e0b',
        'brand-purple': '#8b5cf6',
        'brand-pink': '#ec4899',
        'brand-red': '#f43f5e',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
