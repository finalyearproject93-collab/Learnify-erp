/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Beige & dark grey palette — matches the Wells reference image
        primary: {
          50:  '#f5f0eb',  // lightest beige tint (page backgrounds)
          100: '#ede5d8',  // light beige (hover states, subtle fills)
          200: '#ddd0bc',  // soft beige (borders, dividers)
          300: '#c9b89a',  // mid beige (muted accents)
          400: '#b09a78',  // warm tan
          500: '#8c7355',  // medium brown-beige (secondary actions)
          600: '#6b5540',  // dark warm brown (primary buttons, links)
          700: '#4a3a2b',  // deep brown
          800: '#2e2318',  // very dark brown
          900: '#1a1410',  // near black brown
        },
        // Dark grey scale for text and UI chrome
        charcoal: {
          50:  '#f4f4f3',
          100: '#e8e7e5',
          200: '#d1cfcc',
          300: '#b0ada8',
          400: '#8a8680',
          500: '#6b6760',
          600: '#524f49',
          700: '#3a3833',
          800: '#2a2825',  // main dark grey (headings, sidebar)
          900: '#1c1b18',  // deepest dark (body text)
        },
        beige: {
          DEFAULT: '#e8ddd0',  // main beige background
          light:   '#f2ece4',  // lighter beige (cards)
          dark:    '#d4c5b0',  // darker beige (borders)
        }
      },
      fontFamily: {
        sans: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
