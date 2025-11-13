import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";
import { driverApi } from "../../lib/driverApi";
import { useThemedStyles } from "../../theme";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";

function formatDateHeader(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Unknown Date";
    return d.toLocaleDateString();
  } catch (_e) {
    return "Unknown Date";
  }
}

function groupTripsByDate(trips) {
  const map = {};
  trips.forEach((t) => {
    const key =
      t.completedAt ||
      t.acceptedAt ||
      t.createdAt ||
      t.date ||
      t.timestamp ||
      null;
    const dateKey = key ? new Date(key).toISOString().slice(0, 10) : "unknown";
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(t);
  });

  // convert to sections and sort dates descending
  const sections = Object.keys(map)
    .map((k) => ({ title: k, data: map[k] }))
    .sort((a, b) => (a.title < b.title ? 1 : -1));

  // sort trips in each section by most recent first
  sections.forEach((s) => {
    s.data.sort((x, y) => {
      const tx = new Date(
        x.completedAt || x.acceptedAt || x.createdAt || 0
      ).getTime();
      const ty = new Date(
        y.completedAt || y.acceptedAt || y.createdAt || 0
      ).getTime();
      return ty - tx;
    });
  });

  return sections;
}

export default function TripHistory({ navigation }) {
  const { user } = useAuth();
  const MS_DISPLAY_NAME = "Vastral MS";
  const DBS_DISPLAY_NAME = "Mehsana DBS";
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      header: {
        padding: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceMuted,
      },
      headerTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      sectionHeader: {
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(2),
        // Keep a consistent light-gray background behind the date header
        backgroundColor: "#f3f4f6",
      },
      sectionHeaderText: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      tripCard: {
        padding: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceMuted,
        backgroundColor: theme.colors.background,
      },
      tripTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      tripMeta: {
        marginTop: theme.spacing(2),
        color: theme.colors.textSecondary,
      },
      statusBadge: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.md,
        alignSelf: "flex-end",
      },
      statusText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      emptyContainer: {
        padding: theme.spacing(6),
        alignItems: "center",
        justifyContent: "center",
      },
    });
  });

  const loadTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const driverId = user?.id || "unknown";
      const res = await driverApi.getTripHistory({
        driverId,
        page: 1,
        limit: 200,
      });
      // Expect res.trips or res.data or res
      const list = res?.trips || res?.data || res || [];
      setTrips(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Trip history fetch failed", err?.message || err);
      setError(err?.message || "Failed to load trips");
      // fallback: create some mock trips to avoid blank screen in demos
      setTrips([
        {
          tripId: "TRIP-101",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 2 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 1250,
        },
        {
          tripId: "TRIP-202",
          status: "COMPLETED",
          completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 980,
        },
      ]);
      // fallback: create a larger set of mock trips for demos
      setTrips([
        {
          tripId: "TRIP-20251112-06",
          status: "ACTIVE",
          completedAt: new Date().toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 1250,
        },
        {
          tripId: "TRIP-20251112-02",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 1 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 980,
        },
        {
          tripId: "TRIP-20251111-03",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 2 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 1120,
        },
        {
          tripId: "TRIP-20251109-04",
          status: "CANCELLED",
          completedAt: new Date(
            Date.now() - 4 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "MS Station Gamma" },
          dbsLocation: { name: "DBS Station Omega" },
          deliveredQty: 0,
        },
        {
          tripId: "TRIP-20251108-05",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 5 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 760,
        },
        {
          tripId: "TRIP-20251106-06",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 7 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "MS Station Mu" },
          dbsLocation: { name: "DBS Station Nu" },
          deliveredQty: 1430,
        },
        {
          tripId: "TRIP-20251030-07",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 14 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 640,
        },
        {
          tripId: "TRIP-20251023-08",
          status: "COMPLETED",
          acceptedAt: new Date(
            Date.now() - 21 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "MS Station Rho" },
          dbsLocation: { name: "DBS Station Phi" },
          deliveredQty: 500,
        },
        {
          tripId: "TRIP-20251018-09",
          status: "CANCELLED",
          createdAt: new Date(Date.now() - 26 * 24 * 3600 * 1000).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 0,
        },
        {
          tripId: "TRIP-20251013-10",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 31 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "MS Station Omicron" },
          dbsLocation: { name: "DBS Station Pi" },
          deliveredQty: 990,
        },
        {
          tripId: "TRIP-20251005-11",
          status: "FAILED",
          completedAt: new Date(
            Date.now() - 39 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "Vastral MS" },
          dbsLocation: { name: "Mehsana DBS" },
          deliveredQty: 0,
        },
        {
          tripId: "TRIP-20250928-12",
          status: "COMPLETED",
          completedAt: new Date(
            Date.now() - 46 * 24 * 3600 * 1000
          ).toISOString(),
          msLocation: { name: "MS Station Alpha" },
          dbsLocation: { name: "DBS Station Beta" },
          deliveredQty: 1200,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const sections = groupTripsByDate(trips);

  // Filtering & searching
  const filteredSections = useMemo(() => {
    // flatten, filter, then regroup
    const flat = trips.filter((t) => {
      if (
        filter === "COMPLETED" &&
        (t.status || "").toUpperCase() !== "COMPLETED"
      )
        return false;
      if (filter === "ACTIVE" && (t.status || "").toUpperCase() === "COMPLETED")
        return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (t.tripId || "").toLowerCase().includes(q) ||
        (t.msLocation?.name || "").toLowerCase().includes(q) ||
        (t.dbsLocation?.name || "").toLowerCase().includes(q)
      );
    });
    return groupTripsByDate(flat);
  }, [trips, filter, query]);

  const statusColor = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "SUCCESS")
      return themeRef.current?.colors?.success || "#16a34a";
    if (s === "CANCELLED" || s === "FAILED")
      return themeRef.current?.colors?.danger || "#ef4444";
    if (s === "ASSIGNED" || s === "ACCEPTED" || s === "ACTIVE")
      return themeRef.current?.colors?.primary || "#2563eb";
    return themeRef.current?.colors?.info || "#0ea5e9";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.tripCard,
        { backgroundColor: themeRef.current?.colors?.surfaceElevated },
      ]}
      onPress={() => navigation?.navigate("Dashboard", { trip: item })}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.tripTitle}>Trip {item.tripId}</Text>
          <Text style={styles.tripMeta} numberOfLines={1} ellipsizeMode="tail">
            {MS_DISPLAY_NAME} to {DBS_DISPLAY_NAME}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {(item.status || "").toUpperCase()}
            </Text>
          </View>
          {/* <Text style={[styles.tripMeta, { marginTop: 6 }]}>
            {new Date(
              item.completedAt ||
                item.acceptedAt ||
                item.createdAt ||
                Date.now()
            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text> */}
        </View>
      </View>
      {/* <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text style={styles.tripMeta}>
          Delivered: {item.deliveredQty ?? "-"}
        </Text>
        <AppIcon
          icon="chevron-right"
          size={16}
          color={themeRef.current?.colors?.iconDark || "#374151"}
        />
      </View> */}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{friendlyDateLabel(title)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Trips - History</Text>
      </View> */}

      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {/* <TextInput
            placeholder="Search trips, MS or DBS"
            placeholderTextColor={themeRef.current?.colors?.textSecondary}
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              backgroundColor: themeRef.current?.colors?.surfaceMuted,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              color: themeRef.current?.colors?.textPrimary,
            }}
          /> */}
        </View>

        {/* <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <AppButton
            title="All"
            onPress={() => setFilter("ALL")}
            variant={filter === "ALL" ? "primary" : "ghost"}
          />
          <AppButton
            title="Completed"
            onPress={() => setFilter("COMPLETED")}
            variant={filter === "COMPLETED" ? "primary" : "ghost"}
          />
          <AppButton
            title="Active"
            onPress={() => setFilter("ACTIVE")}
            variant={filter === "ACTIVE" ? "primary" : "ghost"}
          />
        </View> */}

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={"#3b82f6"} />
          </View>
        ) : (
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.tripId || Math.random().toString()}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <AppIcon icon="history" size={48} color={"#94a3b8"} />
                <Text
                  style={{
                    marginTop: 12,
                    color: themeRef.current?.colors?.textSecondary,
                  }}
                >
                  No past trips found.
                </Text>
                <AppButton
                  title="Refresh"
                  onPress={loadTrips}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Helpers
function friendlyDateLabel(isoOrKey) {
  try {
    if (!isoOrKey) return "Unknown";
    // if input looks like YYYY-MM-DD
    const date = new Date(isoOrKey);
    if (Number.isNaN(date.getTime())) return isoOrKey;
    const today = new Date();
    const dStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const tStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const diff = Math.round((tStart - dStart) / (24 * 3600 * 1000));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (_e) {
    return isoOrKey;
  }
}
