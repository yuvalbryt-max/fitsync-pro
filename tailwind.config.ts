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
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive:  'var(--destructive)',
        border:       'var(--border)',
        input:        'var(--input)',
        ring:         'var(--ring)',
        brand: {
          DEFAULT: 'var(--brand)',
          soft:    'var(--brand-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft:    'var(--amber-soft)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          soft:    'var(--purple-soft)',
        },
        green: {
          DEFAULT: 'var(--green)',
          soft:    'var(--green-soft)',
        },
        red: {
          DEFAULT: 'var(--red)',
          soft:    'var(--red-soft)',
        },
        pink: {
          DEFAULT: 'var(--pink)',
          soft:    'var(--pink-soft)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          soft:    'var(--teal-soft)',
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
