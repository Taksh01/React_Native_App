import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../theme";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
  loading = false,
  backgroundColor,
  textColor,
  disabledBackgroundColor,
  disabledTextColor,
  ...touchableProps
}) {
  const { theme } = useTheme();

  const palette = useMemo(() => {
    const variants = {
      primary: {
        background: theme.colors.primary,
        text: theme.colors.surfaceElevated,
        border: theme.colors.primary,
      },
      secondary: {
        background: theme.colors.surfaceMuted,
        text: theme.colors.textPrimary,
        border: theme.colors.borderStrong,
      },
      success: {
        background: theme.colors.success,
        text: theme.colors.surfaceElevated,
        border: theme.colors.success,
      },
      danger: {
        background: theme.colors.danger,
        text: theme.colors.surfaceElevated,
        border: theme.colors.danger,
      },
      neutral: {
        background: theme.colors.surfaceElevated,
        text: theme.colors.textSecondary,
        border: theme.colors.borderStrong,
      },
      ghost: {
        background: "transparent",
        text: theme.colors.textPrimary,
        border: theme.colors.borderSubtle,
      },
    };
    return variants[variant] || variants.primary;
  }, [theme, variant]);

  const baseBackground = backgroundColor ?? palette.background;
  const baseTextColor = textColor ?? palette.text;

  const resolvedBackground =
    disabled && disabledBackgroundColor ? disabledBackgroundColor : baseBackground;

  const resolvedTextColor =
    disabled && disabledTextColor ? disabledTextColor : baseTextColor;

  return (
    <TouchableOpacity
      {...touchableProps}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: resolvedBackground,
          borderColor: palette.border,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={resolvedTextColor} />
      ) : (
        <Text style={[styles.text, { color: resolvedTextColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});
