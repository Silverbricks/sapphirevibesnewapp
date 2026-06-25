import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1116",
        panel: "#151a21",
        card: "#171c24",
        ink: "#0a0d11",
        gold: {
          DEFAULT: "#C8A45C",
          soft: "#d9bd80",
        },
        cream: "#F4EFE6",
        grey: "#E5E5E5",
        muted: "#8d93a0",
        blue: "#2E5AAC",
        green: "#4caf7d",
        red: "#d96b6b",
        amber: "#d9a94c",
        purple: "#9b7dd4",
      },
      borderColor: {
        line: "rgba(255,255,255,0.07)",
        "line-gold": "rgba(200,164,92,0.2)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "Jost", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        panel: "16px",
      },
      letterSpacing: {
        luxe: "0.18em",
        wide2: "0.14em",
      },
      keyframes: {
        fade: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        slide: {
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fade: "fade 0.35s ease both",
        rise: "rise 1s ease both",
        marquee: "slide 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
