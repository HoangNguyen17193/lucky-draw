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
        primary: {
          DEFAULT: "#8B0000", // Deep red
          light: "#A52A2A", // Brown red
          dark: "#5C0000", // Darker red
        },
        tet: {
          red: "#DC143C", // Crimson red - main Tết color
          darkRed: "#8B0000", // Dark red
          gold: "#FFD700", // Gold - prosperity
          yellow: "#FFDF00", // Bright yellow
          orange: "#FF8C00", // Orange - luck
          pink: "#FFB6C1", // Cherry blossom pink
          cream: "#FFF8DC", // Cream/ivory
        },
        accent: {
          gold: "#FFD700",
          red: "#DC143C",
          orange: "#FF8C00",
          pink: "#FFB6C1",
        },
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)",
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "sway": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      backgroundImage: {
        "tet-gradient": "linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #A52A2A 100%)",
        "gold-gradient": "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
        "envelope-gradient": "linear-gradient(180deg, #DC143C 0%, #8B0000 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
