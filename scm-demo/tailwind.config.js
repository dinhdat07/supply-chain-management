/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rausch: '#ff385c',
        deepRausch: '#e00b41',
        errorRed: '#c13515',
        errorDark: '#b32505',
        luxePurple: '#460479',
        plusMagenta: '#92174d',
        nearBlack: '#222222',
        focusedGray: '#3f3f3f',
        secondaryGray: '#6a6a6a',
        legalBlue: '#428bff',
        borderGray: '#ebebeb',
        lightSurface: '#f7f7f7',
        pureWhite: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        card: 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px',
        hover: 'rgba(0,0,0,0.08) 0px 4px 12px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        badge: '14px',
        card: '20px',
        large: '32px',
        full: '9999px',
      }
    },
  },
  plugins: [],
}