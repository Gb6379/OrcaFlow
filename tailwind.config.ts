import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4EFE4",
        cream: "#FBF7F0",
        ink: "#141C18",
        forest: {
          DEFAULT: "#0B5F4B",
          dark: "#073D32",
          mid: "#147A62",
          mist: "#DCEEE8",
        },
        ember: {
          DEFAULT: "#D4511A",
          dark: "#A63C12",
          soft: "#F6D5C4",
        },
        sand: "#E6D7C3",
        gold: "#C4A574",
        mute: "#5E6A64",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 18px 50px -20px rgba(20, 28, 24, 0.35)",
        card: "0 8px 30px -12px rgba(20, 28, 24, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
