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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";
import { driverApi } from "../../lib/driverApi";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import {
  getTripStatusColor,
  getTripStatusLabel,
} from "../../config/tripStatus";

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
  useScreenPermissionSync("TripHistory");
  const { user } = useAuth();

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
      const res = await driverApi.getTripHistory();
      // Expect res.trips or res.data or res
      const list = res?.trips || res?.data || res || [];
      setTrips(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Trip history fetch failed", err?.message || err);
      setError(err?.message);
      setTrips([]);
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



  const [selectedTrip, setSelectedTrip] = useState(null);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.tripCard,
        { backgroundColor: themeRef.current?.colors?.surfaceElevated },
      ]}
      onPress={() => setSelectedTrip(item)}
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
            {item.msLocation?.name} to {item.dbsLocation?.name}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getTripStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getTripStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={[styles.tripMeta, { marginTop: 6 }]}>
             {new Date(
               item.completedAt ||
                 item.acceptedAt ||
                 item.createdAt ||
                 Date.now()
             ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
           </Text>
        </View>
      </View>
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

      <Modal
        visible={!!selectedTrip}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTrip(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: themeRef.current?.colors?.background || "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: themeRef.current?.colors?.textPrimary,
                }}
              >
                Trip Details
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedTrip(null)}
                style={{ padding: 4 }}
              >
                <AppIcon
                  icon="close"
                  size={24}
                  color={themeRef.current?.colors?.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <View>
                {/* Trip ID & Status Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <View>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary, fontSize: 12, marginBottom: 4 }}>Trip ID</Text>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: themeRef.current?.colors?.textPrimary }}>
                      {selectedTrip.tripId}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary, fontSize: 12, marginBottom: 4 }}>Status</Text>
                    <View
                      style={{
                        backgroundColor: getTripStatusColor(selectedTrip.status),
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                        {getTripStatusLabel(selectedTrip.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: themeRef.current?.colors?.surfaceMuted || "#eee", marginVertical: 8 }} />

                {/* Locations */}
                <View style={{ gap: 12, marginBottom: 16 }}>
                  <View>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary, fontSize: 12 }}>From</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", color: themeRef.current?.colors?.textPrimary }}>
                      {selectedTrip.msLocation?.name}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary, fontSize: 12 }}>To</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", color: themeRef.current?.colors?.textPrimary }}>
                      {selectedTrip.dbsLocation?.name}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: themeRef.current?.colors?.surfaceMuted || "#eee", marginVertical: 8 }} />

                {/* Timestamps */}
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary }}>Created At</Text>
                    <Text style={{ color: themeRef.current?.colors?.textPrimary, fontWeight: "500" }}>
                      {formatDateTime(selectedTrip.createdAt)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary }}>Accepted At</Text>
                    <Text style={{ color: themeRef.current?.colors?.textPrimary, fontWeight: "500" }}>
                      {formatDateTime(selectedTrip.acceptedAt)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: themeRef.current?.colors?.textSecondary }}>Completed At</Text>
                    <Text style={{ color: themeRef.current?.colors?.textPrimary, fontWeight: "500" }}>
                      {formatDateTime(selectedTrip.completedAt)}
                    </Text>
                  </View>
                  {selectedTrip.deliveredQty && (
                     <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                       <Text style={{ color: themeRef.current?.colors?.textSecondary }}>Delivered Qty</Text>
                       <Text style={{ color: themeRef.current?.colors?.textPrimary, fontWeight: "bold" }}>
                         {selectedTrip.deliveredQty}
                       </Text>
                     </View>
                  )}
                </View>

                <AppButton
                  title="Close"
                  onPress={() => setSelectedTrip(null)}
                  style={{ marginTop: 24 }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "-";
  }
}

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
