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
  PENDING: "#f59e0b",
  FILLING: "#0ea5e9",
  COMPLETED: "#10b981",
};

const STATUS_GROUPS = {
  PENDING: ["PENDING", "SCHEDULED", "ON_HOLD", "DELAYED", ""],
  FILLING: ["IN_PROGRESS", "LOADING", "DISPATCHED", "ARRIVED"],
  COMPLETED: ["COMPLETED", "DELIVERED", "CONFIRMED"],
};

const deriveStatusCategory = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (STATUS_GROUPS.COMPLETED.some((value) => normalized.includes(value))) {
    return "COMPLETED";
  }
  if (STATUS_GROUPS.FILLING.some((value) => normalized.includes(value))) {
    return "FILLING";
  }
  return "PENDING";
};

const formatDateHeading = (value) => {
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
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildSections = (trips = []) => {
  const buckets = trips.reduce((acc, trip) => {
    const key = formatDateHeading(trip.scheduledTime);
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key).push(trip);
    return acc;
  }, new Map());

  return Array.from(buckets.entries())
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

const getStatusColor = (status) => STATUS_COLORS[deriveStatusCategory(status)];

const formatStatusLabel = (status) => {
  const category = deriveStatusCategory(status);
  if (category === "FILLING") return "Filling";
  if (category === "COMPLETED") return "Completed";
  return "Pending";
};

export default function DBSDashboard() {
  const { user } = useAuth();
  const dbsId = user?.dbsId || "DBS-09";
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
      headerTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      headerMeta: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: theme.spacing(4),
        gap: theme.spacing(2),
      },
      summaryChip: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(2),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: "center",
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
        alignItems: "center",
        justifyContent: "space-between",
      },
      tripId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 5,
      },
      statusText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.surfaceElevated,
        letterSpacing: 0.4,
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
    queryKey: ["dbsTripSchedule", dbsId],
    queryFn: () => GTS.getDbsTripSchedule(dbsId),
    refetchInterval: 60000,
    enabled: Boolean(dbsId),
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const sections = useMemo(
    () => buildSections(data?.trips || []),
    [data?.trips]
  );

  const summary = data?.summary || {
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>
        {data?.station?.dbsName || "DBS Dashboard"}
      </Text>
      {data?.station?.location && (
        <Text style={styles.headerMeta}>{data.station.location}</Text>
      )}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>{summary.pending}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryLabel}>Filling</Text>
          <Text style={styles.summaryValue}>{summary.inProgress}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{summary.completed}</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
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
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {formatStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.tripRoute}>
        {item.route || `${item.msName || "MS"} → ${item.dbsName || "DBS"}`}
      </Text>
      {/* <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AppIcon icon="factory" size={14} color="#1e293b" />
          <Text style={styles.metaText}>{item.msName || "MS Station"}</Text>
        </View>
        <View style={styles.metaItem}>
          <AppIcon icon="analytics" size={14} color="#1e293b" />
          <Text style={styles.metaText}>{formatTime(item.scheduledTime)}</Text>
        </View>
      </View> */}
    </TouchableOpacity>
  );

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
        keyExtractor={(item, index) =>
          item.id || `${index}-${item.scheduledTime}`
        }
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
              No trips scheduled for the selected window.
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
