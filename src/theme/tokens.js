import palette from "./palette";

const spacingScale = [0, 4, 8, 12, 16, 20, 24, 32, 40];

const baseTheme = {
  spacing: (step = 1) => spacingScale[step] ?? spacingScale[spacingScale.length - 1],
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    fontFamily: "System",
    weightRegular: "400",
    weightMedium: "500",
    weightSemiBold: "600",
    weightBold: "700",
    sizes: {
      caption: 12,
      body: 14,
      bodyLarge: 16,
      title: 20,
      heading: 24,
    },
    lineHeights: {
      caption: 16,
      body: 20,
      bodyLarge: 22,
      title: 28,
      heading: 32,
    },
  },
  shadows: {
    level1: {
      shadowColor: palette.slate900,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    level2: {
      shadowColor: palette.slate900,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
};

const lightColors = {
  mode: "light",
  background: palette.slate100,
  surfaceElevated: palette.white,
  surfaceMuted: palette.slate50,
  surfaceContrast: palette.slate900,
  borderSubtle: palette.slate200,
  borderStrong: palette.slate300,
  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  primary: palette.blue600,
  primaryStrong: palette.blue700,
  primaryMuted: palette.blue400,
  success: palette.emerald600,
  warning: palette.amber400,
  danger: palette.red600,
  info: palette.blue500,
  overlay: "rgba(2, 6, 23, 0.55)",
  loaderPrimary: palette.blue700,
  loaderSecondary: palette.blue600,
  emergency: "#FF3B30",
  emergencyOrange: "#FF9500",
  successGreen: "#34C759",
  neutralGray: "#8E8E93",
  iconDark: "#333",
  slateIcon: "#94a3b8",
};

export const defaultTheme = {
  ...baseTheme,
  colors: lightColors,
  statusBarStyle: "dark",
};
