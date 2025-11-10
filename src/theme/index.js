import React, { createContext, useContext, useEffect, useMemo } from "react";
import { Text, TextInput } from "react-native";
import { defaultTheme } from "./tokens";

const ThemeContext = createContext({
  theme: defaultTheme,
});

const mergeStyles = (base, existing) => {
  if (!existing) return [base];
  if (Array.isArray(existing)) {
    return [base, ...existing];
  }
  return [base, existing];
};

const applyGlobalDefaults = (theme) => {
  if (Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  Text.defaultProps.allowFontScaling = true;
  Text.defaultProps.maxFontSizeMultiplier = 1.4;
  const baseTextStyle = {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
  };
  Text.defaultProps.style = mergeStyles(baseTextStyle, Text.defaultProps.style);

  if (TextInput.defaultProps == null) {
    TextInput.defaultProps = {};
  }
  TextInput.defaultProps.allowFontScaling = true;
  TextInput.defaultProps.maxFontSizeMultiplier = 1.4;
  TextInput.defaultProps.placeholderTextColor = theme.colors.textMuted;
  TextInput.defaultProps.selectionColor = theme.colors.primary;
  const baseInputStyle = {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
  };
  TextInput.defaultProps.style = mergeStyles(baseInputStyle, TextInput.defaultProps.style);
};

export function ThemeProvider({ children }) {
  useEffect(() => {
    applyGlobalDefaults(defaultTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme: defaultTheme,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const useThemedStyles = (factory) => {
  try {
    const { theme } = useTheme();
    return useMemo(() => factory(theme), [factory, theme]);
  } catch (error) {
    console.error('❌ useThemedStyles ERROR:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};
