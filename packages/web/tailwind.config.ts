import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'hsl(var(--surface))',
        text: 'hsl(var(--text))',
        muted: 'hsl(var(--muted))',
        border: 'hsl(var(--border))',
        accent: 'hsl(var(--accent))',
        accentSoft: 'hsl(var(--accent-soft))',
      },
      boxShadow: {
        card: '0 12px 28px -14px rgb(0 0 0 / 0.28)',
      },
    },
  },
  plugins: [animate],
}

export default config
