/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#080808',
        bg2:    '#111',
        bg3:    '#1a1a1a',
        bg4:    '#222',
        green:  '#00C896',
        red:    '#FF4D4D',
        amber:  '#F5A623',
        blue:   '#4A9EFF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
}
