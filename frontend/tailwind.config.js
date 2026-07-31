/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Colors
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          DEFAULT: '#C9A227',
          500: '#C9A227',
          600: '#a88020',
          700: '#856618',
          800: '#624d12',
          900: '#3f310b',
        },
        brand: {
          black: '#000000',
          white: '#FFFFFF',
          gold: '#C9A227',
          'gray-light': '#F8F8F8',
          'gray-medium': '#E5E5E5',
          'gray-dark': '#666666',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-sm': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        'widest-plus': '0.25em',
        'brand': '0.15em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(201, 162, 39, 0.3)',
        'gold-lg': '0 8px 40px rgba(201, 162, 39, 0.4)',
        'luxury': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'luxury-lg': '0 30px 80px rgba(0, 0, 0, 0.2)',
        'product': '0 4px 20px rgba(0,0,0,0.08)',
        'product-hover': '0 12px 40px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'brand': '0',     // Luxury fashion uses sharp corners
        'card': '4px',
      },
      screens: {
        'xs': '480px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A227 0%, #f0d060 50%, #C9A227 100%)',
        'black-gradient': 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      },
    },
  },
  plugins: [],
}
