// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens do protótipo — mapeados exatamente
        'bg-deep':    '#1a0a2e',
        'bg-mid':     '#200c3d',
        'bg-card':    '#2a1052',
        'bg-header':  '#341465',
        border:       '#4a2080',
        pink:         '#e91e8c',
        'pink-soft':  '#f06cb8',
        teal:         '#00bcd4',
        'purple-text':'#b39ddb',
        'purple-dim': '#7e57c2',
        fg:           '#f0e6ff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '0.5px',
      },
    },
  },
  plugins: [],
} satisfies Config;
