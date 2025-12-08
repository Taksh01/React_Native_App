import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetIncomingStockRequests,
  apiUpdateStockRequestStatus,
} from "../../lib/eicApi";
import { useAuth } from "../../store/auth";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import NotificationService from "../../services/NotificationService";
import {
  getStockStatusColor,
  getStockStatusLabel,
  normalizeStockStatus,
  STOCK_STATUS,
} from "../../config/stockStatus";

const FILTER_OPTIONS = {
  type: [
    { label: "All Types", value: "ALL" },
    { label: "FDODO", value: "FDODO" },
    { label: "DBS", value: "DBS" },
    { label: "AI Generated", value: "AI" },
  ],
  status: [
    { label: "All Status", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Queued", value: "QUEUED" },
    { label: "Assigning Driver", value: "ASSIGNING" },
    { label: "Driver Assigned", value: "ASSIGNED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
  ],
  priority: [
    { label: "All Priority", value: "ALL" },
    { label: "High", value: "HIGH" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Low", value: "LOW" },
  ],
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "HIGH":
    case "High":
      return "#ef4444";
    case "MEDIUM":
    case "Medium":
    case "Normal":
      return "#f59e0b";
    case "LOW":
    case "Low":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

export default function IncomingStockRequests() {
  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
    priority: "ALL",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [actionType, setActionType] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Track drivers who rejected trips: { [requestId]: { [driverId]: true } }
  const [rejectedDrivers, setRejectedDrivers] = useState({});

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: requestsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["incomingStockRequests"],
    queryFn: apiGetIncomingStockRequests,
    refetchInterval: 30000,
  });

  // Listen for driver response notifications
  useEffect(() => {
    const handleDriverResponse = (data) => {

      
      if (data.action === "REJECTED" || data.driverAction === "REJECTED") {
        const requestId = data.requestId;
        const driverId = data.driverId;
        
        // Mark this driver as rejected for this request
        setRejectedDrivers((prev) => ({
          ...prev,
          [requestId]: {
            ...(prev[requestId] || {}),
            [driverId]: true,
          },
        }));
        
        // Find the request and show driver selection modal again
        const requests = requestsData?.results || requestsData?.data || requestsData || [];
        const request = requests.find((r) => r.id === requestId || r.id === String(requestId));
        
        if (request) {
          Alert.alert(
            "Driver Rejected Trip",
            `The driver has rejected this trip assignment. Please select another driver.`,
            [
              {
                text: "Select Driver",
                onPress: () => {
                  setSelectedRequest(request);
                  setSelectedDriver(null);
                  setShowDriverModal(true);
                },
              },
            ],
            { cancelable: false }
          );
        }
        // Refresh to get updated status (e.g. back to PENDING/QUEUED)

        
        // Immediate invalidation
        queryClient.invalidateQueries(["incomingStockRequests"]);
        refetch();

        // Delayed invalidation to handle backend race conditions (1s and 3s)
        setTimeout(() => {

          queryClient.invalidateQueries(["incomingStockRequests"]);
          refetch();
        }, 1000);
        
        setTimeout(() => {

           queryClient.invalidateQueries(["incomingStockRequests"]);
           refetch();
        }, 3000);

      } else if (data.action === "ACCEPTED" || data.driverAction === "ACCEPTED") {
        Alert.alert(
          "Driver Accepted",
          "The driver has accepted the trip assignment!",
          [{ text: "OK" }]
        );
        // Refresh to get updated status
        refetch();
      }
    };

    const unsubscribe = NotificationService.addListener(
      "driver_response",
      handleDriverResponse
    );

    return () => unsubscribe();
  }, [requestsData, refetch]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ requestId, status, notes, driverId }) =>
      apiUpdateStockRequestStatus(requestId, status, notes, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries(["incomingStockRequests"]);
      setShowActionModal(false);
      setShowDriverModal(false);
      setActionNotes("");
      setActionType(null);
      setSelectedDriver(null);
    },
  });

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      header: {
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      },
      screenTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      screenSubtitle: {
        marginTop: theme.spacing(1),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      filterRow: {
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(3),
      },
      filterSection: { marginBottom: theme.spacing(3) },
      filterLabel: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
        textTransform: "uppercase",
      },
      filterPillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing(2),
      },
      filterPill: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.pill,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.surfaceElevated,
      },
      filterPillSelected: {
        backgroundColor: "#1d4ed81a",
        borderColor: theme.colors.primary,
      },
      filterPillText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      filterPillTextSelected: {
        color: "#1d4ed8",
        fontWeight: theme.typography.weightSemiBold,
      },
      listContent: {
        paddingHorizontal: theme.spacing(4),
        paddingBottom: theme.spacing(6),
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      cardTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      cardSubtitle: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      typeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
      },
      badgeRow: {
        flexDirection: "row",
        gap: theme.spacing(2),
        marginBottom: theme.spacing(3),
      },
      badge: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.pill,
      },
      badgeText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.surfaceElevated,
      },
      infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: theme.spacing(2),
      },
      infoLabel: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      infoValue: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      notesText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        fontStyle: "italic",
        marginTop: theme.spacing(2),
      },
      cardActions: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginTop: theme.spacing(4),
      },
      actionButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        alignItems: "center",
      },
      rejectButton: {
        backgroundColor: "#fee2e2",
        borderWidth: 1,
        borderColor: "#fecaca",
      },
      approveButton: { backgroundColor: "#1d4ed8" },
      rejectButtonText: {
        color: "#b91c1c",
        fontWeight: theme.typography.weightSemiBold,
      },
      approveButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
      emptyState: {
        alignItems: "center",
        marginTop: 100,
        paddingHorizontal: theme.spacing(6),
        gap: theme.spacing(2),
      },
      emptyTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      emptySubtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeights.body,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        padding: theme.spacing(5),
      },
      modalContent: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        maxHeight: "90%",
      },
      modalInner: {
        paddingHorizontal: theme.spacing(5),
        paddingTop: theme.spacing(5),
        paddingBottom: theme.spacing(4),
      },
      modalTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      modalSubtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(4),
      },
      detailRow: { marginBottom: theme.spacing(3) },
      detailLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
      },
      detailValue: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.weightSemiBold,
      },
      inputLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(3),
        backgroundColor: theme.colors.surfaceMuted,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.body,
        minHeight: 100,
        textAlignVertical: "top",
      },
      modalActions: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginTop: theme.spacing(5),
      },
      cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        alignItems: "center",
      },
      cancelButtonText: {
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
      },
      confirmButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        alignItems: "center",
      },
      confirmButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
      // Driver selection modal styles
      driverCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        marginBottom: theme.spacing(3),
        borderWidth: 1.5,
        borderColor: "transparent",
      },
      driverCardSelected: {
        borderColor: "#1d4ed8",
        backgroundColor: "#1d4ed810",
      },
      driverName: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      driverInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: theme.spacing(1),
        gap: theme.spacing(2),
      },
      driverInfoText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      driverRejectedBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: theme.spacing(2),
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        backgroundColor: "#fef2f2",
        borderRadius: theme.radii.sm,
        alignSelf: "flex-start",
        gap: theme.spacing(1),
      },
      driverRejectedText: {
        fontSize: theme.typography.sizes.caption,
        color: "#dc2626",
      },
      noDriversText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        paddingVertical: theme.spacing(6),
      },
      driverListHeader: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(3),
        textTransform: "uppercase",
        fontWeight: theme.typography.weightSemiBold,
      },
    })
  );

  const filteredRequests = useMemo(() => {

    const requests =
      requestsData?.results || requestsData?.data || requestsData || [];


    if (!Array.isArray(requests)) {

    }

    return requests.filter((req) => {
      if (filters.type !== "ALL" && req.type !== filters.type) return false;
      if (filters.status !== "ALL" && req.status !== filters.status)
        return false;
      if (filters.priority !== "ALL" && req.priority !== filters.priority)
        return false;
      return true;
    });
  }, [filters, requestsData]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setSelectedDriver(null);
    // Check if drivers are available
    if (request.availableDrivers && request.availableDrivers.length > 0) {
      setShowDriverModal(true);
    } else {
      // No drivers available, show regular action modal
      Alert.alert(
        "No Drivers Available",
        "There are no drivers available for this request. Would you like to approve without assigning a driver?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve Anyway",
            onPress: () => {
              setActionType("APPROVED");
              setShowActionModal(true);
            },
          },
        ]
      );
    }
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setActionType("REJECTED");
    setShowActionModal(true);
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriverAndApprove = () => {
    if (!selectedDriver) {
      Alert.alert("Select Driver", "Please select a driver to assign.");
      return;
    }
    
    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: "APPROVED",
      notes: actionNotes,
      driverId: selectedDriver.driverId,
    });
  };

  const handleConfirmAction = () => {
    if (selectedRequest && actionType) {
      updateStatusMutation.mutate({
        requestId: selectedRequest.id,
        status: actionType,
        notes: actionNotes,
      });
    }
  };

  const renderFilterPill = (option, key) => {
    const selected = filters[key] === option.value;
    return (
      <TouchableOpacity
        key={`${key}-${option.value}`}
        style={[styles.filterPill, selected && styles.filterPillSelected]}
        onPress={() => setFilters((prev) => ({ ...prev, [key]: option.value }))}
      >
        <Text
          style={[
            styles.filterPillText,
            selected && styles.filterPillTextSelected,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDriverCard = (driver) => {
    const isSelected = selectedDriver?.driverId === driver.driverId;
    const hasRejected = rejectedDrivers[selectedRequest?.id]?.[driver.driverId];

    return (
      <TouchableOpacity
        key={driver.driverId}
        style={[styles.driverCard, isSelected && styles.driverCardSelected]}
        onPress={() => handleDriverSelect(driver)}
        activeOpacity={0.7}
      >
        <Text style={styles.driverName}>{driver.driverName}</Text>
        <View style={styles.driverInfoRow}>
          <AppIcon icon="profile" size={14} color="#6b7280" />
          <Text style={styles.driverInfoText}>{driver.driverPhone}</Text>
        </View>
        <View style={styles.driverInfoRow}>
          <AppIcon icon="vehicle" size={14} color="#6b7280" />
          <Text style={styles.driverInfoText}>{driver.vehicleRegNo}</Text>
        </View>
        <View style={styles.driverInfoRow}>
          <AppIcon icon="analytics" size={14} color="#6b7280" />
          <Text style={styles.driverInfoText}>
            {driver.tripCountToday} trips today
          </Text>
        </View>
        {hasRejected && (
          <View style={styles.driverRejectedBadge}>
            <AppIcon icon="close" size={12} color="#dc2626" />
            <Text style={styles.driverRejectedText}>
              Previously declined this trip
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRequestCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedRequest(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Request #{item.id}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getStockStatusColor(item.status) },
          ]}
        >
          <Text style={styles.badgeText}>{getStockStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>DBS Station</Text>
        <Text style={styles.infoValue}>{item.dbsId}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Quantity</Text>
        <Text style={styles.infoValue}>
          {parseFloat(item.quantity).toLocaleString()}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Priority</Text>
        <Text
          style={[styles.infoValue, { color: getPriorityColor(item.priority) }]}
        >
          {item.priority}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Drivers Available</Text>
        <Text style={styles.infoValue}>
          {item.availableDrivers?.length || 0}
        </Text>
      </View>

      {item.status === "PENDING" && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRequestCard}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={styles.emptySubtitle}>Loading requests...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No requests found</Text>
              <Text style={styles.emptySubtitle}>
                No stock requests match the selected filters.
              </Text>
            </View>
          )
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalInner}
          >
            <Text style={styles.modalTitle}>Request Details</Text>
            <Text style={styles.modalSubtitle}>#{selectedRequest?.id}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>
                {selectedRequest?.customer}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DBS Station</Text>
              <Text style={styles.detailValue}>{selectedRequest?.dbsId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{selectedRequest?.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{getStockStatusLabel(selectedRequest?.status)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Priority</Text>
              <Text style={styles.detailValue}>
                {selectedRequest?.priority}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>
                {parseFloat(selectedRequest?.quantity || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requested At</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedRequest?.requestedAt).toLocaleString()}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDriverModal(false);
          setSelectedDriver(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalInner}>
              <Text style={styles.modalTitle}>Select Driver</Text>
              <Text style={styles.modalSubtitle}>
                Choose a driver to assign for request #{selectedRequest?.id}
              </Text>

              <Text style={styles.driverListHeader}>Available Drivers</Text>

              {selectedRequest?.availableDrivers?.length > 0 ? (
                selectedRequest.availableDrivers.map(renderDriverCard)
              ) : (
                <Text style={styles.noDriversText}>
                  No drivers available at the moment
                </Text>
              )}

              <View>
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  placeholder="Add any notes..."
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDriverModal(false);
                    setSelectedDriver(null);
                    setActionNotes("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: selectedDriver ? "#1d4ed8" : "#9ca3af",
                    },
                  ]}
                  onPress={handleConfirmDriverAndApprove}
                  disabled={!selectedDriver || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Assign & Approve
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Modal (for Reject) */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalInner}>
              <Text style={styles.modalTitle}>
                {actionType === "APPROVED" ? "Approve Request" : "Reject Request"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Add notes for request #{selectedRequest?.id}
              </Text>

              <View>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  placeholder="Enter reason or notes..."
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowActionModal(false);
                    setActionNotes("");
                    setActionType(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor:
                        actionType === "APPROVED" ? "#1d4ed8" : "#dc2626",
                    },
                  ]}
                  onPress={handleConfirmAction}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {actionType === "APPROVED" ? "Approve" : "Reject"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
