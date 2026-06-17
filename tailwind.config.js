/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vanta': {
          'bg': '#09090b',
          'card': 'rgba(255,255,255,0.025)',
          'border': 'rgba(255,255,255,0.06)',
          'accent': '#3b82f6',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
