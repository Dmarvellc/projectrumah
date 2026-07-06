/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F4EE",
        ink: {
          DEFAULT: "#171311",
          soft: "#4B443D",
          faint: "#6C6459",
        },
        pine: {
          50: "#f0f5f1",
          100: "#dbe8df",
          200: "#b9d2c1",
          300: "#8fb59d",
          400: "#5f9173",
          500: "#3d7256",
          600: "#2a5a42",
          700: "#214735",
          800: "#1b392b",
          900: "#152d22",
        },
        sand: {
          50: "#faf6ef",
          100: "#f1e7d6",
          200: "#e2cca8",
          300: "#cfac74",
          400: "#bd9150",
          500: "#a8763e",
          600: "#8c5f33",
          700: "#6f4a2c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Identitas baru: satu keluarga huruf (Nunito Sans) untuk semuanya.
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,19,17,.04), 0 12px 32px -16px rgba(23,19,17,.18)",
        lift: "0 8px 40px -12px rgba(23,19,17,.28)",
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
