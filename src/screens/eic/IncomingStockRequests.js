import React, { useState, useMemo, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";

const MOCK_REQUESTS = [
  {
    id: "REQ-001",
    type: "FDODO",
    status: "PENDING",
    priority: "HIGH",
    customer: "Reliance Industries",
    dbsId: "DBS-15",
    quantity: 15000,
    product: "LPG",
    requestedAt: "2025-01-15T10:30:00Z",
    notes: "Urgent delivery required",
  },
  {
    id: "REQ-002",
    type: "DBS",
    status: "PENDING",
    priority: "MEDIUM",
    customer: "DBS Station 12",
    dbsId: "DBS-12",
    quantity: 8000,
    product: "LPG",
    requestedAt: "2025-01-15T09:15:00Z",
    notes: "Regular stock replenishment",
  },
  {
    id: "REQ-003",
    type: "AI",
    status: "APPROVED",
    priority: "LOW",
    customer: "AI Forecast",
    dbsId: "DBS-08",
    quantity: 5000,
    product: "LPG",
    requestedAt: "2025-01-14T16:45:00Z",
    notes: "AI-predicted demand spike",
  },
  {
    id: "REQ-004",
    type: "FDODO",
    status: "REJECTED",
    priority: "HIGH",
    customer: "Tata Steel",
    dbsId: "DBS-20",
    quantity: 20000,
    product: "LPG",
    requestedAt: "2025-01-14T14:20:00Z",
    notes: "Credit limit exceeded",
  },
  {
    id: "REQ-005",
    type: "DBS",
    status: "APPROVED",
    priority: "MEDIUM",
    customer: "DBS Station 05",
    dbsId: "DBS-05",
    quantity: 12000,
    product: "LPG",
    requestedAt: "2025-01-14T11:00:00Z",
    notes: "Scheduled maintenance stock",
  },
  {
    id: "REQ-006",
    type: "AI",
    status: "PENDING",
    priority: "HIGH",
    customer: "AI Forecast",
    dbsId: "DBS-18",
    quantity: 18000,
    product: "LPG",
    requestedAt: "2025-01-15T08:00:00Z",
    notes: "Weather-based demand prediction",
  },
];

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
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ],
  priority: [
    { label: "All Priority", value: "ALL" },
    { label: "High", value: "HIGH" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Low", value: "LOW" },
  ],
};

const getTypeIcon = (type) => {
  switch (type) {
    case "FDODO":
      return "summaryCustomers";
    case "DBS":
      return "summaryStations";
    case "AI":
      return "robot";
    default:
      return "info";
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "FDODO":
      return "#3b82f6";
    case "DBS":
      return "#8b5cf6";
    case "AI":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "PENDING":
      return "#f59e0b";
    case "APPROVED":
      return "#10b981";
    case "REJECTED":
      return "#ef4444";
    default:
      return "#6b7280";
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

export default function IncomingStockRequests() {
  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
    priority: "ALL",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

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
        paddingHorizontal: theme.spacing(6),
        paddingTop: theme.spacing(7),
        paddingBottom: theme.spacing(4),
      },
      modalTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
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
    })
  );

  const filteredRequests = useMemo(() => {
    return MOCK_REQUESTS.filter((req) => {
      if (filters.type !== "ALL" && req.type !== filters.type) return false;
      if (filters.status !== "ALL" && req.status !== filters.status)
        return false;
      if (filters.priority !== "ALL" && req.priority !== filters.priority)
        return false;
      return true;
    });
  }, [filters]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowActionModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowActionModal(true);
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
          <Text style={styles.cardTitle}>{item.id}</Text>
          <Text style={styles.cardSubtitle}>{item.customer}</Text>
        </View>
        <View
          style={[
            styles.typeIcon,
            { backgroundColor: `${getTypeColor(item.type)}1A` },
          ]}
        >
          <AppIcon
            icon={getTypeIcon(item.type)}
            size={16}
            color={getTypeColor(item.type)}
          />
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
          <Text style={styles.badgeText}>{item.priority}</Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: getTypeColor(item.type) }]}
        >
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>DBS Station</Text>
        <Text style={styles.infoValue}>{item.dbsId}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Quantity</Text>
        <Text style={styles.infoValue}>{item.quantity.toLocaleString()} L</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Product</Text>
        <Text style={styles.infoValue}>{item.product}</Text>
      </View>

      {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}

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
      {/* <View style={styles.header}>
        <Text style={styles.screenTitle}>Incoming Stock Requests</Text>
        <Text style={styles.screenSubtitle}>
          Review and manage stock requests from FDODO, DBS, and AI
        </Text>
      </View> */}

      <View style={styles.filterRow}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.filterPillRow}>
            {FILTER_OPTIONS.type.map((option) =>
              renderFilterPill(option, "type")
            )}
          </View>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterPillRow}>
            {FILTER_OPTIONS.status.map((option) =>
              renderFilterPill(option, "status")
            )}
          </View>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Priority</Text>
          <View style={styles.filterPillRow}>
            {FILTER_OPTIONS.priority.map((option) =>
              renderFilterPill(option, "priority")
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRequestCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>
              No stock requests match the selected filters.
            </Text>
          </View>
        }
      />

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
            <Text style={styles.modalSubtitle}>{selectedRequest?.id}</Text>

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
              <Text style={styles.detailValue}>{selectedRequest?.status}</Text>
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
                {selectedRequest?.quantity.toLocaleString()} L
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product</Text>
              <Text style={styles.detailValue}>{selectedRequest?.product}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requested At</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedRequest?.requestedAt).toLocaleString()}
              </Text>
            </View>
            {selectedRequest?.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selectedRequest.notes}</Text>
              </View>
            )}

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
              <Text style={styles.modalTitle}>Action Notes</Text>
              <Text style={styles.modalSubtitle}>
                Add notes for this action on {selectedRequest?.id}
              </Text>

              <View>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  placeholder="Enter action notes..."
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowActionModal(false);
                    setActionNotes("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: "#1d4ed8" }]}
                  onPress={() => {
                    setShowActionModal(false);
                    setActionNotes("");
                  }}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
