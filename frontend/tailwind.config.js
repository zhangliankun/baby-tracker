/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF9A8B',
          'primary-light': '#FFB5A7',
          secondary: '#FFD6A5',
          'secondary-light': '#FFF0E0',
        },
        bg: {
          page: '#FFF5F0',
          card: '#FFFFFF',
        },
        'text-primary': '#2D2D2D',
        'text-secondary': '#8E8E93',
        'text-muted': '#C7C7CC',
        'border-light': '#F0F0F0',
        type: {
          feeding: '#FF9A8B',
          sleep: '#7B8CDE',
          diaper: '#FFB347',
          supplement: '#4ECDC4',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
        fab: '0 4px 12px rgba(255,154,139,0.4)',
      },
      fontSize: {
        h1: ['22px', { fontWeight: '700', lineHeight: '1.3' }],
        h2: ['18px', { fontWeight: '600', lineHeight: '1.3' }],
        h3: ['16px', { fontWeight: '500', lineHeight: '1.4' }],
        body: ['14px', { fontWeight: '400', lineHeight: '1.5' }],
        caption: ['12px', { fontWeight: '400', lineHeight: '1.4' }],
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
