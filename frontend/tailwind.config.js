/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f4f3f7',
          100: '#eae8f0',
          200: '#d5d1e1',
          300: '#b5afc8',
          400: '#9088ad',
          500: '#736695',
          600: '#5f5279',
          700: '#4e4364',
          800: '#423a55',
          900: '#3a3349',
          950: '#1e1a2e',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f3d0fe',
          300: '#e9a8fd',
          400: '#d970fa',
          500: '#c341f0',
          600: '#a621d3',
          700: '#8b18ae',
          800: '#74198e',
          900: '#611a74',
        },
        jade: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-accent': '0 0 20px rgba(195,65,240,0.35)',
        'glow-jade': '0 0 20px rgba(16,185,129,0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
