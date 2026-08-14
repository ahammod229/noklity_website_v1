module.exports = {
  content: [
    './index.html',
    './App.{js,ts,jsx,tsx}',
    './index.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1400px'
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-current-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--text-current-rgb) / <alpha-value>)',
        popover: 'rgb(var(--surface-current-rgb) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--text-current-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-current-rgb) / <alpha-value>)'
      }
    }
  },
  plugins: []
};
