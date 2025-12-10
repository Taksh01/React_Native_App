import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import VehicleTrackingAPI from "../../api/vehicleTracking";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

export default function VehicleTracking() {
  useScreenPermissionSync("VehicleTracking");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [realTimeEnabled] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      statsContainer: {
        flexDirection: "row",
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: theme.spacing(5),
        paddingVertical: theme.spacing(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      },
      statItem: {
        flex: 1,
        alignItems: "center",
        backgroundColor: theme.colors.surfaceMuted,
        paddingVertical: theme.spacing(4),
        paddingHorizontal: theme.spacing(2),
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        marginHorizontal: theme.spacing(1),
      },
      primaryStat: {
        backgroundColor: "#eff6ff",
        borderColor: theme.colors.primary,
        borderWidth: 2,
      },
      statNumber: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      statLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      listContainer: {
        paddingHorizontal: theme.spacing(5),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(4),
      },
      vehicleCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      cardHeader: {
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(3),
      },
      vehicleInfo: {
        flex: 1,
      },
      vehicleId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      cardContent: {
        paddingHorizontal: theme.spacing(4),
        paddingBottom: theme.spacing(4),
      },
      locationSection: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        marginBottom: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      locationItem: {
        marginVertical: theme.spacing(1),
      },
      locationHeader: {
        marginBottom: theme.spacing(1),
      },
      locationTitle: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      },
      locationAddress: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.body,
        fontWeight: theme.typography.weightMedium,
      },
      locationDivider: {
        height: 1,
        backgroundColor: theme.colors.borderSubtle,
        marginVertical: theme.spacing(2),
      },
      metricsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: theme.spacing(3),
        paddingVertical: theme.spacing(3),
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
      },
      metric: {
        alignItems: "center",
        flex: 1,
      },
      metricValue: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      metricLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        textTransform: "uppercase",
      },
      cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      adherenceContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surfaceMuted,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.pill,
      },
      adherenceDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: theme.spacing(2),
      },
      adherenceText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
      },
      lastUpdated: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weightMedium,
        backgroundColor: theme.colors.surfaceMuted,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.pill,
      },
      emptyContainer: {
        alignItems: "center",
        paddingVertical: 60,
      },
      emptyText: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      emptySubtext: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        textAlign: "center",
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
      retryButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing(5),
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
      },
      retryButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
      modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.surfaceElevated,
      },
      modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: theme.spacing(5),
        paddingVertical: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      },
      modalTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      closeButton: {
        padding: theme.spacing(2),
      },
      closeButtonText: {
        fontSize: theme.typography.sizes.title,
        color: theme.colors.textSecondary,
      },
      modalContent: {
        flex: 1,
        padding: theme.spacing(5),
      },
      detailSection: {
        marginBottom: theme.spacing(5),
      },
      detailLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
        textTransform: "uppercase",
        fontWeight: theme.typography.weightSemiBold,
      },
      detailValue: {
        fontSize: theme.typography.sizes.bodyLarge,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.bodyLarge,
      },
      detailSubValue: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
    })
  );

  useEffect(() => {
    VehicleTrackingAPI.testConnection();
  }, []);

  const {
    data: vehicleData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["activeVehicles"],
    queryFn: () => VehicleTrackingAPI.getActiveVehicles(),
    refetchInterval: realTimeEnabled ? 10000 : false,
    retry: 1,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = VehicleTrackingAPI.subscribeToVehicleUpdates((data) => {
      // Updates are handled by React Query refetch
    });

    return unsubscribe;
  }, [realTimeEnabled]);

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_TRANSIT":
        return "#3b82f6";
      case "APPROACHING_DESTINATION":
        return "#f59e0b";
      case "ARRIVED":
        return "#10b981";
      case "DELAYED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getRouteAdherenceColor = (adherence) => {
    switch (adherence) {
      case "ON_ROUTE":
        return "#10b981";
      case "MINOR_DEVIATION":
        return "#f59e0b";
      case "MAJOR_DEVIATION":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatETA = (eta) => {
    const etaDate = new Date(eta);
    const now = new Date();
    const diffMinutes = Math.floor((etaDate - now) / (1000 * 60));

    if (diffMinutes < 0) return "Overdue";
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatLastUpdated = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVehiclePress = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const renderVehicleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => handleVehiclePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleId}>
            {item.vehicleId} - {item.driverName}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.locationSection}>
          <View style={styles.locationItem}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationTitle}>Current Location</Text>
            </View>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item.currentLocation.address}
            </Text>
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationItem}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationTitle}>Destination</Text>
            </View>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item.destination.address}
            </Text>
          </View>
        </View>

        {/* <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.speed}</Text>
            <Text style={styles.metricLabel}>km/h</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatETA(item.eta)}</Text>
            <Text style={styles.metricLabel}>ETA</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.fuelLevel}%</Text>
            <Text style={styles.metricLabel}>Fuel</Text>
          </View>
        </View> */}

        <View style={styles.cardFooter}>
          <View style={styles.adherenceContainer}>
            <View
              style={[
                styles.adherenceDot,
                {
                  backgroundColor: getRouteAdherenceColor(item.routeAdherence),
                },
              ]}
            />
            <Text style={styles.adherenceText}>
              {item.routeAdherence.replace("_", " ")}
              {item.deviationDistance > 0 && ` (${item.deviationDistance}m)`}
            </Text>
          </View>
          <Text style={styles.lastUpdated}>
            {formatLastUpdated(item.lastUpdated)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statItem, styles.primaryStat]}>
        <Text style={styles.statNumber}>{vehicleData?.totalActive || 0}</Text>
        <Text style={styles.statLabel}>Active Trucks</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {vehicleData?.vehicles?.filter((v) => v.routeAdherence === "ON_ROUTE")
            .length || 0}
        </Text>
        <Text style={styles.statLabel}>On Route</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {vehicleData?.vehicles?.filter((v) => v.routeAdherence !== "ON_ROUTE")
            .length || 0}
        </Text>
        <Text style={styles.statLabel}>Deviations</Text>
      </View>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load vehicle data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {renderStatsHeader()}

      <FlatList
        data={vehicleData?.vehicles || []}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item.vehicleId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active vehicles</Text>
            <Text style={styles.emptySubtext}>
              All vehicles are currently idle or completed their trips
            </Text>
          </View>
        }
      />

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vehicle Details</Text>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedVehicle && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Vehicle ID</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.vehicleId}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Trip ID</Text>
                <Text style={styles.detailValue}>{selectedVehicle.tripId}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Driver</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.driverName} ({selectedVehicle.driverId})
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Current Location</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.currentLocation.address}
                </Text>
                <Text style={styles.detailSubValue}>
                  Lat: {selectedVehicle.currentLocation.latitude.toFixed(6)},
                  Lng: {selectedVehicle.currentLocation.longitude.toFixed(6)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Destination</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.destination.address}
                </Text>
              </View>

              {/* <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Speed</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.speed} km/h
                </Text>
              </View> */}
              {/* 
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.detailValue}>
                  {formatETA(selectedVehicle.eta)} (
                  {new Date(selectedVehicle.eta).toLocaleString("en-IN")})
                </Text>
              </View> */}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Route Adherence</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: getRouteAdherenceColor(
                        selectedVehicle.routeAdherence
                      ),
                    },
                  ]}
                >
                  {selectedVehicle.routeAdherence.replace("_", " ")}
                  {selectedVehicle.deviationDistance > 0 &&
                    ` (Deviation: ${selectedVehicle.deviationDistance}m)`}
                </Text>
              </View>

              {/* <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Fuel Level</Text>
                <Text style={styles.detailValue}>
                  {selectedVehicle.fuelLevel}%
                </Text>
              </View> */}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getStatusColor(selectedVehicle.status) },
                  ]}
                >
                  {selectedVehicle.status.replace("_", " ")}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedVehicle.lastUpdated).toLocaleString(
                    "en-IN"
                  )}
                </Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
