
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGetEicAlerts } from "../../lib/eicApi";
import { useThemedStyles } from "../../theme";
import AppIcon from "../../components/AppIcon";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";
import { format } from "date-fns";

const SEVERITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
  INFO: "#6b7280",
};

export default function AlertsList() {
  useScreenPermissionSync("AlertsList");
  
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["eicAlerts"],
    queryFn: apiGetEicAlerts,
  });

  const alerts = data?.alerts || [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      listContent: {
        padding: theme.spacing(4),
        paddingBottom: theme.spacing(6),
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: theme.spacing(2),
      },
      alertType: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textSecondary,
        textTransform: "uppercase",
        // letterSpacing: 0.5,
      },
      timestamp: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightBold,

      },
      message: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(3),
      },
      detailsSection: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        gap: theme.spacing(2),
      },
      detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      detailLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      detailValue: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(6),
        marginTop: theme.spacing(10),
      },
      emptyText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(2),
      },
    })
  );

  const renderAlertCard = ({ item }) => {
    const severityColor = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.INFO;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.alertType, { color: severityColor, marginBottom: 4 }]}>
                Emergency: 
              {item.type}
            </Text>
            <Text style={[styles.alertType, { color: severityColor }]}>
              Severity: {item.severity}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {format(new Date(item.created_at), "MMM d, HH:mm")}
          </Text>
        </View>

        {/* <Text style={styles.message}>{item.message}</Text> */}

        <View style={styles.detailsSection}>
          {item.station_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MS</Text>
              <Text style={styles.detailValue}>{item.station_name}</Text>
            </View>
          )}
          {item.dbs_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DBS</Text>
              <Text style={styles.detailValue}>{item.dbs_name}</Text>
            </View>
          )}
          {item.driver_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Driver</Text>
              <Text style={styles.detailValue}>{item.driver_name}</Text>
            </View>
          )}
          {item.driver_phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{item.driver_phone}</Text>
            </View>
          )}
           {item.vehicle_no && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{item.vehicle_no}</Text>
            </View>
          )}
          {item.trip_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip ID</Text>
              <Text style={styles.detailValue}>{item.trip_id}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading && !isRefetching) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderAlertCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <AppIcon icon="notifications" size={48} color="#e5e7eb" />
                <Text style={styles.emptyText}>No alerts found</Text>
            </View>
        }
      />
    </View>
  );
}
