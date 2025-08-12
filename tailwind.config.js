/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand, #0066ff)",
          dark: "var(--brand-dark, #0047b3)",
        },
        "brand-bg": "#F5F7FB",
        "brand-accent": "#111827",
      },
    },
  },
  plugins: [],
};
