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
          50: '#f0f3ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        slate: {
          850: '#1e293b',
        }
      },
      backgroundImage: {
        'gradient-app': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-accent': 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
        'gradient-card-hero': 'linear-gradient(135deg, #ffffff 0%, #f4f4fe 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(99, 102, 241, 0.08)',
        'card-hover': '0 14px 30px rgba(79, 70, 229, 0.12)',
      }
    },
  },
  plugins: [],
}
