import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as sglCustomerApi from "../../lib/sglCustomerApi";
import { useAuth } from "../../store/auth";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

export default function TripAcceptance() {
  useScreenPermissionSync("TripAcceptance");
  const { user } = useAuth();
  const dbsId = user?.dbsId;
  const customerUserId = user?.id ?? "6";
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acceptedTripIds, setAcceptedTripIds] = useState(new Set());
  const queryClient = useQueryClient();
  const themeRef = useRef(null);

  const {
    data: tripsData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["pendingTrips", dbsId],
    queryFn: () => sglCustomerApi.getPendingTrips(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ["data", "error"],
  });

  const { data: permissionData, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ["customerPermissions", customerUserId],
    queryFn: () => sglCustomerApi.getCustomerPermissions(),
    staleTime: 5 * 60 * 1000,
  });

  const acceptTripMutation = useMutation({
    mutationFn: (tripId) => sglCustomerApi.acceptTrip(tripId),
    onMutate: async (tripId) => {
      await queryClient.cancelQueries(["pendingTrips", dbsId]);
      const previousTrips = queryClient.getQueryData(["pendingTrips", dbsId]);
      queryClient.setQueryData(["pendingTrips", dbsId], (old) => ({
        ...old,
        trips: old?.trips?.filter((trip) => trip.id !== tripId) || [],
      }));
      return { previousTrips };
    },
    onSuccess: (data, tripId) => {
      setAcceptedTripIds((prev) => new Set([...prev, tripId]));
      setShowConfirmModal(false);
      setSelectedTrip(null);
      Alert.alert("Success", "Trip accepted successfully");
    },
    onError: (error, tripId, context) => {
      queryClient.setQueryData(["pendingTrips", dbsId], context.previousTrips);
      Alert.alert("Error", error.message || "Failed to accept trip");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["pendingTrips", dbsId]);
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const canAcceptTrips = permissionData?.canAcceptTrips === true;

  const handleAcceptTrip = (trip) => {
    if (!canAcceptTrips) {
      Alert.alert(
        "Permission Required",
        "You don't have permission to accept trips. Contact your Super Admin for access."
      );
      return;
    }
    setSelectedTrip(trip);
    setShowConfirmModal(true);
  };

  const confirmAcceptTrip = () => {
    if (selectedTrip) {
      acceptTripMutation.mutate(selectedTrip.id);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "#ef4444";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ! Later on bring this from backend
  const calculateUrgency = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffHours = Math.floor((scheduled - now) / (1000 * 60 * 60));

    if (diffHours < 2) return { text: "URGENT", color: "#ef4444" };
    if (diffHours < 6) return { text: "SOON", color: "#f59e0b" };
    return { text: "SCHEDULED", color: "#10b981" };
  };

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#f8fafc",
      },
      permissionBanner: {
        margin: 16,
        padding: 16,
        backgroundColor: "#fef3c7",
        borderColor: "#f59e0b",
        borderWidth: 1,
        borderRadius: 12,
      },
      permissionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#b45309",
        marginBottom: 4,
      },
      permissionText: {
        fontSize: 14,
        color: "#92400e",
        lineHeight: 20,
      },
      listContainer: {
        padding: 16,
      },
      tripCard: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
      },
      tripInfo: {
        flex: 1,
      },
      tripId: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
      },
      routeText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 2,
      },
      badges: {
        alignItems: "flex-end",
        gap: 6,
      },
      urgencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
      },
      urgencyText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#ffffff",
      },
      priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
      },
      priorityText: {
        fontSize: 11,
        fontWeight: "600",
      },
      tripDetails: {
        marginBottom: 12,
      },
      detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
      },
      detailLabel: {
        fontSize: 13,
        color: "#64748b",
      },
      detailValue: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1e293b",
      },
      notes: {
        fontSize: 12,
        color: "#64748b",
        fontStyle: "italic",
        marginBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
      },
      actionContainer: {
        alignItems: "center",
      },
      acceptButton: {
        backgroundColor: "#10b981",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
      },
      acceptButtonText: {
        color: "#ffffff",
        fontWeight: "600",
        textAlign: "center",
      },
      disabledButton: {
        backgroundColor: "#e2e8f0",
      },
      disabledButtonText: {
        color: "#94a3b8",
      },
      loadingContainer: {
        alignItems: "center",
        paddingVertical: 40,
      },
      loadingText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 12,
      },
      emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
      },
      emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
      },
      emptySubtext: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 4,
        textAlign: "center",
      },
      errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      },
      errorText: {
        fontSize: 16,
        color: "#ef4444",
        marginBottom: 16,
        textAlign: "center",
      },
      retryButton: {
        backgroundColor: "#3b82f6",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
      },
      retryButtonText: {
        color: "#ffffff",
        fontWeight: "600",
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      },
      modalContent: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 400,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
      },
      modalMessage: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 24,
      },
      tripSummary: {
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
      },
      summaryText: {
        fontSize: 14,
        color: "#1e293b",
        marginBottom: 4,
      },
      modalActions: {
        flexDirection: "row",
        gap: 12,
      },
      cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
      },
      cancelButtonText: {
        fontSize: 16,
        color: "#64748b",
        fontWeight: "600",
      },
      confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: "#10b981",
        alignItems: "center",
      },
      confirmButtonText: {
        fontSize: 16,
        color: "#ffffff",
        fontWeight: "600",
      },
    });
  });

  const renderTripCard = ({ item }) => {
    const urgency = calculateUrgency(item.scheduledTime);

    return (
      <View style={styles.tripCard}>
        <View style={styles.cardHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripId}>{item.id}</Text>
            <Text style={styles.routeText}>{item.route}</Text>
          </View>
          {/* <View style={styles.badges}>
            <View
              style={[styles.urgencyBadge, { backgroundColor: urgency.color }]}
            >
              <Text style={styles.urgencyText}>{urgency.text}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { borderColor: getPriorityColor(item.priority) },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(item.priority) },
                ]}
              >
                {item.priority}
              </Text>
            </View>
          </View> */}
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled:</Text>
            <Text style={styles.detailValue}>
              {formatTime(item.scheduledTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle:</Text>
            <Text style={styles.detailValue}>{item.vehicleNumber}</Text>
          </View>
          {/* <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cargo:</Text>
            <Text style={styles.detailValue}>
              {item.cargoType} • {item.quantity.toLocaleString()}L
            </Text>
          </View> */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Driver Status:</Text>
            <Text style={[styles.detailValue, { color: "#ef4444" }]}>
              Not Accepted
            </Text>
          </View>
        </View>

        {/* {item.notes && <Text style={styles.notes}>Note: {item.notes}</Text>} */}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              !canAcceptTrips && styles.disabledButton,
            ]}
            onPress={() => handleAcceptTrip(item)}
            disabled={!canAcceptTrips || acceptTripMutation.isPending}
          >
            <Text
              style={[
                styles.acceptButtonText,
                !canAcceptTrips && styles.disabledButtonText,
              ]}
            >
              {acceptTripMutation.isPending ? "Processing..." : "Accept Trip"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load trips</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const trips = (tripsData?.trips || []).filter(
    (trip) => !acceptedTripIds.has(trip.id)
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {!isPermissionsLoading && !canAcceptTrips && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionTitle}>Limited Access</Text>
          <Text style={styles.permissionText}>
            Trip acceptance requires Super Admin permission. Contact your
            administrator for access.
          </Text>
        </View>
      )}

      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeRef.current?.colors?.info || "#3b82f6"}
              />
              <Text style={styles.loadingText}>Loading pending trips...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending trips</Text>
              <Text style={styles.emptySubtext}>
                Trips requiring acceptance will appear here
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Accept Trip</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to accept this trip on behalf of the driver?
            </Text>

            {selectedTrip && (
              <View style={styles.tripSummary}>
                <Text style={styles.summaryText}>Trip: {selectedTrip.id}</Text>
                <Text style={styles.summaryText}>
                  Route: {selectedTrip.route}
                </Text>
                <Text style={styles.summaryText}>
                  Vehicle: {selectedTrip.vehicleNumber}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmAcceptTrip}
                disabled={acceptTripMutation.isPending}
              >
                <Text style={styles.confirmButtonText}>
                  {acceptTripMutation.isPending ? "Processing..." : "Accept"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
