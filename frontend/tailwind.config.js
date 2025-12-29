/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'success-slide': 'successSlide 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-in',
        'bounce': 'bounce 1.5s infinite',
      },
      keyframes: {
        successSlide: {
          '0%': { transform: 'translateX(100%) scale(0.8)', opacity: '0' },
          '70%': { transform: 'translateX(-10%) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};