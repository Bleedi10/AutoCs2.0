import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        primary: '#28C7C4', // main brand / action
        primaryAlt: '#1CB4B1', // alternative shade for hover
        secondary: '#0f172a', // deep blue (petroleum)
        accent: '#0f172a',
        success: '#16a34a',
        warning: '#b45309',
        error: '#b91c1c',
        // Neutrals
        background: '#f8fafc',
        foreground: '#0f172a',
        textSecondary: '#64748b',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        move: 'move 5s linear infinite',
        'spin-circle': 'spin-circle 3s linear infinite',
      },
      keyframes: {
        move: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(200px)' },
        },
        'spin-circle': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
