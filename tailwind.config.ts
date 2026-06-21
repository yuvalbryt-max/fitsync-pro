import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'var(--font-heebo)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background:  '#f4f7fb',
        foreground:  '#0f172a',
        card: {
          DEFAULT:    '#ffffff',
          foreground: '#0f172a',
        },
        primary: {
          DEFAULT:    '#1d4ed8',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT:    '#eef2f8',
          foreground: '#1e293b',
        },
        muted: {
          DEFAULT:    '#eef2f8',
          foreground: '#64748b',
        },
        accent: {
          DEFAULT:    '#e7eefb',
          foreground: '#1d4ed8',
        },
        destructive:  '#dc2626',
        border:       '#e8edf4',
        input:        '#e8edf4',
        ring:         '#1d4ed8',
        brand: {
          DEFAULT: '#1d4ed8',
          soft:    '#e7eefb',
        },
        amber: {
          DEFAULT: '#d97706',
          soft:    '#fef3e2',
        },
        purple: {
          DEFAULT: '#7c3aed',
          soft:    '#f5f3ff',
        },
        green: {
          DEFAULT: '#16a34a',
          soft:    '#f0fdf4',
        },
        red: {
          DEFAULT: '#dc2626',
          soft:    '#fef2f2',
        },
        pink: {
          DEFAULT: '#db2777',
          soft:    '#fdf2f8',
        },
        teal: {
          DEFAULT: '#0d9488',
          soft:    '#f0fdfa',
        },
      },
      borderRadius: {
        sm:   'calc(var(--radius) * 0.6)',
        md:   'calc(var(--radius) * 0.8)',
        lg:   'var(--radius)',
        xl:   'calc(var(--radius) * 1.4)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
      },
    },
  },
  plugins: [],
}

export default config
