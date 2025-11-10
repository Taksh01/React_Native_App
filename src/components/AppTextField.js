import React, { useMemo, useState, forwardRef } from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { useTheme } from "../theme";

const AppTextField = forwardRef(function AppTextField(
  {
    style,
    inputStyle,
    leftAccessory,
    rightAccessory,
    onFocus,
    onBlur,
    editable = true,
    ...inputProps
  },
  ref
) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const disabled = editable === false;

  const styles = useMemo(() => {
    const borderColor = disabled
      ? theme.colors.borderSubtle
      : isFocused
      ? theme.colors.primary
      : theme.colors.borderSubtle;

    const backgroundColor = disabled
      ? theme.colors.surfaceMuted
      : theme.colors.surfaceElevated;

    return StyleSheet.create({
      container: {
        borderWidth: 1.5,
        borderColor,
        backgroundColor,
        borderRadius: theme.radii.md,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 54,
        paddingHorizontal: theme.spacing(3),
      },
      input: {
        flex: 1,
        fontSize: theme.typography.sizes.bodyLarge,
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing(2),
      },
      accessory: {
        marginHorizontal: theme.spacing(2),
      },
    });
  }, [disabled, isFocused, theme]);

  const placeholderColor =
    inputProps.placeholderTextColor ?? theme.colors.textMuted;

  const handleFocus = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, style]}>
      {leftAccessory ? (
        <View style={styles.accessory}>{leftAccessory}</View>
      ) : null}
      <TextInput
        {...inputProps}
        ref={ref}
        editable={editable}
        placeholderTextColor={placeholderColor}
        selectionColor={theme.colors.primary}
        style={[styles.input, inputStyle]}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {rightAccessory ? (
        <View style={styles.accessory}>{rightAccessory}</View>
      ) : null}
    </View>
  );
});

export default AppTextField;

