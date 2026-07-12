/** Foliq design tokens.
 *
 *  Direction: calm, editorial, trustworthy. A tool about reading and
 *  understanding, so it reads like considered print, not a dashboard.
 *
 *  Palette — "ink & iris":
 *    ink        deep blue-black, primary text & dark surfaces
 *    slate      cool neutral greys for structure
 *    iris       the one confident accent (indigo-violet)
 *    parchment  warm off-white page, easier on the eyes than pure white
 *    citation   the amber used ONLY for source chips — the signature
 *
 *  Type:
 *    display — Fraunces (characterful serif, used with restraint)
 *    body    — Inter (clean, legible grotesque)
 *    mono    — JetBrains Mono (citations, metadata)
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12131a",
          soft: "#1c1e29",
          muted: "#2a2d3d",
        },
        slate: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d9dce4",
          300: "#b9bfcc",
          400: "#8b93a7",
          500: "#646c82",
          600: "#4b5266",
          700: "#3a4054",
          800: "#262a38",
          900: "#181b26",
        },
        iris: {
          DEFAULT: "#5b5bd6",
          soft: "#7c7cf0",
          deep: "#4646b8",
          wash: "#eeeefb",
        },
        parchment: {
          DEFAULT: "#faf9f6",
          deep: "#f2f0ea",
        },
        citation: {
          DEFAULT: "#c68a2e",
          wash: "#faf1de",
          ink: "#8a5e17",
        },
        // Surfaces that flip between light and dark. Used via
        // bg-surface / text-content etc. with dark: variants in markup.
        surface: {
          DEFAULT: "#faf9f6",   // page (light)
          raised: "#ffffff",    // cards/sidebar (light)
          dark: "#0f1016",      // page (dark)
          "dark-raised": "#181a23", // cards/sidebar (dark)
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18,19,26,0.04), 0 8px 24px -12px rgba(18,19,26,0.12)",
        lift: "0 2px 8px rgba(18,19,26,0.06), 0 20px 48px -20px rgba(18,19,26,0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)",
        "blink": "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
