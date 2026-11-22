import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-muted": "var(--accent-muted)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        muted: "var(--muted)",
        copper: "#C28E62",
        steel: "#527C91",
        sage: "#6C8B80",
        navy: "#0B1220",
        ivory: "#F6F3EB",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        arabic: ["var(--font-arabic)"],
      },
    },
  },
  plugins: [],
};
export default config;
