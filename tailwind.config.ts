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
        ink: "#251c1d",
        cream: "#fffaf7",
        brand: {
          50: "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc7ca",
          300: "#ff9ba1",
          400: "#f05560",
          500: "#e63b45",
          600: "#cc2632",
          700: "#a81926",
          900: "#65121a",
        },
      },
      boxShadow: {
        card: "0 12px 40px rgba(82, 31, 35, 0.08)",
        glow: "0 0 30px rgba(204, 38, 50, 0.35)",
        "glow-sm": "0 0 16px rgba(204, 38, 50, 0.25)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.75)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "fade-up-delay": "fade-up 0.6s ease-out 0.15s both",
        "fade-up-delay-2": "fade-up 0.6s ease-out 0.3s both",
        "fade-up-delay-3": "fade-up 0.6s ease-out 0.45s both",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
