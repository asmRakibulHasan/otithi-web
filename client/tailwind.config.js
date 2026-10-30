/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paddy: { DEFAULT: '#1F5B45', dark: '#163F31', soft: '#E6EFE9' },
        mustard: { DEFAULT: '#E3A72F', dark: '#D29817', soft: '#FBF1DA', ink: '#7A4F00' },
        ground: '#FBF8F2',
        ink: '#1B2420',
        muted: '#5B6660',
        line: '#E4DED2',
        field: '#D9D2C3',
        sand: '#F1ECE2',
        danger: { DEFAULT: '#9A2F1A', soft: '#FBE6E1', line: '#E9C4BA' },
        neutral: { soft: '#EEECE7', ink: '#4F5953' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Hind Siliguri"', 'sans-serif'],
        body: ['"Hind Siliguri"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px' },
      boxShadow: {
        card: '0 1px 2px rgba(27,36,32,.04), 0 10px 30px rgba(27,36,32,.06)',
      },
      maxWidth: { wrap: '1240px' },
    },
  },
  plugins: [],
};
