import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        'background-secondary': '#12121a',
        foreground: '#ffffff',
        'foreground-muted': '#a1a1aa',
        primary: '#00d9ff',
        'primary-hover': '#00b8d9',
        'accent-orange': '#ff6b35',
        'accent-green': '#00ff88',
        'accent-purple': '#a855f7',
        card: '#16161f',
        'card-hover': '#1e1e2a',
        border: '#27272a',
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
};
export default config;
