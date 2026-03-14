/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Override ALL rounded-* classes to be sharp like Lovable
    borderRadius: {
      'none': '0px',
      'sm': '1px',
      DEFAULT: '2px',
      'md': '2px',
      'lg': '3px',
      'xl': '3px',
      '2xl': '4px',
      '3xl': '4px',
      '4xl': '4px',
      'full': '9999px', // keep for avatars only
    },
    extend: {
      fontFamily: {
        display: ['var(--font-rajdhani)', 'Rajdhani', 'sans-serif'],
        body: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        sans: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        'mono-game': ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },
      colors: {
        // Cyberpunk neon palette
        surface: {
          DEFAULT: '#171E2A',       // Surface 1
          raised: '#1F2A38',        // Surface 2
          hover: '#2A384B',         // Surface hover
        },
        // Primary accent — Purple neon
        primary: {
          DEFAULT: '#BF5FFF',       // Purple neon
          hover: '#D18AFF',         // Hover state
        },
        // Vote / success green neon
        vote: {
          DEFAULT: '#27FF7A',       // Green neon
          hover: '#50FF9B',
        },
        // Secondary accents
        cyan: '#00E5F5',
        pink: '#FF3DD9',
        // Rank highlights — premium metals
        highlight: {
          gold: '#F5C451',
          silver: '#C9CED6',
          bronze: '#B47C4A',
        },
        // Text hierarchy
        text: {
          primary: '#E6EBF5',
          secondary: '#96A4B9',
          tertiary: '#5A697D',
          muted: '#3C485A',
        },
        // shadcn/ui compatibility tokens (HSL CSS vars)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // Spacing scale (8pt grid)
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px
        '22': '5.5rem',     // 88px
      },
      // Box shadows — neon glow
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'md': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
        'lg': '0 10px 30px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3)',
        'xl': '0 20px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.3)',
        'card': '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 12px 36px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
        'card-lift': '0 20px 48px rgba(0,0,0,0.65), 0 8px 20px rgba(0,0,0,0.4)',
        // Neon glow — purple
        'glow-sm': '0 0 12px rgba(191,95,255,0.3)',
        'glow-md': '0 0 24px rgba(191,95,255,0.4)',
        'glow-lg': '0 0 36px rgba(191,95,255,0.45)',
        'glow-primary': '0 0 16px rgba(191,95,255,0.45), 0 0 32px rgba(191,95,255,0.18)',
        'glow-gold': '0 0 24px rgba(245,196,81,0.35), 0 0 48px rgba(245,196,81,0.15)',
        // Legacy compat
        'elevated': '0 4px 20px rgba(0,0,0,0.5)',
        'elevated-lg': '0 8px 30px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
        DEFAULT: '20px',
        lg: '25px',
        xl: '32px',
        '2xl': '40px',
      },
      // Typography
      letterSpacing: {
        'tighter': '-0.025em',
        'tight': '-0.015em',
        'title': '0.02em',      // Cyberpunk display
        'normal': '0em',
        'label': '0.04em',      // Metadata labels
        'wider': '0.08em',      // Uppercase labels
        'widest': '0.15em',
      },
      lineHeight: {
        'relaxed': '1.6',
        'loose': '1.75',
      },
      fontSize: {
        'hero': ['2.75rem', { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '700' }],
        'section': ['1.375rem', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '600' }],
        'card-title': ['1.0625rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '600' }],
        'meta': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.04em', fontWeight: '400' }],
      },
      // Animation system — keep all existing keyframes
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'slide-up': 'slideUp 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'expand': 'expand 250ms ease-out',
        'pop': 'pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'reveal': 'reveal 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'float': 'float 10s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
        'gold-shimmer': 'goldShimmer 7s ease-in-out infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'glow-pulse': 'neonPulse 3s ease-in-out infinite',
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
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        expand: {
          '0%': { opacity: '0', height: '0' },
          '100%': { opacity: '1', height: 'auto' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)' },
          '65%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        goldShimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-12px) translateX(6px)' },
        },
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(191,95,255,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(191,95,255,0.8), 0 0 40px rgba(191,95,255,0.3)' },
        },
      },
      // Transition timing
      transitionDuration: {
        'instant': '75ms',
        'micro': '150ms',
        'fast': '200ms',
        'standard': '250ms',
        'normal': '250ms',
        'slow': '350ms',
        'emphasis': '350ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'apple': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      maxWidth: {
        'layout': '1240px',
      },
    },
  },
  plugins: [],
}
