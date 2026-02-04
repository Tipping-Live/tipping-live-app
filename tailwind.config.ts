import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#070A12',
        text: '#E7E9EE',
        panel: 'rgba(9, 12, 22, 0.72)',
        border: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        panel: '0 10px 30px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'app-radial':
          'radial-gradient(1200px 800px at 20% 10%, rgba(124, 58, 237, 0.20), rgba(0,0,0,0)), radial-gradient(900px 600px at 80% 30%, rgba(59, 130, 246, 0.16), rgba(0,0,0,0))',
      },
    },
  },
  plugins: [],
};
export default config;