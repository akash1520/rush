/**
 * Design Tokens Configuration
 *
 * Centralized design system tokens for easy customization.
 * Modify these values to update the entire app's appearance.
 */

export const designTokens = {
  colors: {
    // Primary tech colors
    primary: {
      light: '#6366F1', // Indigo-500 (purplish blue)
      DEFAULT: '#6366F1',
      dark: '#818CF8', // Indigo-400 (lighter purplish blue for dark mode)
    },
    // Neutral colors
    background: {
      light: '#FFFFFF',
      dark: '#000000',
    },
    foreground: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    // Border colors
    border: {
      light: '#E5E7EB', // Gray-200
      dark: '#374151', // Gray-700
    },
    // Accent colors (using purplish blue variants)
    accent: {
      light: '#4F46E5', // Indigo-600 (darker purplish blue)
      dark: '#A5B4FC', // Indigo-300 (lighter for dark mode)
    },
    // Muted/Secondary text
    muted: {
      light: '#6B7280', // Gray-500
      dark: '#9CA3AF', // Gray-400
    },
  },

  borderRadius: {
    none: '0px',
    sm: '0.25rem',   // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    full: '9999px',
  },

  // Border widths (thinner, more modern)
  borderWidth: {
    thin: '1px',
    DEFAULT: '1px',
    medium: '2px',
    thick: '3px',
  },

  // Shadows (subtle, modern)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
} as const;

// Type exports for TypeScript
export type DesignTokens = typeof designTokens;

