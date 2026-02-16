/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f40c3f',
        secondary: '#160000',
        surface: {
          DEFAULT: '#1e0505',
          elevated: '#2a0a0a',
        },
        border: {
          DEFAULT: '#3d1515',
          subtle: '#2d0e0e',
        },
        white: '#fff0eb',
        text: {
          secondary: '#b39e9e',
          tertiary: '#7a6565',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
}
