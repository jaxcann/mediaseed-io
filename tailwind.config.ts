import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Studio palette — yuruyurau-inspired iridescent pastels on cream.
        // Scoped via `hq-` prefix.
        "hq-cream": "#FAF6F0",
        "hq-cream-soft": "#F3EDE4",
        "hq-ink": "#141319",
        "hq-ink-soft": "#3A3844",
        "hq-pink": "#F6A8D8",
        "hq-pink-deep": "#E85DA8",
        "hq-lav": "#B9A8F5",
        "hq-lav-deep": "#8B72EA",
        "hq-cyan": "#7DD6E8",
        "hq-cyan-deep": "#38B8D8",
        "hq-peach": "#FFC29E",
        "hq-peach-deep": "#FF9A62",
        // DayTapes brand palette — scoped via `daytapes-` prefix to avoid
        // colliding with the studio palette above
        "daytapes-accent": "#E8743C",
        "daytapes-accent-deep": "#C25A24",
        "daytapes-cream": "#F6EFE8",
        "daytapes-cream-soft": "#FBF6EE",
        "daytapes-ink": "#0E0E10",
        "daytapes-ink-soft": "#17211f",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        "tightest": "-0.04em",
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          to: { opacity: "0" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "modal-out": {
          to: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-out": "fade-out 0.22s ease-out both",
        "modal-in": "modal-in 0.34s cubic-bezier(0.22, 1, 0.36, 1) both",
        "modal-out": "modal-out 0.22s cubic-bezier(0.4, 0, 1, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
