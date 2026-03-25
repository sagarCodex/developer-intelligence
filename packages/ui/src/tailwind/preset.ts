import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#111111',
        'surface-hover': '#1A1A1A',
        elevated: '#222222',
        border: '#262626',
        'border-hover': '#333333',
        accent: '#00E5C8',
        'accent-hover': '#00C9AF',
        'accent-muted': 'rgba(0, 229, 200, 0.15)',
        danger: '#FF4444',
        'danger-muted': 'rgba(255, 68, 68, 0.15)',
        warning: '#FFB800',
        'warning-muted': 'rgba(255, 184, 0, 0.15)',
        success: '#00E5C8',
        info: '#3B82F6',
        'text-primary': '#E0E0E0',
        'text-secondary': '#888888',
        'text-muted': '#444444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(0, 229, 200, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 16px rgba(0, 229, 200, 0.6)',
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(circle, #262626 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
};

export default preset;
