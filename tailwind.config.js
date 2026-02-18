/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
        'large': '1440px',
      },
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          sunken: 'rgb(var(--color-surface-sunken) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
        },
        white: 'rgb(var(--color-white) / <alpha-value>)',
        text: {
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        'code-bg': 'rgb(var(--color-code-bg) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
      fontSize: {
        'micro': ['8px', { lineHeight: '1.2', letterSpacing: '0.1em' }],
        'mini': ['10px', { lineHeight: '1.3' }],
        'nav': ['11px', { lineHeight: '1.3', letterSpacing: '0.08em' }],
      },
      zIndex: {
        'sticky': '10',
        'modal': '50',
        'overlay': '60',
        'skiplink': '100',
        'tour-overlay': '9000',
        'tour-tooltip': '9001',
      },
      width: {
        'sidebar': '20rem',
      },
      spacing: {
        'indent': '16px',
      },
    },
  },
  plugins: [],
}
