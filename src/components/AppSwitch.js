import React, { useMemo } from "react";
import { Switch } from "react-native";
import { useTheme } from "../theme";

export default function AppSwitch({
  value,
  onValueChange,
  disabled = false,
  trackColor,
  thumbColor,
  ios_backgroundColor,
  ...switchProps
}) {
  const { theme } = useTheme();

  const resolvedTrack = useMemo(
    () =>
      trackColor ?? {
        false: theme.colors.borderStrong,
        true: theme.colors.primary,
      },
    [trackColor, theme.colors.borderStrong, theme.colors.primary]
  );

  const resolvedThumb = useMemo(() => {
    if (thumbColor) return thumbColor;
    if (disabled) return theme.colors.textMuted;
    return theme.colors.surfaceElevated;
  }, [disabled, theme.colors.surfaceElevated, theme.colors.textMuted, thumbColor]);

  const resolvedIosBackground = ios_backgroundColor ?? theme.colors.surfaceMuted;

  return (
    <Switch
      {...switchProps}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={resolvedTrack}
      thumbColor={resolvedThumb}
      ios_backgroundColor={resolvedIosBackground}
    />
  );
}
