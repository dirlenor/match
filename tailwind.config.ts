import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-dark": "#222222",
        "text-light": "#FFFFFF",
        "accent": "#7AD038",
      },
      fontFamily: {
        "league-gothic": ["League Gothic", "sans-serif"],
        "lato": ["Lato", "sans-serif"],
        "athiti": ["Athiti", "sans-serif"],
      },
      fontSize: {
        "h1": "167px",
        "h2": "94px",
        "h4": "24px",
        "body": "16px",
      },
      spacing: {
        "layout-x": "16px",
        "layout-y": "50px",
      },
      borderRadius: {
        "input": "4px",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
