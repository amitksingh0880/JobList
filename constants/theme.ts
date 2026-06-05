/**
 * Design Tokens — Single source of truth for all colors, spacing, and typography.
 * NO hardcoded color values anywhere else in the codebase.
 * All values reference these tokens via NativeWind className strings.
 */

export const ThemeColors = {
  // Brand
  primary: '#6C3DE8',          // Deep violet
  primaryLight: '#8B5CF6',     // Light violet
  primaryDark: '#4C1D95',      // Dark violet
  accent: '#F59E0B',           // Amber accent

  // Background layers
  background: '#0A0A0F',       // App background
  surface: '#12121A',          // Card surface
  surfaceElevated: '#1A1A26',  // Elevated surface
  border: '#2A2A3A',           // Borders

  // Text
  textPrimary: '#F8FAFC',      // Main text
  textSecondary: '#94A3B8',    // Secondary text
  textMuted: '#64748B',        // Muted text

  // Semantic colors
  success: '#10B981',          // Active/New
  warning: '#F59E0B',          // Expiring soon
  danger: '#EF4444',           // Expired / Urgent
  info: '#3B82F6',             // Informational

  // Category colors (mapped to category keys)
  categories: {
    SSC: '#8B5CF6',
    UPSC: '#3B82F6',
    Railway: '#F59E0B',
    Banking: '#10B981',
    Police: '#EF4444',
    Teaching: '#06B6D4',
    Defence: '#F97316',
    State: '#EC4899',
    All: '#6C3DE8',
  },
} as const;

export const ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const ThemeFonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

export const ThemeBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export type CategoryKey = keyof typeof ThemeColors.categories;
