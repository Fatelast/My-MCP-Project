import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        table: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
        },
        tile: {
          bg: '#FFF8E7',
          border: '#D4B896',
        },
        man: '#C62828',
        pin: '#1565C0',
        sou: '#2E7D32',
        honor: '#4A148C',
        aka: '#FF1744',
        gold: {
          DEFAULT: '#FFD700',
          dark: '#F9A825',
        },
      },
      animation: {
        'tile-select': 'tileSelect 150ms ease forwards',
        'bounce-in': 'bounceIn 200ms ease-out forwards',
        'pulse-soft': 'pulseSoft 1s ease-in-out infinite',
        'slide-in': 'slideIn 200ms ease-out forwards',
      },
      keyframes: {
        tileSelect: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-8px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
