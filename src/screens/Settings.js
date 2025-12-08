import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { CONFIG } from "../config";
import AppButton from "../components/AppButton";
import NotificationService from "../services/NotificationService";

import { useThemedStyles } from "../theme";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const [events, setEvents] = useState([]);

  const appendEvent = useCallback((message) => {
    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleTimeString();
    setEvents((prev) => [
      {
        id: `${timestamp.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        time: formattedTime,
      },
      ...prev,
    ]);
  }, []);

  const handleLogout = useCallback(async () => {
    appendEvent("Logout pressed");
    try {
      await logout();
      appendEvent("Logout completed");
    } catch (error) {
      appendEvent(`Logout failed: ${error?.message ?? "Unknown error"}`);
    }
  }, [appendEvent, logout]);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: theme.colors.background },
      container: {
        flex: 1,
        padding: theme.spacing(5),
        gap: theme.spacing(4),
      },
      content: {
        gap: theme.spacing(4),
        flexGrow: 1,
      },
      infoSection: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.md,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
      },
      infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      },
      lastRow: {
        borderBottomWidth: 0,
      },
      itemLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.body,
      },
      data: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
      },
      buttonSection: {
        paddingTop: theme.spacing(3),
        marginTop: theme.spacing(3),
        borderTopWidth: 0,
        borderTopColor: theme.colors.borderSubtle,
        gap: theme.spacing(2),
      },
      logSection: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.md,
        padding: theme.spacing(4),
        flex: 1,
      },
      logHeader: {
        fontSize: theme.typography.sizes.subheading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      logEmpty: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.body,
      },
      logEntry: {
        marginBottom: theme.spacing(2),
      },
      logEntryTime: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.caption,
      },
      logEntryMessage: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
      },
    })
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.container, styles.content]}>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Role</Text>
            <Text style={styles.data}>{user?.role ?? "Not signed in"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Environment</Text>
            <Text style={styles.value}>Production Backend</Text>
          </View>
          <View style={[styles.infoRow, styles.lastRow]}>
            <Text style={styles.itemLabel}>Device Tokens</Text>
            <Text style={styles.data}>
              {NotificationService.deviceToken ?? "Not available"}
            </Text>
          </View>

          <View style={styles.buttonSection}>
            <AppButton title="Logout" onPress={handleLogout} variant="danger" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
