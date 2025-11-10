import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-09";

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(2),
        gap: theme.spacing(2),
      },
      statsCard: {
        backgroundColor: theme.colors.surfaceElevated,
        padding: 8,
        borderRadius: theme.radii.md,
        flex: 1,
        minWidth: 80,
        alignItems: "center",
        ...theme.shadows.level1,
      },
      statsIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
      },
      statsNumber: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      statsLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginTop: 1,
        fontWeight: theme.typography.weightMedium,
        textAlign: "center",
      },
      section: {
        flex: 1,
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(1),
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(3),
      },
      tripCard: {
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing(4),
        borderRadius: theme.radii.lg,
        marginBottom: theme.spacing(3),
        ...theme.shadows.level2,
      },
      tripHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      tripId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      statusBadge: {
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.sm,
      },
      statusText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.surfaceElevated,
        textTransform: "uppercase",
      },
      tripRoute: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(3),
      },
      tripFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      tripDriver: {
        fontSize: theme.typography.sizes.bodySmall,
        color: theme.colors.textSecondary,
      },
      tripTime: {
        fontSize: theme.typography.sizes.bodySmall,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightMedium,
      },
      errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing(5),
      },
      errorText: {
        fontSize: theme.typography.sizes.bodyLarge,
        color: theme.colors.danger,
        marginBottom: theme.spacing(4),
        textAlign: "center",
      },
    })
  );

  const resolveStatIcon = (stat) => {
    const map = {
      totalTrips: "statTotalTrips",
      pending: "statPending",
      completed: "statCompleted",
      delayed: "statDelayed",
    };
    if (stat?.key && map[stat.key]) return map[stat.key];
    return "analytics";
  };

  const {
    data: dashboardData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["customerDashboard", dbsId],
    queryFn: () => GTS.getCustomerDashboard(dbsId),
    refetchInterval: 30000,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const STATUS_COLORS = {
    FILLING: "#0ea5e9",
    DISPATCHED: "#2563eb",
    COMPLETED: "#10b981",
  };

  const STATUS_GROUPS = {
    COMPLETED: ["COMPLETED", "DELIVERED", "CONFIRMED"],
    DISPATCHED: ["DISPATCHED", "EN_ROUTE"],
    FILLING: ["PENDING", "SCHEDULED", "ON_HOLD", "IN_PROGRESS"],
  };

  const categorizeStatus = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (STATUS_GROUPS.COMPLETED.some((value) => normalized.includes(value))) {
      return "COMPLETED";
    }
    if (STATUS_GROUPS.DISPATCHED.some((value) => normalized.includes(value))) {
      return "DISPATCHED";
    }
    return "FILLING";
  };

  const formatStatusLabel = (status) => {
    const category = categorizeStatus(status);
    if (category === "DISPATCHED") return "Dispatched";
    if (category === "COMPLETED") return "Completed";
    return "Filling";
  };

  const getStatusColor = (status) =>
    STATUS_COLORS[categorizeStatus(status)] || "#6b7280";

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatsCard = ({ item }) => {
    const safeIcon = resolveStatIcon(item);
    return (
      <View key={item.key || item.label} style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <AppIcon icon={safeIcon} size={16} color="#1e293b" />
        </View>
        <Text style={styles.statsNumber}>{item.value}</Text>
        <Text style={styles.statsLabel}>{item.label}</Text>
      </View>
    );
  };

  const renderTripCard = ({ item }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripId}>{item.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{formatStatusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.tripRoute}>{item.route}</Text>
      <View style={styles.tripFooter}>
        <Text style={styles.tripDriver}>Driver: {item.driverName}</Text>
        <Text style={styles.tripTime}>
          Time: {formatTime(item.scheduledTime)}
        </Text>
      </View>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <AppButton title="Retry" onPress={handleRefresh} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = (dashboardData?.stats || []).filter(
    (item) => item.key?.toLowerCase() !== "delayed"
  );

  const recentTrips = dashboardData?.recentTrips || [];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.statsGrid}>
        {stats.map((item) => renderStatsCard({ item }))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        <FlatList
          data={recentTrips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      </View>
    </SafeAreaView>
  );
}
