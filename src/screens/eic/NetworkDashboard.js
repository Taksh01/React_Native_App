import React, { useMemo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SectionList,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";

const getStatusColors = (statusRaw) => {
  const s = (statusRaw || "SCHEDULED").toUpperCase();
  const map = {
    SCHEDULED: { fg: "#1f2937", bg: "#e5e7eb" },
    EN_ROUTE: { fg: "#065f46", bg: "#d1fae5" },
    DELAYED: { fg: "#78350f", bg: "#ffedd5" },
    COMPLETED: { fg: "#1e3a8a", bg: "#dbeafe" },
    CANCELLED: { fg: "#7f1d1d", bg: "#fee2e2" },
  };
  return map[s] || map.SCHEDULED;
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

const nextTrips = (trips = [], limit = 3) =>
  [...trips]
    .filter((trip) => trip?.scheduledTime)
    .sort(
      (a, b) =>
        new Date(a.scheduledTime || 0).getTime() -
        new Date(b.scheduledTime || 0).getTime()
    )
    .slice(0, limit);

const EXCLUDED_DBS_BY_MS = {
  "MS-14": new Set(["DBS-09", "DBS-15"]),
  "Sanand MS": new Set(["DBS-09", "DBS-15"]),
  "MS-18": new Set(["DBS-09"]),
  "Naroda MS": new Set(["DBS-09"]),
};

const shouldExcludeTrip = (ms, trip) => {
  if (!trip) return true;
  const blacklist =
    EXCLUDED_DBS_BY_MS[ms?.msId] || EXCLUDED_DBS_BY_MS[ms?.msName];
  if (!blacklist) {
    return false;
  }
  return blacklist.has(trip.dbsId);
};

const groupByDbs = (ms, dbsLookup) => {
  const grouped = new Map();
  (ms.trips || [])
    .filter((trip) => !shouldExcludeTrip(ms, trip))
    .forEach((trip, idx) => {
      const key = trip.dbsId || `${ms.msId}-DBS-${idx}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          dbsId: trip.dbsId,
          dbsName: trip.dbsName || `DBS ${idx + 1}`,
          trips: [],
        });
      }
      grouped.get(key).trips.push(trip);
    });

  return Array.from(grouped.values()).map((record, idx) => {
    const reference = record.dbsId ? dbsLookup.get(record.dbsId) : null;
    let sourceTrips = record.trips;

    if (reference?.trips?.length) {
      const alignedTrips = reference.trips.filter((trip) => {
        if (!trip) return false;
        if (trip.msId && ms?.msId) {
          return trip.msId === ms.msId;
        }
        if (trip.msName && ms?.msName) {
          return trip.msName.toLowerCase() === ms.msName.toLowerCase();
        }
        return true;
      });

      if (alignedTrips.length) {
        sourceTrips = alignedTrips;
      }
    }

    if (!Array.isArray(sourceTrips) || sourceTrips.length === 0) {
      sourceTrips = record.trips;
    }
    return {
      key: record.dbsId || `${ms.msId}-db-${idx}`,
      dbsId: record.dbsId,
      dbsName: reference?.dbsName || record.dbsName,
      location: reference?.location || ms.location,
      previewTrips: nextTrips(sourceTrips),
      trips: sourceTrips,
    };
  });
};

const buildSections = (trips = []) => {
  const buckets = trips.reduce((acc, trip) => {
    const heading = formatDate(trip.scheduledTime);
    if (!acc.has(heading)) acc.set(heading, []);
    acc.get(heading).push(trip);
    return acc;
  }, new Map());

  return Array.from(buckets.entries()).map(([title, data]) => ({
    title,
    data: data.sort(
      (a, b) =>
        new Date(a.scheduledTime || 0).getTime() -
        new Date(b.scheduledTime || 0).getTime()
    ),
  }));
};

export default function NetworkDashboard() {
  const [selectedStation, setSelectedStation] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      listContent: {
        paddingHorizontal: theme.spacing(1),
        paddingBottom: theme.spacing(0.5),
        paddingTop: theme.spacing(0.2),
        gap: theme.spacing(0.5),
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: 8,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2.5),
        borderWidth: 0.5,
        borderColor: theme.colors.borderSubtle,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      cardHeader: {
        paddingBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
        marginBottom: 15,
        alignItems: "flex-start",
      },
      msTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.textPrimary,
        lineHeight: 20,
      },
      msSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 0,
        lineHeight: 20, // optional: keeps title/subtitle snug
      },
      dbList: {
        marginTop: theme.spacing(1),
        gap: theme.spacing(1),
      },
      dbCard: {
        borderWidth: 0.5,
        borderColor: theme.colors.borderStrong,
        borderRadius: 6,
        paddingHorizontal: theme.spacing(2),
        paddingVertical: 0,
        backgroundColor: "#f8fafc",
        marginBottom: 5,
      },
      dbCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 20,
      },
      dbCardDetails: {
        flex: 1,
        gap: 0,
        alignItems: "flex-start",
      },
      dbTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.textPrimary,
        lineHeight: 18,
        includeFontPadding: false,
      },
      dbSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        includeFontPadding: false,
      },
      previewList: {
        marginTop: theme.spacing(1),
        gap: theme.spacing(0.8),
      },
      previewItem: {
        flexDirection: "row",
        justifyContent: "space-between",
      },
      previewText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      inlineButton: {
        borderRadius: 12,
        backgroundColor: "#1d4ed8", // slightly deeper blue
        minWidth: 80,
        alignItems: "center",
        justifyContent: "center",
      },
      inlineButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#ffffff",
        textAlign: "center",
        letterSpacing: 0.3,
      },
      emptyCopy: {
        marginTop: theme.spacing(1),
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: "italic",
        textAlign: "center",
        paddingVertical: theme.spacing(1),
      },
      mutedText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginTop: theme.spacing(1),
      },
      emptyState: {
        alignItems: "center",
        padding: theme.spacing(4),
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
      },
      modalCard: {
        maxHeight: "85%",
        backgroundColor: theme.colors.surfaceElevated,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: theme.spacing(3),
        paddingHorizontal: theme.spacing(5),
        paddingBottom: theme.spacing(2),
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.textPrimary,
        textAlign: "center",
      },
      modalSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
        textAlign: "center",
      },
      modalSectionHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.textPrimary,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        borderRadius: 4,
      },
      modalList: {
        padding: theme.spacing(2),
      },
      modalFooter: {
        marginTop: theme.spacing(2),
        paddingTop: theme.spacing(2),
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.borderSubtle,
      },
      modalDivider: {
        height: 0.5,
        backgroundColor: theme.colors.borderSubtle,
        marginVertical: theme.spacing(1),
      },
      tripRow: {
        paddingVertical: theme.spacing(1.5),
        paddingHorizontal: theme.spacing(2),
        backgroundColor: "#fafbfc",
        borderRadius: 6,
        marginVertical: theme.spacing(0.5),
      },
      tripMain: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(0.5),
      },
      tripId: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.textPrimary,
      },
      tripStatus: {
        fontSize: 10,
        fontWeight: "700",
        color: "#059669",
        backgroundColor: "#dcfce7",
        paddingHorizontal: theme.spacing(1),
        paddingVertical: theme.spacing(0.25),
        borderRadius: 3,
        textTransform: "uppercase",
      },
      tripMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      tripMetaText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
      },

      newModalCard: {
        maxHeight: "90%",
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: 10,
        position: "relative",
      },

      modalHeader: {
        alignItems: "center",
        marginBottom: 8,
        position: "relative",
      },

      closeFab: {
        position: "absolute",
        top: 25, // always visible; not clipped
        right: 8,
        zIndex: 1000,
        backgroundColor: "#1e3a8a",
        height: 40,
        minWidth: 72,
        paddingHorizontal: 12,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4, // Android shadow
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },

      closeFabText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
        includeFontPadding: false,
        lineHeight: 16,
        textTransform: "uppercase",
      },

      modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: theme.colors.textPrimary,
        textAlign: "center",
      },

      modalSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginTop: 2,
      },

      newSectionHeader: {
        marginTop: 10,
        marginBottom: 6,
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
        textTransform: "uppercase",
      },

      tripCard: {
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 0.5,
        borderColor: "#e5e7eb",
      },

      tripTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 3,
      },

      tripId: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
      },

      tripStatus: {
        fontSize: 10,
        fontWeight: "700",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        textTransform: "uppercase",
      },

      tripBottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },

      tripRoute: {
        fontSize: 12,
        color: "#374151",
        flex: 1,
        marginRight: 8,
      },

      timeBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eef2ff",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
      },

      timeText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#1e3a8a",
        marginLeft: 4,
      },

      itemSeparator: {
        height: 6,
      },
    })
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["networkOverview"],
    queryFn: () => GTS.getNetworkOverview(),
    refetchInterval: 60000,
  });

  const dbsLookup = useMemo(() => {
    const map = new Map();
    (data?.dbsStations || []).forEach((station) => {
      if (station.dbsId) map.set(station.dbsId, station);
    });
    return map;
  }, [data?.dbsStations]);

  const msCards = useMemo(() => {
    return (data?.msStations || []).map((ms) => ({
      ...ms,
      dbRecords: groupByDbs(ms, dbsLookup),
      key: ms.msId || ms.msName,
    }));
  }, [data?.msStations, dbsLookup]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const modalSections = useMemo(
    () => buildSections(selectedStation?.trips || []),
    [selectedStation]
  );

  const closeModal = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedStation(null);
  }, []);

  const openDetails = useCallback((record) => {
    setSelectedStation(record);
    setShowScheduleModal(true);
  }, []);

  const renderDbRecord = (record) => (
    <View key={record.key} style={styles.dbCard}>
      <View style={styles.dbCardHeader}>
        <View style={styles.dbCardDetails}>
          <Text style={styles.dbTitle}>{record.dbsName || record.dbsId}</Text>
          {record.location ? (
            <Text style={styles.dbSubtitle}>{record.location}</Text>
          ) : null}
        </View>
        <AppButton
          title="Details"
          onPress={() => openDetails(record)}
          style={styles.inlineButton}
          textStyle={styles.inlineButtonText}
        />
      </View>
    </View>
  );

  const renderMsCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.msTitle}>{item.msName || item.msId}</Text>
        {item.location ? (
          <Text style={styles.msSubtitle}>{item.location}</Text>
        ) : null}
      </View>
      {item.dbRecords.length ? (
        <View style={styles.dbList}>{item.dbRecords.map(renderDbRecord)}</View>
      ) : (
        <Text style={styles.emptyCopy}>No DBS connected to this MS.</Text>
      )}
    </View>
  );

  const renderScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.newModalCard}>
          <AppButton
            title="Close"
            onPress={closeModal}
            style={styles.closeFab}
            textStyle={styles.closeFabText}
          />
          {/* Header */}

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedStation?.dbsName || "DBS Station"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedStation?.location || "Trip Schedule Overview"}
            </Text>
          </View>

          {/* Trip List */}
          {modalSections.length === 0 ? (
            <View style={styles.emptyState}>
              <AppIcon icon="trips" size={28} color="#9ca3af" />
              <Text style={styles.mutedText}>No trips scheduled.</Text>
            </View>
          ) : (
            <SectionList
              sections={modalSections}
              keyExtractor={(item, index) =>
                item.id || `${index}-${item.msName || "trip"}`
              }
              ListFooterComponent={() => <View style={{ height: 24 }} />}
              renderSectionHeader={({ section }) => (
                <Text style={styles.newSectionHeader}>{section.title}</Text>
              )}
              renderItem={({ item }) => {
                const { fg, bg } = getStatusColors(item.status);
                return (
                  <View style={styles.tripCard}>
                    <View style={styles.tripTopRow}>
                      <Text style={styles.tripId}>{item.id}</Text>
                      <Text
                        style={[
                          styles.tripStatus,
                          { color: fg, backgroundColor: bg },
                        ]}
                      >
                        {(item.status || "Scheduled").toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.tripBottomRow}>
                      <Text style={styles.tripRoute}>
                        {item.msName || "MS"} → {item.dbsName || "DBS"}
                      </Text>
                      <View style={styles.timeBadge}>
                        <AppIcon icon="clock" size={14} color="#1e40af" />
                        <Text style={styles.timeText}>
                          {formatTime(item.scheduledTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={styles.itemSeparator} />
              )}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
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
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <FlatList
        data={msCards}
        keyExtractor={(item) => item.key}
        renderItem={renderMsCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppIcon icon="trips" size={30} color="#94a3b8" />
            <Text style={styles.mutedText}>No MS clusters configured.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
        }
      />
      {renderScheduleModal()}
    </SafeAreaView>
  );
}
