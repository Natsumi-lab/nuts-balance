import type { Config } from "tailwindcss";

const config: Config = {
  // ダークモードは「class方式」：.dark が付いた要素配下で dark: が有効
  darkMode: ["class", ".dark"],

  // Tailwind がクラスを抽出する対象ファイル
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],

  theme: {
    extend: {
      // shadcn/ui 等で使う radius を CSS 変数で統一
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // globals.css で定義した CSS 変数（HSL）を Tailwind の色として利用
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",

        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",

        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",

        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",

        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",

        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },

  plugins: [],
};

export default config;
