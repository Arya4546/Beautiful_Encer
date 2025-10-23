/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',  // Extra small devices
      },
      colors: {
        // Japanese-inspired light pink and magenta palette
        'pink': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        'magenta': {
          light: '#f06292',
          DEFAULT: '#e91e63',
          dark: '#c2185b',
        },
        'background': {
          DEFAULT: '#ffffff',
          secondary: '#fef3f8',
          tertiary: '#fce7f3',
        },
        'text': {
          primary: '#1a1a1a',
          secondary: '#4a4a4a',
          tertiary: '#6b6b6b',
        },
        'border': {
          DEFAULT: '#f3e8ee',
          secondary: '#e5d5e0',
          dark: '#d4c5cf',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(233, 30, 99, 0.08)',
        'medium': '0 4px 16px rgba(233, 30, 99, 0.12)',
        'large': '0 8px 24px rgba(233, 30, 99, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
