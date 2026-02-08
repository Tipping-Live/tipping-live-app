import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Light base */
        bg: "#FBFBFE",
        text: "#0B1020",
        muted: "rgba(11,16,32,0.68)",
        subtle: "rgba(11,16,32,0.52)",

        /** Surfaces */
        panel: "rgba(255,255,255,0.86)",
        panel2: "rgba(255,255,255,0.94)",
        border: "rgba(11,16,32,0.10)",
        border2: "rgba(11,16,32,0.16)",
        overlay: "rgba(3, 6, 16, 0.35)",

        /** Logo palette */
        brand: {
          amber: "#FFAD5B",
          coral: "#FF4E44",
          purple: "#E1A2FA",
        },

        /** Semantic */
        primary: "#FF4E44", // donate / primary CTA (high contrast on light)
        secondary: "#FFAD5B", // warm supportive accents
        accent: "#E1A2FA", // friendly highlight (chips, links, focus)
        danger: "#FF4E44",
        success: "#16A34A",
        warning: "#FFAD5B",
        info: "#2563EB",

        /** Focus ring */
        ring: "rgba(255,78,68,0.35)",
      },

      boxShadow: {
        panel: "0 12px 28px rgba(11,16,32,0.10)",
        glow: "0 0 0 1px rgba(11,16,32,0.06), 0 14px 40px rgba(11,16,32,0.10)",
        glowCoral: "0 0 0 1px rgba(255,78,68,0.14), 0 18px 50px rgba(255,78,68,0.12)",
        glowAmber: "0 0 0 1px rgba(255,173,91,0.14), 0 18px 50px rgba(255,173,91,0.12)",
        glowPurple: "0 0 0 1px rgba(225,162,250,0.18), 0 18px 55px rgba(225,162,250,0.14)",
      },

      backgroundImage: {
        /**
         * Light hero background: airy + hopeful, subtle color washes from logo palette
         * (works well behind white cards)
         */
        "app-radial":
          "radial-gradient(1200px 820px at 18% 10%, rgba(225,162,250,0.30), rgba(255,255,255,0)), radial-gradient(980px 680px at 82% 22%, rgba(255,173,91,0.24), rgba(255,255,255,0)), radial-gradient(760px 560px at 62% 86%, rgba(255,78,68,0.14), rgba(255,255,255,0))",

        /** CTA / badge gradient */
        "brand-gradient":
          "linear-gradient(135deg, rgba(255,78,68,1) 0%, rgba(255,173,91,1) 55%, rgba(225,162,250,1) 100%)",
        "brand-soft":
          "linear-gradient(135deg, rgba(255,78,68,0.14) 0%, rgba(255,173,91,0.16) 55%, rgba(225,162,250,0.20) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
