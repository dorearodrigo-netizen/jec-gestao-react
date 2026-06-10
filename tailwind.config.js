/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a2942',
        navy2: '#243756',
        gold: '#c9a84c',
        gold2: '#e8c97a',
        'gold-light': '#fdf6e3',
        teal: '#0d6b55',
        teal2: '#0a5442',
        'teal-light': '#e6f5f1',
        red: '#9b3030',
        'red-light': '#fdf0f0',
        amber: '#7a4910',
        'amber-light': '#fdf3e7',
        bg: '#f7f5f0',
        bg2: '#ede9e0',
        surface: '#ffffff',
        border: '#ddd8ce',
        text: '#1a1a1a',
        text2: '#5a5550',
        text3: '#8a8480',
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        md: '0 4px 24px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        lg: '16px',
      }
    },
  },
  plugins: [],
}
