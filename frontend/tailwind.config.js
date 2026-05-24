/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#38bdf8',
        secondary: '#3b82f6',
        accent: '#ED8936',
        'property-primary': '#38bdf8',
        'property-secondary': '#3b82f6',
        'property-light': '#f0f9ff',
        'property-color': '#38bdf8',
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
      backgroundImage: {
        'property-gradient': 'linear-gradient(to bottom right, #38bdf8, #3b82f6)',
      },
    },
  },
  plugins: [],
}
