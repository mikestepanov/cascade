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
        // TIER 2 SEMANTIC COLOR SYSTEM
        // All values reference CSS custom properties
        // defined in index.css via light-dark().
        // ============================================

        // Shared Palette (10 named colors × 3 variants)
        palette: {
          blue: { DEFAULT: "var(--color-palette-blue)", bg: "var(--color-palette-blue-bg)", text: "var(--color-palette-blue-text)" },
          red: { DEFAULT: "var(--color-palette-red)", bg: "var(--color-palette-red-bg)", text: "var(--color-palette-red-text)" },
          green: { DEFAULT: "var(--color-palette-green)", bg: "var(--color-palette-green-bg)", text: "var(--color-palette-green-text)" },
          amber: { DEFAULT: "var(--color-palette-amber)", bg: "var(--color-palette-amber-bg)", text: "var(--color-palette-amber-text)" },
          orange: { DEFAULT: "var(--color-palette-orange)", bg: "var(--color-palette-orange-bg)", text: "var(--color-palette-orange-text)" },
          purple: { DEFAULT: "var(--color-palette-purple)", bg: "var(--color-palette-purple-bg)", text: "var(--color-palette-purple-text)" },
          pink: { DEFAULT: "var(--color-palette-pink)", bg: "var(--color-palette-pink-bg)", text: "var(--color-palette-pink-text)" },
          teal: { DEFAULT: "var(--color-palette-teal)", bg: "var(--color-palette-teal-bg)", text: "var(--color-palette-teal-text)" },
          indigo: { DEFAULT: "var(--color-palette-indigo)", bg: "var(--color-palette-indigo-bg)", text: "var(--color-palette-indigo-text)" },
          gray: { DEFAULT: "var(--color-palette-gray)", bg: "var(--color-palette-gray-bg)", text: "var(--color-palette-gray-text)" },
        },

        // Brand (semantic — no shade numbers)
        brand: {
          DEFAULT: "var(--color-brand)",
          foreground: "var(--color-brand-foreground)",
          hover: "var(--color-brand-hover)",
          active: "var(--color-brand-active)",
          subtle: "var(--color-brand-subtle)",
          "subtle-foreground": "var(--color-brand-subtle-foreground)",
          muted: "var(--color-brand-muted)",
          border: "var(--color-brand-border)",
          ring: "var(--color-brand-ring)",
        },

        // Accent (semantic — no shade numbers)
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
          hover: "var(--color-accent-hover)",
          active: "var(--color-accent-active)",
          subtle: "var(--color-accent-subtle)",
          "subtle-foreground": "var(--color-accent-subtle-foreground)",
          muted: "var(--color-accent-muted)",
          border: "var(--color-accent-border)",
          ring: "var(--color-accent-ring)",
        },

        // UI Surface
        "ui-bg": {
          DEFAULT: "var(--color-ui-bg)",
          secondary: "var(--color-ui-bg-secondary)",
          tertiary: "var(--color-ui-bg-tertiary)",
          elevated: "var(--color-ui-bg-elevated)",
          overlay: "var(--color-ui-bg-overlay)",
          hero: "var(--color-ui-bg-hero)",
        },

        // UI Text
        "ui-text": {
          DEFAULT: "var(--color-ui-text)",
          secondary: "var(--color-ui-text-secondary)",
          tertiary: "var(--color-ui-text-tertiary)",
          inverse: "var(--color-ui-text-inverse)",
        },

        // UI Border
        "ui-border": {
          DEFAULT: "var(--color-ui-border)",
          secondary: "var(--color-ui-border-secondary)",
          focus: "var(--color-ui-border-focus)",
          error: "var(--color-ui-border-error)",
        },

        // Status
        status: {
          success: {
            DEFAULT: "var(--color-status-success)",
            bg: "var(--color-status-success-bg)",
            text: "var(--color-status-success-text)",
          },
          warning: {
            DEFAULT: "var(--color-status-warning)",
            bg: "var(--color-status-warning-bg)",
            text: "var(--color-status-warning-text)",
          },
          error: {
            DEFAULT: "var(--color-status-error)",
            bg: "var(--color-status-error-bg)",
            text: "var(--color-status-error-text)",
          },
          info: {
            DEFAULT: "var(--color-status-info)",
            bg: "var(--color-status-info-bg)",
            text: "var(--color-status-info-text)",
          },
        },

        // Issue Priority
        priority: {
          lowest: "var(--color-priority-lowest)",
          low: "var(--color-priority-low)",
          medium: "var(--color-priority-medium)",
          high: "var(--color-priority-high)",
          highest: "var(--color-priority-highest)",
        },

        // Issue Type
        "issue-type": {
          task: "var(--color-issue-type-task)",
          bug: "var(--color-issue-type-bug)",
          story: "var(--color-issue-type-story)",
          epic: "var(--color-issue-type-epic)",
          subtask: "var(--color-issue-type-subtask)",
        },

        // Landing
        landing: {
          accent: {
            DEFAULT: "var(--color-landing-accent)",
            alt: "var(--color-landing-accent-alt)",
            teal: "var(--color-landing-accent-teal)",
          },
        },

        // shadcn compatibility alias
        primary: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
        },

        // Brand feature accents (time tracking, calendar, onboarding)
        "brand-cyan": {
          text: "var(--color-brand-cyan-text)",
          bg: "var(--color-brand-cyan-bg)",
          border: "var(--color-brand-cyan-border)",
          track: "var(--color-brand-cyan-track)",
        },
        "brand-indigo": {
          text: "var(--color-brand-indigo-text)",
          bg: "var(--color-brand-indigo-bg)",
          border: "var(--color-brand-indigo-border)",
          track: "var(--color-brand-indigo-track)",
        },
        "brand-teal": {
          text: "var(--color-brand-teal-text)",
          bg: "var(--color-brand-teal-bg)",
          border: "var(--color-brand-teal-border)",
          track: "var(--color-brand-teal-track)",
        },
        "brand-emerald": {
          text: "var(--color-brand-emerald-text)",
          bg: "var(--color-brand-emerald-bg)",
          border: "var(--color-brand-emerald-border)",
          track: "var(--color-brand-emerald-track)",
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
