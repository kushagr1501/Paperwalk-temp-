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
        base: "#faf8f4",
        surface: "#ffffff",
        elevated: "#f5f2ed",
        bordercolor: "#e0dbd3",
        accent: "#b05a3a",
        "accent-dim": "#c7856d",
        "accent-light": "#f4ebe6",
        textpri: "#1a1a1a",
        textsec: "#3d3d3d",
        textmuted: "#888580",
        success: "#3a7d44",
        warning: "#a07028",
        error: "#b03a3a",
        "math-highlight": "#fdf6e3",
        codebg: "#f5f2ed",
        "term-underline": "#b05a3a",
      },
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
