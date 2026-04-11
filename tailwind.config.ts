import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ============================================
      // FONTS - Premium Typography
      // ============================================
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        display: [
          'SF Pro Display',
          'Inter',
          '-apple-system',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        playfair: ['Playfair Display', 'Georgia', 'serif'],
      },
      
      // ============================================
      // FONT WEIGHTS - Including Ultra-Light
      // ============================================
      fontWeight: {
        'ultra-light': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      
      // ============================================
      // LETTER SPACING - Typography Refinement
      // ============================================
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.05em',
        'wider': '0.1em',
        'widest': '0.15em',
        'caps': '0.2em',
      },
      
      // ============================================
      // COLORS - Extended with Glass & Premium
      // ============================================
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          light: "hsl(var(--error-light))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          light: "hsl(var(--info-light))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Glass colors for premium effects
        glass: {
          light: "rgba(255, 255, 255, 0.72)",
          "light-solid": "rgba(255, 255, 255, 0.92)",
          "light-subtle": "rgba(255, 255, 255, 0.5)",
          dark: "rgba(28, 28, 30, 0.72)",
          "dark-solid": "rgba(38, 38, 40, 0.85)",
          "dark-subtle": "rgba(255, 255, 255, 0.04)",
        },
        // Text colors (Apple-style)
        text: {
          primary: {
            light: "#1D1D1F",
            dark: "#F5F5F7",
          },
          secondary: {
            light: "#86868B",
            dark: "#A1A1A6",
          },
          tertiary: {
            light: "#AEAEB2",
            dark: "#6E6E73",
          },
        },
      },
      
      // ============================================
      // BACKDROP BLUR - For Glassmorphism
      // ============================================
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
        glass: '40px',
      },
      
      // ============================================
      // BOX SHADOWS - Premium Multi-Layer
      // ============================================
      boxShadow: {
        // Light mode shadows
        'glass-sm': '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'glass-md': '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
        
        // Dark mode shadows
        'glass-dark-sm': '0 2px 12px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)',
        'glass-dark-md': '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
        'glass-dark-lg': '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)',
        
        // Glow shadows for accents
        'glow-cyan': '0 8px 32px rgba(6, 182, 212, 0.4)',
        'glow-purple': '0 8px 32px rgba(139, 92, 246, 0.4)',
        'glow-green': '0 8px 32px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 8px 32px rgba(245, 158, 11, 0.4)',
        'glow-red': '0 8px 32px rgba(239, 68, 68, 0.4)',
        
        // Inset for dark mode depth
        'inset-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'inset-dark': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      
      // ============================================
      // BORDER RADIUS - Premium Rounded
      // ============================================
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "xl": "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
        "pill": "100px",
      },
      
      // ============================================
      // BORDER WIDTH - Ultra-thin for glass
      // ============================================
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '0.5': '0.5px',
        '1': '1px',
        '2': '2px',
      },
      
      // ============================================
      // TRANSITIONS - Premium Timing
      // ============================================
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      
      // ============================================
      // KEYFRAMES - Enhanced Animations
      // ============================================
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "progress-fill": {
          from: { strokeDashoffset: "100" },
          to: { strokeDashoffset: "var(--progress-offset)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(6, 182, 212, 0.6)" },
        },
      },
      
      // ============================================
      // ANIMATIONS - Enhanced
      // ============================================
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "count-up": "count-up 0.5s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-soft": "pulse-soft 2s infinite ease-in-out",
        "float": "float 3s infinite ease-in-out",
        "glow-pulse": "glow-pulse 2s infinite ease-in-out",
      },
      
      // ============================================
      // SPACING - Additional values
      // ============================================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
