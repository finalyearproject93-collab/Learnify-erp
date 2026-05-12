/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Exact palette from the image ──────────────────────────
        pine: {
          50:  '#eef1e8',   // very light tint
          100: '#d4dcc5',   // light green tint
          200: '#aabb8c',   // soft olive
          300: '#7f9a5a',   // mid olive
          400: '#606C38',   // OLIVE GREEN  ← #606C38
          500: '#4d5630',   // deeper olive
          600: '#3a4024',   // dark olive
          700: '#283618',   // PINE TREE    ← #283618
          800: '#1e2912',   // deeper pine
          900: '#14190b',   // near black green
        },
        cream: {
          DEFAULT: '#FEFAE0', // CORNSILK    ← #FEFAE0
          50:  '#FEFAE0',
          100: '#fdf6c8',
          200: '#fbf0a0',
          300: '#f7e56a',
          400: '#f2d83a',
          500: '#e8c81a',
        },
      },
      fontFamily: {
        sans: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
