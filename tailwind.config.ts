import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#080b10",
          800: "#101722",
          700: "#192333",
          600: "#243448",
        },
        accent: {
          cyan: "#22d3ee",
          lime: "#a3e635",
          amber: "#facc15",
        },
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(34, 211, 238, 0.45)",
        panel: "0 24px 70px -46px rgba(8, 14, 24, 0.92)",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "grid-overlay":
          "linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
