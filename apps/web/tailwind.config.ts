import type { Config } from "tailwindcss";
import { designTokens } from "./lib/design-tokens";

export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: designTokens.colors.primary.light,
          DEFAULT: designTokens.colors.primary.DEFAULT,
          dark: designTokens.colors.primary.dark,
        },
        bg: {
          light: designTokens.colors.background.light,
          dark: designTokens.colors.background.dark,
        },
        fg: {
          light: designTokens.colors.foreground.light,
          dark: designTokens.colors.foreground.dark,
        },
        border: {
          light: designTokens.colors.border.light,
          dark: designTokens.colors.border.dark,
        },
        accent: {
          light: designTokens.colors.accent.light,
          dark: designTokens.colors.accent.dark,
        },
        muted: {
          light: designTokens.colors.muted.light,
          dark: designTokens.colors.muted.dark,
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        ...designTokens.borderRadius,
      },
      borderWidth: {
        thin: designTokens.borderWidth.thin,
        DEFAULT: designTokens.borderWidth.DEFAULT,
        medium: designTokens.borderWidth.medium,
        thick: designTokens.borderWidth.thick,
      },
      boxShadow: {
        ...designTokens.shadows,
      },
    }
  },
  plugins: []
} satisfies Config;



