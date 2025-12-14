const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        // ============================================
        // SEMANTIC COLOR SYSTEM
        // ============================================
        // Use these tokens throughout the app for consistency
        // and easy theme changes

        // Brand Colors (Primary Actions)
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1", // Main brand color
          600: "#4F46E5", // DEFAULT - slightly darker for better contrast
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },

        // Accent Colors (Secondary Actions, Highlights)
        accent: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#9333EA", // DEFAULT
          700: "#7E22CE",
          800: "#6B21A8",
          900: "#581C87",
          950: "#3B0764",
        },

        // UI Background Colors
        "ui-bg": {
          primary: "#FFFFFF",
          secondary: "#F9FAFB",
          tertiary: "#F3F4F6",
          elevated: "#FFFFFF",
          overlay: "rgba(0, 0, 0, 0.5)",
          // Dark mode
          "primary-dark": "#111827",
          "secondary-dark": "#1F2937",
          "tertiary-dark": "#374151",
          "elevated-dark": "#1F2937",
          "overlay-dark": "rgba(0, 0, 0, 0.75)",
        },

        // UI Text Colors
        "ui-text": {
          primary: "#111827",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
          inverse: "#FFFFFF",
          // Dark mode
          "primary-dark": "#F9FAFB",
          "secondary-dark": "#D1D5DB",
          "tertiary-dark": "#9CA3AF",
          "inverse-dark": "#111827",
        },

        // UI Border Colors
        "ui-border": {
          primary: "#E5E7EB",
          secondary: "#D1D5DB",
          focus: "#4F46E5",
          error: "#EF4444",
          // Dark mode
          "primary-dark": "#374151",
          "secondary-dark": "#4B5563",
          "focus-dark": "#6366F1",
          "error-dark": "#F87171",
        },

        // Status Colors
        status: {
          success: {
            DEFAULT: "#10B981",
            bg: "#D1FAE5",
            text: "#065F46",
            "bg-dark": "#064E3B",
            "text-dark": "#6EE7B7",
          },
          warning: {
            DEFAULT: "#F59E0B",
            bg: "#FEF3C7",
            text: "#92400E",
            "bg-dark": "#78350F",
            "text-dark": "#FCD34D",
          },
          error: {
            DEFAULT: "#EF4444",
            bg: "#FEE2E2",
            text: "#991B1B",
            "bg-dark": "#7F1D1D",
            "text-dark": "#FCA5A5",
          },
          info: {
            DEFAULT: "#3B82F6",
            bg: "#DBEAFE",
            text: "#1E40AF",
            "bg-dark": "#1E3A8A",
            "text-dark": "#93C5FD",
          },
        },

        // Issue Priority Colors
        priority: {
          lowest: "#6B7280",
          low: "#3B82F6",
          medium: "#F59E0B",
          high: "#F97316",
          highest: "#EF4444",
        },

        // Issue Type Colors
        "issue-type": {
          task: "#3B82F6",
          bug: "#EF4444",
          story: "#8B5CF6",
          epic: "#F59E0B",
          subtask: "#6B7280",
        },

        // Legacy support (for gradual migration)
        // These map to the new system
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "flow-1": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        "flow-2": {
          "0%": { strokeDashoffset: "1200" },
          "100%": { strokeDashoffset: "0" },
        },
        "flow-3": {
          "0%": { strokeDashoffset: "1400" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "flow-1": "flow-1 8s linear infinite",
        "flow-2": "flow-2 10s linear infinite",
        "flow-3": "flow-3 9s linear infinite",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
