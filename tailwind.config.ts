import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0a",
          secondary: "#141414",
          elevated: "#1f1f1f",
        },
        border: {
          DEFAULT: "#2a2a2a",
          hover: "#3a3a3a",
        },
        text: {
          primary: "#f0f0f0",
          secondary: "#888888",
          muted: "#555555",
        },
        accent: {
          DEFAULT: "#f0f0f0",
        },
        status: {
          pending: "#555555",
          selected: "#f0f0f0",
          editing: "#b8860b",
          delivered: "#2e7d32",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        label: "0.1em",
        logo: "0.2em",
        logoXl: "0.3em",
      },
      fontSize: {
        label: ["11px", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        meta: ["12px", { lineHeight: "1.5" }],
        body: ["14px", { lineHeight: "1.6" }],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        full: "9999px",
      },
      keyframes: {
        "pulse-dark": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-dark": "pulse-dark 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
