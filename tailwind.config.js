/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#009639', // Medical Green
          light: '#e6f4ea',
          dark: '#007a2f',
        },
        secondary: {
          DEFAULT: '#0082c3', // Medical Blue
          light: '#e0f2fe',
          dark: '#0369a1',
        },
        medical: {
          grey: '#6b7280',
          dark: '#1f2937',
          light: '#f9fafb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
