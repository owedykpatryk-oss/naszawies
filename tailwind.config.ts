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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        mapaReveal: {
          "0%": { opacity: "0", transform: "translateY(22px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        mapaHeroLine: {
          "0%": { transform: "scaleX(0)", opacity: "0.6" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        mapaShimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        mapaRow: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        mapaFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        mapaGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(22, 101, 52, 0.08)" },
          "50%": { boxShadow: "0 12px 48px -8px rgba(22, 101, 52, 0.18)" },
        },
        mapaCardLift: {
          "0%": {
            opacity: "0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            transform: "translateY(14px) scale(0.99)",
          },
          "100%": {
            opacity: "1",
            boxShadow: "0 28px 90px -24px rgba(21, 64, 28, 0.18)",
            transform: "translateY(0) scale(1)",
          },
        },
      },
      animation: {
        "mapa-reveal": "mapaReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "mapa-hero-line": "mapaHeroLine 1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both",
        "mapa-shimmer": "mapaShimmer 2s ease-in-out infinite",
        "mapa-row": "mapaRow 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "mapa-float": "mapaFloat 5s ease-in-out infinite",
        "mapa-glow": "mapaGlow 5s ease-in-out infinite",
        "mapa-card-lift": "mapaCardLift 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
