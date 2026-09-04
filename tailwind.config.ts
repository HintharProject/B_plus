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
          500: "#e63b45",
          600: "#cc2632",
          700: "#a81926",
          900: "#65121a",
        },
      },
      boxShadow: {
        card: "0 12px 40px rgba(82, 31, 35, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
