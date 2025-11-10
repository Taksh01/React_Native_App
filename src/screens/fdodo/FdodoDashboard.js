import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppButton from "../../components/AppButton";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";

export default function FdodoDashboard() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-15";
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return {
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(6),
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      },
      loadingText: {
        marginTop: theme.spacing(3),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      errorText: {
        fontSize: theme.typography.sizes.bodyLarge,
        color: theme.colors.danger,
        textAlign: "center",
        marginBottom: theme.spacing(4),
        paddingHorizontal: theme.spacing(4),
      },
      header: {
        marginBottom: theme.spacing(6),
      },
      welcomeText: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.heading,
      },
      subText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
        lineHeight: theme.typography.lineHeights.body,
      },
      metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -theme.spacing(2),
        marginBottom: theme.spacing(4),
      },
      metricCard: {
        width: "50%",
        paddingHorizontal: theme.spacing(2),
        marginBottom: theme.spacing(3),
      },
      metricCardInner: {
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing(4),
        borderRadius: theme.radii.lg,
        ...theme.shadows.level1,
        alignItems: "center",
        minHeight: 100,
        justifyContent: "center",
      },
      metricLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
        textAlign: "center",
        fontWeight: theme.typography.weightMedium,
      },
      metricValue: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeights.title,
      },
      metricWarning: {
        color: theme.colors.danger,
      },
      metricNote: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
        marginTop: theme.spacing(1),
        textAlign: "center",
      },
      section: {
        marginBottom: theme.spacing(6),
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(4),
        lineHeight: theme.typography.lineHeights.title,
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        ...theme.shadows.level1,
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: theme.spacing(3),
      },
      cardTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        flex: 1,
        marginRight: theme.spacing(2),
      },
      badge: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.pill,
        alignItems: "center",
        justifyContent: "center",
      },
      badgeText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.surfaceElevated,
      },
      cardContent: {
        gap: theme.spacing(2),
      },
      cardText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
      },
      cardMeta: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
      },
      noticeText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.warning,
        marginTop: theme.spacing(2),
        fontWeight: theme.typography.weightMedium,
      },
      statsContainer: {
        marginBottom: theme.spacing(2),
      },
      statsScroll: {
        paddingVertical: theme.spacing(1),
      },
      statCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginRight: theme.spacing(3),
        alignItems: "center",
        minWidth: 120,
        ...theme.shadows.level1,
      },
      statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
      },
      statValue: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      statLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        textAlign: "center",
        fontWeight: theme.typography.weightMedium,
      },
      emptyState: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(6),
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      emptyTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
        textAlign: "center",
      },
      emptyText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeights.body,
      },
    };
  });
  const getRequestBadgeStatus = useCallback((status) => {
    const normalizedStatus = (status ?? "").toString().toUpperCase();
    if (
      ["APPROVED", "FILLED", "CONFIRMED", "COMPLETED"].includes(
        normalizedStatus
      )
    ) {
      return "APPROVED";
    }
    return "PENDING";
  }, []);

  const getStatIcon = useCallback((stat) => {
    const iconMap = {
      active: "summaryTransportActive",
      filling: "statusLoading",
      completed: "summaryCompleted",
      totalTrips: "statTotalTrips",
      pending: "statPending",
      delayed: "statDelayed",
      activeTransports: "summaryTransportActive",
      enRoute: "statusEnRoute",
      delayedTransports: "summaryTransportDelayed",
    };
    return iconMap[stat?.key] || "info";
  }, []);

  const getStatBadgeColor = useCallback((key) => {
    const colors = {
      active: "#3b82f6",
      filling: "#f59e0b",
      completed: "#10b981",
    };
    return colors[key] || "#e0f2fe";
  }, []);

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["fdodoDashboard", dbsId],
    queryFn: () => GTS.getFdodoDashboard(dbsId),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const credit = data?.credit || {};
  const requestsSummary = data?.requestsSummary || {};
  const recentRequests = (data?.requests || []).slice(0, 3);
  const rawStats = data?.dashboard?.stats || [];
  const recentTrips = data?.dashboard?.recentTrips || [];
  const transportSummary = data?.transport?.summary || {};
  const transportList = data?.transport?.transports || [];

  const derivedTransportStats = useMemo(() => {
    return transportList.reduce(
      (acc, transport) => {
        const normalizedStatus = (transport?.status ?? "")
          .toString()
          .toUpperCase();
        if (normalizedStatus === "LOADING" || normalizedStatus === "FILLING") {
          acc.filling += 1;
        } else if (
          normalizedStatus === "DELIVERED" ||
          normalizedStatus === "COMPLETED"
        ) {
          acc.completed += 1;
        } else {
          acc.active += 1;
        }
        return acc;
      },
      { active: 0, filling: 0, completed: 0 }
    );
  }, [transportList]);

  const statsLookup = useMemo(() => {
    return rawStats.reduce((acc, stat) => {
      const key = (stat?.key || "").toString().toLowerCase();
      if (key) {
        const value = Number(stat?.value ?? 0);
        acc[key] = Number.isNaN(value) ? 0 : value;
      }
      const labelKey = (stat?.label || "").toString().toLowerCase();
      if (labelKey) {
        const value = Number(stat?.value ?? 0);
        acc[labelKey] = Number.isNaN(value) ? 0 : value;
      }
      return acc;
    }, {});
  }, [rawStats]);

  const stationStats = useMemo(() => {
    const pickNumber = (...values) => {
      for (const value of values) {
        if (value === undefined || value === null) continue;
        const num = Number(value);
        if (!Number.isNaN(num)) {
          return num;
        }
      }
      return 0;
    };

    return [
      {
        key: "active",
        label: "Active",
        value: pickNumber(
          transportSummary.active,
          transportSummary.activeTransports,
          transportSummary.enRoute,
          statsLookup.active,
          statsLookup.activetransports,
          statsLookup.enroute,
          derivedTransportStats.active
        ),
      },
      {
        key: "filling",
        label: "Filling",
        value: pickNumber(
          transportSummary.filling,
          transportSummary.loading,
          statsLookup.filling,
          statsLookup.loading,
          derivedTransportStats.filling
        ),
      },
      {
        key: "completed",
        label: "Completed",
        value: pickNumber(
          transportSummary.completed,
          transportSummary.delivered,
          statsLookup.completed,
          statsLookup.delivered,
          derivedTransportStats.completed
        ),
      },
    ];
  }, [transportSummary, derivedTransportStats, statsLookup]);

  const isInitialLoading = isLoading && !data;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={themeRef.current?.colors?.info || "#3b82f6"}
        />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Unable to load FDODO dashboard. Pull to retry.
        </Text>
        <AppButton title="Retry" onPress={handleRefresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Hello, {user?.name || "FDODO"}!
          </Text>
          <Text style={styles.subText}>
            {data?.station?.name || "Assigned Station"} •{" "}
            {data?.station?.dbsId || dbsId}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricCardInner}>
              <Text style={styles.metricLabel}>Credit Available</Text>
              <Text style={styles.metricValue}>
                {credit.available?.toLocaleString?.() ?? "0"} L
              </Text>
              {/* <Text style={styles.metricNote}>
                Reserved: {credit.reserved?.toLocaleString?.() ?? "0"} L
              </Text> */}
            </View>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricCardInner}>
              <Text style={styles.metricLabel}>Credit Status</Text>
              <Text
                style={[
                  styles.metricValue,
                  credit.status !== "OK" && styles.metricWarning,
                ]}
              >
                {credit.status || "UNKNOWN"}
              </Text>
              {/* <Text style={styles.metricNote}>
                SAP: {credit.sapStatus || "OFFLINE"}
              </Text> */}
            </View>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricCardInner}>
              <Text style={styles.metricLabel}>Total Requests</Text>
              <Text style={styles.metricValue}>
                {requestsSummary.total || 0}
              </Text>
              {/* <Text style={styles.metricNote}>
                Pending: {requestsSummary.pending || 0}
              </Text> */}
            </View>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricCardInner}>
              <Text style={styles.metricLabel}>Confirmations</Text>
              <Text style={styles.metricValue}>
                {requestsSummary.confirmationPending || 0}
              </Text>
              {/* <Text style={styles.metricNote}>
                Blocked: {requestsSummary.blocked || 0}
              </Text> */}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {recentRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>
                Raise a new stock request to see it tracked here.
              </Text>
            </View>
          ) : (
            recentRequests.map((request) => {
              const badgeStatus = getRequestBadgeStatus(request.status);
              return (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{request.id}</Text>
                    <View style={[styles.badge, statusStyles[badgeStatus]]}>
                      <Text style={styles.badgeText}>{badgeStatus}</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardText}>
                      Quantity: {request.quantity?.toLocaleString?.() ?? ""} L
                    </Text>
                    <Text style={styles.cardMeta}>
                      SAP: {request.sapStatus || "PENDING"}{" "}
                      {new Date(request.requestedAt).toLocaleString("en-IN")}
                    </Text>
                    {request.requiresConfirmation && (
                      <Text style={styles.noticeText}>
                        Awaiting confirmation
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Station Stats</Text>
          <View style={styles.statsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              {stationStats.map((item) => {
                const numericValue = Number(item.value ?? 0);
                const formattedValue = Number.isNaN(numericValue)
                  ? "0"
                  : numericValue.toLocaleString();
                return (
                  <View key={item.key} style={styles.statCard}>
                    <View style={[styles.statIcon]}>
                      <AppIcon
                        icon={getStatIcon(item)}
                        size={16}
                        color="#000000"
                      />
                    </View>
                    <Text style={styles.statValue}>{formattedValue}</Text>
                    <Text style={styles.statLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {recentTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyText}>
                Trip information will appear here once available.
              </Text>
            </View>
          ) : (
            // recentTrips.map((trip) => (
            //   <View key={trip.id} style={styles.card}>
            //     <View style={styles.cardHeader}>
            //       <Text style={styles.cardTitle}>{trip.id}</Text>
            //       <View style={[styles.badge, tripStatusStyles[trip.status]]}>
            //         <Text style={styles.badgeText}>{trip.status}</Text>
            //       </View>
            //     </View>
            //     <View style={styles.cardContent}>
            //       <Text style={styles.cardText}>{trip.route}</Text>
            //       <Text style={styles.cardMeta}>
            //         Driver: {trip.driverName} •{" "}
            //         {new Date(trip.scheduledTime).toLocaleString("en-IN")}
            //       </Text>
            //     </View>
            //   </View>
            // ))

            recentTrips.map((trip) => {
              // Normalize trip.status
              const normalizedStatus = (() => {
                const status = (trip.status ?? "").toUpperCase();
                if (["FILLING", "LOADING"].includes(status)) return "FILLING";
                if (["ACTIVE", "IN_PROGRESS", "EN_ROUTE"].includes(status))
                  return "ACTIVE";
                if (["COMPLETED", "DELIVERED"].includes(status))
                  return "COMPLETED";
                return "ACTIVE"; // default fallback
              })();

              return (
                <View key={trip.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{trip.id}</Text>
                    <View
                      style={[styles.badge, tripStatusStyles[normalizedStatus]]}
                    >
                      <Text style={styles.badgeText}>{normalizedStatus}</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardText}>{trip.route}</Text>
                    <Text style={styles.cardMeta}>
                      Driver: {trip.driverName} •{" "}
                      {new Date(trip.scheduledTime).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const statusStyles = StyleSheet.create({
  PENDING: { backgroundColor: "#f59e0b" },
  APPROVED: { backgroundColor: "#10b981" },
});

const tripStatusStyles = StyleSheet.create({
  ACTIVE: { backgroundColor: "#3b82f6" }, // Blue
  FILLING: { backgroundColor: "#f59e0b" }, // Amber/Yellow
  COMPLETED: { backgroundColor: "#10b981" }, // Green
});
