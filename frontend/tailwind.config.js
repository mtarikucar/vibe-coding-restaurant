/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // New color palette based on: 89A8B2, B3C8CF, E5E1DA, F1F0E8
        neutral: {
          50: "#F9F8F7",
          100: "#F1F0E8", // Main background color (lightest)
          200: "#E8E6DF",
          300: "#E5E1DA", // Secondary background color
          400: "#D8D3C8",
          500: "#C8C1B2",
          600: "#B8AF9C",
          700: "#A89D86",
          800: "#6B6B6B",
          900: "#4A4A4A",
        },
        primary: {
          50: "#F4F6F7",
          100: "#E9ECEF",
          200: "#D4DADF",
          300: "#B3C8CF", // Primary accent color
          400: "#9FB8C1",
          500: "#8BA8B3",
          600: "#89A8B2", // Main primary color (darkest)
          700: "#7A969F",
          800: "#6B848C",
          900: "#5C7279",
        },
        secondary: {
          50: "#F6F7F8",
          100: "#EDEEF0",
          200: "#DBDDE1",
          300: "#C9CCD2",
          400: "#B7BBC3",
          500: "#A5AAB4",
          600: "#9399A5",
          700: "#818896",
          800: "#6B7280",
          900: "#4B5563",
        },
        // Functional colors adjusted to match the new palette
        success: {
          50: "#F0F7F4",
          100: "#E1EFE9",
          200: "#C3DFD3",
          300: "#A5CFBD",
          400: "#87BFA7",
          500: "#69AF91",
          600: "#5A9A7D",
          700: "#4B8569",
          800: "#3C7055",
          900: "#2D5B41",
        },
        warning: {
          50: "#FDF8F0",
          100: "#FBF1E1",
          200: "#F7E3C3",
          300: "#F3D5A5",
          400: "#EFC787",
          500: "#EBB969",
          600: "#D4A55A",
          700: "#BD914B",
          800: "#A67D3C",
          900: "#8F692D",
        },
        danger: {
          50: "#FDF2F2",
          100: "#FBE5E5",
          200: "#F7CBCB",
          300: "#F3B1B1",
          400: "#EF9797",
          500: "#EB7D7D",
          600: "#D47070",
          700: "#BD6363",
          800: "#A65656",
          900: "#8F4949",
        },
        info: {
          50: "#F4F6F7",
          100: "#E9ECEF",
          200: "#D4DADF",
          300: "#B3C8CF",
          400: "#9FB8C1",
          500: "#8BA8B3",
          600: "#89A8B2",
          700: "#7A969F",
          800: "#6B848C",
          900: "#5C7279",
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
