/**
 * Design Tokens — Single source of truth for all colors, spacing, and typography.
 * Neubrutalism Theme — inspired by the provided Homelogy UI.
 */

export const ThemeColors = {
  // Brand
  primary: '#FFD166',          // Warm yellow (for main buttons)
  primaryLight: '#FFE3A1',     // Lighter yellow
  primaryDark: '#E5B13D',      // Darker yellow

  // Accents
  accent: '#A0E8AF',           // Mint green (used in headers/tabbars)
  accentSecondary: '#F1EAFD',  // Soft lavender (app background)
  accentPeach: '#FFB5A7',      // Soft peach
  accentBlue: '#A9DEF9',       // Soft blue

  // Backgrounds
  background: '#F8F4FF',       // Lavender white app bg
  surface: '#FFFFFF',          // Pure white cards
  surfaceElevated: '#FFFFFF',  // Also white
  surfaceMint: '#C6EDD4',      // Mint background for tab/header
  border: '#000000',           // Heavy black border

  // Text
  textPrimary: '#000000',      // Solid black text
  textSecondary: '#444444',    // Dark grey
  textMuted: '#777777',        // Mid grey

  // Semantic
  success: '#A0E8AF',          // Mint
  warning: '#FFD166',          // Yellow
  danger: '#FF6B6B',           // Red
  info: '#A9DEF9',             // Blue

  // Category palette — pastel blocks
  categories: {
    SSC: '#E2D4F0',      // Purple pastel
    UPSC: '#A9DEF9',     // Blue pastel
    Railway: '#FFD166',  // Yellow
    Banking: '#A0E8AF',  // Mint
    Police: '#FFB5A7',   // Peach
    Teaching: '#F4C2C2', // Pink pastel
    Defence: '#FF9F1C',  // Orange
    State: '#C6EDD4',    // Light mint
    All: '#FFFFFF',      // White
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
  xxl: 24,
  full: 9999,
} as const;

// The classic Neubrutalist offset shadow
export const ThemeShadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8, // For Android (though it uses standard blur, React Native handles it best this way)
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  }
} as const;

export type CategoryKey = keyof typeof ThemeColors.categories;
