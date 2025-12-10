
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, AppState, Alert } from "react-native";
import { useTheme } from "../theme";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationService from "../services/NotificationService";
import { Ionicons } from "@expo/vector-icons";

const PermissionRequiredScreen = ({ onPermissionGranted }) => {
  const { theme } = useTheme();
  const [checking, setChecking] = useState(false);

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Failed to open settings:", error);
    }
  };

  const checkManually = async () => {
    setChecking(true);
    // Add small delay to allow system to update status if user just switched back
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hasPermission = await NotificationService.checkPermission();
    setChecking(false);
    
    if (hasPermission && onPermissionGranted) {
      onPermissionGranted();
    } else {
      Alert.alert(
        "Permissions Still Disabled",
        "We could not detect notification permissions. Please ensure you have enabled them in settings.",
        [{ text: "OK" }]
      );
    }
  };

  useEffect(() => {
    // Also auto-check when app comes to foreground while on this screen
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkManually();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.danger} />
        </View>
        
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Notifications Required
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          This application requires notification permissions to function correctly. 
          {"\n\n"}
          Please enable notifications in your device settings to continue.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleOpenSettings}
        >
          <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            Open Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={checkManually}
          disabled={checking}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
            {checking ? "Checking..." : "I've Enabled It"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PermissionRequiredScreen;
