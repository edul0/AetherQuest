import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aq: {
          bg: "var(--aq-bg)",
          "bg-deep": "var(--aq-bg-deep)",
          "bg-sky": "var(--aq-bg-sky)",
          surface: "var(--aq-surface)",
          "surface-soft": "var(--aq-surface-soft)",
          "surface-glass": "var(--aq-surface-glass)",
          panel: "var(--aq-panel)",
          border: "var(--aq-border)",
          "border-strong": "var(--aq-border-strong)",
          accent: "var(--aq-accent)",
          "accent-soft": "var(--aq-accent-soft)",
          "accent-strong": "var(--aq-accent-strong)",
          nature: "var(--aq-nature)",
          gold: "var(--aq-gold)",
          title: "var(--aq-title)",
          text: "var(--aq-text)",
          "text-muted": "var(--aq-text-muted)",
          "text-subtle": "var(--aq-text-subtle)",
          danger: "var(--aq-danger)",
          success: "var(--aq-success)",
        },
      },
      backgroundColor: {
        "aq-surface": "var(--aq-surface)",
        "aq-panel": "var(--aq-panel)",
        "aq-glass": "var(--aq-surface-glass)",
      },
      borderColor: {
        aq: "var(--aq-border)",
        "aq-strong": "var(--aq-border-strong)",
      },
      textColor: {
        aq: "var(--aq-text)",
        "aq-muted": "var(--aq-text-muted)",
        "aq-subtle": "var(--aq-text-subtle)",
        "aq-title": "var(--aq-title)",
      },
      borderRadius: {
        aq: "var(--aq-radius-md)",
        "aq-sm": "var(--aq-radius-sm)",
        "aq-lg": "var(--aq-radius-lg)",
      },
      boxShadow: {
        "aq-soft": "var(--aq-shadow-soft)",
        "aq-float": "var(--aq-shadow-float)",
      },
      backdropBlur: {
        aq: "var(--aq-blur)",
      },
      maxWidth: {
        "aq-shell": "var(--aq-shell-max)",
      },
      spacing: {
        gutter: "var(--aq-shell-gutter)",
      },
      fontFamily: {
        cinzel: "var(--font-cinzel)",
        lora: "var(--font-lora)",
      },
      transitionTimingFunction: {
        "aq-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
