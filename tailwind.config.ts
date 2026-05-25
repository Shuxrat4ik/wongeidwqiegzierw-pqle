import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'epic-glow': 'radial-gradient(circle at center, rgba(0, 120, 244, 0.4), transparent 70%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        epic: {
          dark: '#0d0f16',
          darker: '#05070c',
          surface: '#1a1d2e',
          blue: '#0078f4',
          'blue-dark': '#0052cc',
          'blue-light': '#1e90ff',
          text: '#ffffff',
          'text-secondary': '#b3b3b3',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      boxShadow: {
        'epic-sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'epic-md': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'epic-lg': '0 12px 40px rgba(0, 0, 0, 0.4)',
        'epic-xl': '0 20px 60px rgba(0, 0, 0, 0.5)',
        'epic-glow': '0 0 20px rgba(0, 120, 244, 0.4)',
        'epic-glow-lg': '0 0 40px rgba(0, 120, 244, 0.6)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 120, 244, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 120, 244, 0.8)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 120, 244, 0.4), inset 0 0 20px rgba(0, 120, 244, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 120, 244, 0.6), inset 0 0 20px rgba(0, 120, 244, 0.15)' 
          },
        },
        'slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-scale': {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in-scale': 'fade-in-scale 0.4s ease-out',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'epic': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
