import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#111827",
        brand: {
          dark: "#09090b",
          light: "#f8fafc",
          accent: "#18181b",
          border: "#e2e8f0",
          whatsapp: "#25D366",
          instagram: "#E1306C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["var(--font-montserrat)", "sans-serif"],
        display: ["var(--font-montserrat)", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.06)",
        hover: "0 12px 30px -4px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
