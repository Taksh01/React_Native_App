import React, { useMemo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../store/auth";
import { GTS } from "../../api/client";
import AppIcon from "../../components/AppIcon";
import TripDetailsModal from "../../components/TripDetailsModal";
import { useThemedStyles } from "../../theme";

const STATUS_COLORS = {
  FILLING: "#0ea5e9",
  DISPATCHED: "#2563eb",
  COMPLETED: "#10b981",
};

const STATUS_GROUPS = {
  COMPLETED: ["COMPLETED", "DELIVERED", "CONFIRMED"],
  DISPATCHED: ["DISPATCHED", "EN_ROUTE"],
  FILLING: ["PENDING", "SCHEDULED", "ON_HOLD", "LOADING", "IN_PROGRESS"],
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

const STATUS_BADGE_COLORS = {
  OPERATIONAL: "#22c55e",
  MAINTENANCE: "#f97316",
  OFFLINE: "#ef4444",
};

const formatDate = (value) => {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const groupTrips = (trips = []) => {
  const map = trips.reduce((acc, trip) => {
    const key = formatDate(trip.scheduledTime);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(trip);
    return acc;
  }, new Map());

  return Array.from(map.entries())
    .map(([title, data]) => ({
      title,
      data: data.sort(
        (a, b) =>
          new Date(a.scheduledTime || 0).getTime() -
          new Date(b.scheduledTime || 0).getTime()
      ),
    }))
    .reverse();
};

const resolveStatusColor = (status) =>
  STATUS_COLORS[categorizeStatus(status)] || "#94a3b8";

export default function MSDashboard() {
  const { user } = useAuth();
  const msId = user?.msId || "MS-12";
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTripPress = useCallback((trip) => {
    setSelectedTrip(trip);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedTrip(null);
  }, []);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      listContent: {
        paddingHorizontal: theme.spacing(4),
        paddingBottom: theme.spacing(8),
      },
      headerCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        ...theme.shadows.level2,
      },
      headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      headerTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      badge: {
        paddingHorizontal: theme.spacing(2.5),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.rounded,
      },
      badgeText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.surfaceElevated,
      },
      headerMeta: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        marginTop: theme.spacing(4),
      },
      summaryCard: {
        flexBasis: "48%",
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(3),
      },
      summaryLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      },
      summaryValue: {
        marginTop: theme.spacing(1),
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      sectionHeader: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2),
      },
      tripCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        ...theme.shadows.level1,
      },
      tripHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      tripId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: theme.spacing(1),
        borderRadius: 8,
      },
      statusText: {
        fontSize: 15,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.surfaceElevated,
      },
      tripRoute: {
        marginTop: theme.spacing(2),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: theme.spacing(3),
      },
      metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing(1),
      },
      metaText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      emptyState: {
        alignItems: "center",
        padding: theme.spacing(6),
      },
      emptyText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(2),
        textAlign: "center",
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
    })
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["msTripSchedule", msId],
    queryFn: () => GTS.getMsTripSchedule(msId),
    refetchInterval: 60000,
    enabled: Boolean(msId),
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const sections = useMemo(() => groupTrips(data?.trips || []), [data?.trips]);

  const summaryCounts = useMemo(() => {
    const counts = { FILLING: 0, DISPATCHED: 0, COMPLETED: 0 };
    (data?.trips || []).forEach((trip) => {
      const category = categorizeStatus(trip.status);
      counts[category] += 1;
    });
    return counts;
  }, [data?.trips]);

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>
            {data?.station?.msName || "MS Dashboard"}
          </Text>
          {data?.station?.location && (
            <Text style={styles.headerMeta}>{data.station.location}</Text>
          )}
        </View>
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Filling</Text>
          <Text style={styles.summaryValue}>{summaryCounts.FILLING}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Dispatched</Text>
          <Text style={styles.summaryValue}>{summaryCounts.DISPATCHED}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{summaryCounts.COMPLETED}</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const quantityText =
      typeof item.quantity === "number"
        ? item.quantity.toLocaleString("en-IN")
        : item.quantity || "--";
    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleTripPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <Text style={styles.tripId}>{item.id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: resolveStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {formatStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.tripRoute}>
          {item.route || `${data?.station?.msName || "MS"} → ${item.dbsName}`}
        </Text>
        {/* <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppIcon icon="station" size={14} color="#1e293b" />
            <Text style={styles.metaText}>{item.dbsName}</Text>
          </View>
          <View style={styles.metaItem}>
            <AppIcon icon="analytics" size={14} color="#1e293b" />
            <Text style={styles.metaText}>
              {formatTime(item.scheduledTime)}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppIcon icon="box" size={14} color="#1e293b" />
            <Text style={styles.metaText}>
              {item.product} · {quantityText} L
            </Text>
          </View>
          <View style={styles.metaItem}>
            <AppIcon icon="vehicle" size={14} color="#1e293b" />
            <Text style={styles.metaText}>{item.vehicleNumber}</Text>
          </View>
        </View> */}
      </TouchableOpacity>
    );
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id || `${index}-${item.dbsId}`}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <AppIcon icon="trips" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>
              No dispatches configured for this MS.
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
        }
        stickySectionHeadersEnabled={false}
      />
      <TripDetailsModal
        visible={modalVisible}
        trip={selectedTrip}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}
