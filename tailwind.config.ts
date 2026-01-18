import type { Config } from 'tailwindcss';

const config: Config = {
  // Class-based dark mode strategy instead of media query
  darkMode: ['class'],

  // Define what files to scan for class usage
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // Border radius using CSS variable for consistency
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // Colors using HSL variables defined in globals.css
      colors: {
        // Base colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Card component colors
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',

        // Popover/dropdown colors
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',

        // Primary action colors
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',

        // Secondary action colors
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',

        // Muted/subtle UI element colors
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',

        // Accent/highlight colors
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',

        // UI element borders
        border: 'hsl(var(--border))',

        // Form input backgrounds
        input: 'hsl(var(--input))',

        // Focus rings
        ring: 'hsl(var(--ring))',
      },
    },
  },
  plugins: [],
};

export default config;