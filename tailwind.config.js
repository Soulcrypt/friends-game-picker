/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background
        surface: {
          DEFAULT: '#0a0a0f',
          raised: '#12121a',
          overlay: '#1a1a24',
        },
        // Softer accent palette (Apple-inspired)
        accent: {
          purple: '#A78BFA',      // Softer violet
          blue: '#60A5FA',        // Softer blue
          cyan: '#22D3EE',        // Softer cyan
          // Keep originals for gradients
          'purple-vivid': '#8B5CF6',
          'blue-vivid': '#3B82F6',
        },
        // Rank highlights
        highlight: {
          gold: '#FBBF24',        // Slightly softer gold
          silver: '#9CA3AF',      // Tailwind gray-400
          bronze: '#D97706',      // Tailwind amber-600
        },
        // Glass layers (simplified to 2)
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          elevated: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.12)',
        },
        // Text hierarchy (3 levels)
        text: {
          primary: 'rgba(255, 255, 255, 1)',
          secondary: 'rgba(255, 255, 255, 0.6)',
          tertiary: 'rgba(255, 255, 255, 0.4)',
          muted: 'rgba(255, 255, 255, 0.25)',
        },
      },
      // Spacing scale (8px base)
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px
      },
      // Border radius scale
      borderRadius: {
        'xl': '0.875rem',   // 14px
        '2xl': '1rem',      // 16px
        '3xl': '1.25rem',   // 20px
      },
      // Box shadows (elevation system)
      boxShadow: {
        'glow-sm': '0 0 10px rgba(167, 139, 250, 0.15)',
        'glow-md': '0 0 20px rgba(167, 139, 250, 0.2)',
        'glow-lg': '0 0 30px rgba(167, 139, 250, 0.25)',
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.3)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'elevated-lg': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        DEFAULT: '12px',
        lg: '20px',
        xl: '40px',
      },
      // Unified animation system
      animation: {
        // Micro interactions (150ms)
        'fade-in': 'fadeIn 150ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        // Standard transitions (250ms)
        'slide-up': 'slideUp 250ms ease-out',
        'slide-down': 'slideDown 250ms ease-out',
        'expand': 'expand 250ms ease-out',
        // Emphasis (350ms)
        'pop': 'pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'reveal': 'reveal 350ms ease-out',
        // Continuous
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'float': 'float 8s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        expand: {
          '0%': { opacity: '0', height: '0' },
          '100%': { opacity: '1', height: 'auto' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-10px) translateX(5px)' },
        },
      },
      // Transition timing
      transitionDuration: {
        'micro': '150ms',
        'standard': '250ms',
        'emphasis': '350ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
