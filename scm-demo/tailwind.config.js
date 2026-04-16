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
      },
      keyframes: {
        slideUpAndFade: {
          from: { opacity: '0', transform: 'translateY(2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRightAndFade: {
          from: { opacity: '0', transform: 'translateX(-2px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideDownAndFade: {
          from: { opacity: '0', transform: 'translateY(-2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeftAndFade: {
          from: { opacity: '0', transform: 'translateX(2px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}