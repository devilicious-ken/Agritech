/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,jsx,ts,tsx}',
      './components/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          'dark-bg': '#121212',
          'dark-card': '#1e1e1e',
          'dark-secondary': '#252525',
          'dark-border': '#333333',
        },
        borderRadius: {
          button: '0.375rem',
        },
      },
    },
    plugins: [],
  }