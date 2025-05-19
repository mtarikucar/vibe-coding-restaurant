/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // New color palette
        cream: {
          50: "#FFFDF9",
          100: "#FFFDF6", // Main background color
          200: "#FDF9ED",
          300: "#FAF6E9", // Secondary background color
          400: "#F5EFD8",
          500: "#F0E8C8",
          600: "#E6DDB8",
          700: "#DCD3A8",
          800: "#D2C998",
          900: "#C8BF88",
        },
        lime: {
          50: "#F5F9E8",
          100: "#EBF3D1",
          200: "#DDEB9D", // Accent color
          300: "#D0E36A",
          400: "#C2DB36",
          500: "#A0C878", // Main primary color
          600: "#8AB45E",
          700: "#74A044",
          800: "#5E8C2A",
          900: "#487810",
        },
        forest: {
          50: "#F0F2EC",
          100: "#E1E5D9",
          200: "#C3CBB3",
          300: "#A5B18D",
          400: "#879767",
          500: "#626F47", // Main secondary color
          600: "#556339",
          700: "#48572B",
          800: "#3B4B1D",
          900: "#2E3F0F",
        },
        // Keep the functional colors but adjust them to match the new palette
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#A0C878", // Updated success color
          600: "#8AB45E",
          700: "#74A044",
          800: "#5E8C2A",
          900: "#487810",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Keep warning color
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Keep danger color
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        // Alias the old primary and secondary to the new colors for backward compatibility
        primary: {
          50: "#F5F9E8",
          100: "#EBF3D1",
          200: "#DDEB9D",
          300: "#D0E36A",
          400: "#C2DB36",
          500: "#A0C878", // Main primary color
          600: "#8AB45E",
          700: "#74A044",
          800: "#5E8C2A",
          900: "#487810",
        },
        secondary: {
          50: "#F0F2EC",
          100: "#E1E5D9",
          200: "#C3CBB3",
          300: "#A5B18D",
          400: "#879767",
          500: "#626F47", // Main secondary color
          600: "#556339",
          700: "#48572B",
          800: "#3B4B1D",
          900: "#2E3F0F",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};
