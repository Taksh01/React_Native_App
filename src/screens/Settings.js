import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { CONFIG } from "../config";
import AppButton from "../components/AppButton";
import NotificationService from "../services/NotificationService";

import { useThemedStyles } from "../theme";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: theme.colors.background },
      container: {
        flex: 1,
        padding: theme.spacing(5),
        gap: theme.spacing(4),
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
    })
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Role</Text>
            <Text style={styles.data}>{user?.role ?? "Not signed in"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Mock Mode</Text>
            <Text style={styles.data}>
              {CONFIG.MOCK_MODE ? "True" : "False"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Device Tokens</Text>
            <Text style={styles.data}>
              {NotificationService.deviceToken ?? "Not available"}
            </Text>
          </View>

          <View style={styles.buttonSection}>
            <AppButton title="Logout" onPress={logout} variant="danger" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
