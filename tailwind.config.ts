import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class", ".dark-mode-class"],
  content: [
    "./pages/**/*.{js,jsx,ts,tsx,css,,md,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,md,mdx}",
    "./app/**/*.{js,jsx,ts,tsx,css,md,mdx}",
    "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ed6842",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
export default config;
