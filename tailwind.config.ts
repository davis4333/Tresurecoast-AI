import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0E13",
        foreground: "#F8FAFC"
      }
    }
  },
  plugins: []
} satisfies Config;
