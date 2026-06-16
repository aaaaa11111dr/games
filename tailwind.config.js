/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        'songti': ['SimSun', 'STSong', 'Songti SC', 'serif'],
        'heiti': ['SimHei', 'STHeiti', 'Heiti SC', 'sans-serif'],
        'newspaper': ['Georgia', 'Times New Roman', 'SimSun', 'serif'],
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        newspaper: {
          bg: '#FFFFFF',
          text: '#000000',
          secondary: '#666666',
          border: '#CCCCCC',
          accent: '#1A1A1A',
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      lineHeight: {
        'newspaper': '1.8',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};
