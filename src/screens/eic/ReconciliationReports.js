import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import { useThemedStyles } from "../../theme";

const STATUS_FILTERS = [
  { label: "All Status", value: "ALL" },
  { label: "Review Pending", value: "REVIEW_PENDING" },
  { label: "Action Pending", value: "ACTION_PENDING" },
  { label: "Action Triggered", value: "ACTION_TRIGGERED" },
  { label: "Resolved", value: "RESOLVED" },
];

const SEVERITY_FILTERS = [
  { label: "All Severity", value: "ALL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

const severityColors = {
  HIGH: "#dc2626",
  MEDIUM: "#f97316",
  LOW: "#16a34a",
};

const defaultFilters = () => ({
  status: "ALL",
  severity: "ALL",
});

function normalizeReports(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.reports)) return payload.reports;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export default function ReconciliationReports() {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [actionType, setActionType] = useState("FOLLOW_UP");
  const [nextStatus, setNextStatus] = useState("");

  const queryClient = useQueryClient();
  const { user, updateUserPermissions } = useAuth();
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      permissionBanner: { marginHorizontal: theme.spacing(4), marginTop: theme.spacing(3), marginBottom: theme.spacing(3), backgroundColor: "#fef3c7", borderColor: "#f59e0b", borderWidth: 1, borderRadius: theme.radii.lg, paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(3) },
      permissionTitle: { fontSize: theme.typography.sizes.bodyLarge, fontWeight: theme.typography.weightSemiBold, color: "#b45309", marginBottom: theme.spacing(1) },
      permissionText: { fontSize: theme.typography.sizes.body, color: "#92400e", lineHeight: theme.typography.lineHeights.body },
      filterRow: { paddingHorizontal: theme.spacing(4), paddingTop: theme.spacing(3), paddingBottom: theme.spacing(3) },
      filterSection: { marginBottom: theme.spacing(3) },
      filterSectionTitle: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightSemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing(2) },
      filterPillRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
      filterPill: { paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(2), borderRadius: theme.radii.pill, borderWidth: 1, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceElevated },
      filterPillSelected: { backgroundColor: "#1d4ed81a", borderColor: theme.colors.primary },
      filterPillText: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary },
      filterPillTextSelected: { color: "#1d4ed8", fontWeight: theme.typography.weightSemiBold },
      listContent: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(6) },
      card: { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.lg, padding: theme.spacing(4), marginBottom: theme.spacing(4), borderWidth: 1, borderColor: theme.colors.borderSubtle, ...theme.shadows.level1 },
      cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing(3) },
      cardTitle: { fontSize: theme.typography.sizes.title, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary },
      cardSubtitle: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(1) },
      severityBadge: { borderWidth: 1, borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(1) },
      severityText: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightBold, textTransform: "uppercase" },
      discrepancyText: { fontSize: theme.typography.sizes.caption, color: theme.colors.textPrimary, marginBottom: theme.spacing(3) },
      statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing(4), marginBottom: theme.spacing(4) },
      statusLabel: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary },
      statusValue: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightSemiBold, color: "#1d4ed8", textTransform: "capitalize" },
      chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2), marginBottom: theme.spacing(3) },
      signalChip: { backgroundColor: "#eef2ff", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(2) },
      signalChipText: { color: "#3730a3", fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightSemiBold },
      recommendationHeading: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightSemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing(2) },
      recommendationText: { fontSize: theme.typography.sizes.caption, color: theme.colors.textPrimary, marginBottom: theme.spacing(4), lineHeight: theme.typography.lineHeights.body },
      ctaButton: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md, paddingVertical: theme.spacing(3), alignItems: "center" },
      ctaButtonModal: { marginTop: theme.spacing(4) },
      ctaButtonText: { color: theme.colors.surfaceElevated, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weightSemiBold },
      loader: { marginTop: 80, alignItems: "center" },
      loaderText: { marginTop: theme.spacing(3), fontSize: theme.typography.sizes.body, color: theme.colors.textSecondary },
      errorContainer: { marginTop: 80, alignItems: "center", paddingHorizontal: theme.spacing(6) },
      errorTitle: { fontSize: theme.typography.sizes.title, fontWeight: theme.typography.weightBold, color: theme.colors.danger, marginBottom: theme.spacing(2) },
      errorMessage: { fontSize: theme.typography.sizes.body, color: theme.colors.danger, textAlign: "center", marginBottom: theme.spacing(4) },
      retryButton: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md, paddingHorizontal: theme.spacing(5), paddingVertical: theme.spacing(3) },
      retryButtonText: { color: theme.colors.surfaceElevated, fontWeight: theme.typography.weightSemiBold },
      emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: theme.spacing(6) },
      emptyTitle: { fontSize: theme.typography.sizes.title, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: theme.spacing(2) },
      emptySubtitle: { fontSize: theme.typography.sizes.body, color: theme.colors.textSecondary, textAlign: "center", lineHeight: theme.typography.lineHeights.body },
      modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "center", padding: theme.spacing(5) },
      modalContent: { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.lg, padding: theme.spacing(5), maxHeight: "90%" },
      modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
      modalTitle: { fontSize: theme.typography.sizes.title, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary },
      closeText: { color: theme.colors.primary, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weightSemiBold },
      modalSubtitle: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(1), marginBottom: theme.spacing(4) },
      modalMetrics: { flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing(4) },
      metricBlock: { flex: 1, paddingRight: theme.spacing(3) },
      metricLabel: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing(1) },
      metricValue: { fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary },
      sectionHeading: { fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: theme.spacing(2), marginTop: theme.spacing(3) },
      signalText: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing(1) },
      actionItem: { borderWidth: 1, borderColor: theme.colors.borderSubtle, borderRadius: theme.radii.md, padding: theme.spacing(3), marginBottom: theme.spacing(2) },
      actionTitle: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightBold, color: "#1d4ed8", marginBottom: theme.spacing(1) },
      actionMeta: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing(2) },
      actionNotes: { fontSize: theme.typography.sizes.caption, color: theme.colors.textPrimary, lineHeight: theme.typography.lineHeights.body },
      emptyActions: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary },
      permissionInlineNotice: { marginTop: theme.spacing(4), fontSize: theme.typography.sizes.caption, color: "#b45309", lineHeight: theme.typography.lineHeights.caption },
      actionModalContent: { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.lg, padding: theme.spacing(5) },
      modalDescription: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(2), marginBottom: theme.spacing(4), lineHeight: theme.typography.lineHeights.body },
      fieldGroup: { marginBottom: theme.spacing(4) },
      fieldLabel: { fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weightSemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing(2) },
      input: { borderWidth: 1, borderColor: theme.colors.borderSubtle, borderRadius: theme.radii.md, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(3), backgroundColor: theme.colors.surfaceMuted, color: theme.colors.textPrimary, fontSize: theme.typography.sizes.body },
      notesInput: { minHeight: 100, textAlignVertical: "top" },
      modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing(4) },
      cancelButton: { flex: 1, paddingVertical: theme.spacing(3), marginRight: theme.spacing(2), borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.borderSubtle, alignItems: "center" },
      cancelButtonText: { fontSize: theme.typography.sizes.body, color: theme.colors.textSecondary, fontWeight: theme.typography.weightSemiBold },
      confirmButton: { flex: 1, paddingVertical: theme.spacing(3), marginLeft: theme.spacing(2), borderRadius: theme.radii.md, alignItems: "center", backgroundColor: theme.colors.primary },
      confirmButtonText: { fontSize: theme.typography.sizes.body, color: theme.colors.surfaceElevated, fontWeight: theme.typography.weightSemiBold },
    });
  });

  const {
    data: permissionData,
    isFetching: isPermissionsFetching,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ["eicPermissions", user?.id],
    queryFn: () => GTS.getEICPermissions(user?.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (permissionData) {
      updateUserPermissions(permissionData);
    }
  }, [permissionData, updateUserPermissions]);

  const effectivePermissions = permissionData || user?.permissions || {};
  const canTriggerCorrectiveActions = true; // Temporarily enabled for testing

  const {
    data: reportsPayload,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["reconciliationReports", filters],
    queryFn: () => GTS.getReconciliationReports(filters),
    staleTime: 30 * 1000,
  });

  const reports = useMemo(
    () =>
      normalizeReports(reportsPayload).map((report) => ({
        ...report,
        severity: report.severity?.toUpperCase?.() || report.severity || "LOW",
        status:
          report.status?.toUpperCase?.() || report.status || "REVIEW_PENDING",
      })),
    [reportsPayload]
  );

  const triggerActionMutation = useMutation({
    mutationFn: ({ reportId, payload }) =>
      GTS.triggerReconciliationAction(reportId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["reconciliationReports"]);
      setShowActionModal(false);
      setActionNotes("");
      setActionType("FOLLOW_UP");
      setNextStatus("");
      Alert.alert(
        "Corrective action triggered",
        "Downstream teams have been notified and the report has been updated."
      );
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.error ||
        mutationError?.message ||
        "Unable to trigger corrective action. Please try again.";
      Alert.alert("Action failed", message);
    },
  });

  const isRefreshing = isFetching || isPermissionsFetching;

  const handleRefresh = useCallback(() => {
    const tasks = [refetch()];
    if (user?.id) {
      tasks.push(refetchPermissions());
    }
    Promise.all(tasks).catch(() => undefined);
  }, [refetch, refetchPermissions, user?.id]);

  const handleOpenDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTriggerAction = () => {
    if (!selectedReport) return;
    if (!canTriggerCorrectiveActions) {
      Alert.alert(
        "Permission required",
        "You are not allowed to trigger corrective actions. Please contact the Super Admin."
      );
      return;
    }
    if (!actionNotes.trim()) {
      Alert.alert("Missing notes", "Please describe the corrective action.");
      return;
    }

    triggerActionMutation.mutate({
      reportId: selectedReport.id,
      payload: {
        userId: user?.id,
        notes: actionNotes.trim(),
        actionType,
        nextStatus: nextStatus.trim().toUpperCase() || undefined,
      },
    });
  };

  const renderFilterPill = (option, key) => {
    const selected = filters[key] === option.value;
    return (
      <TouchableOpacity
        key={`${key}-${option.value}`}
        style={[styles.filterPill, selected && styles.filterPillSelected]}
        onPress={() =>
          setFilters((prev) => ({
            ...prev,
            [key]: option.value,
          }))
        }
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

  const renderReportCard = ({ item }) => {
    const severityColor = severityColors[item.severity] || "#475569";
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenDetails(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              {item.msName || item.msStation}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.reportingPeriod} â€¢ {item.dbsStation}
            </Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              {
                borderColor: severityColor,
                backgroundColor: `${severityColor}1A`,
              },
            ]}
          >
            <Text style={[styles.severityText, { color: severityColor }]}>
              {item.severity}
            </Text>
          </View>
        </View>

        <Text style={styles.discrepancyText}>
          Variance{" "}
          {item.variancePercentage?.toFixed?.(1) ?? item.variancePercentage}% â€¢{" "}
          {item.volumeDiscrepancy?.toLocaleString?.() ?? item.volumeDiscrepancy}{" "}
          scm â€¢ {item.currency}{" "}
          {(item.financialImpact ?? 0).toLocaleString?.() ??
            item.financialImpact}
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>
            {item.status.replace("_", " ")}
          </Text>
        </View>

        <View style={styles.chipContainer}>
          {(item.rootCauseSignals || []).slice(0, 3).map((signal) => (
            <View key={signal} style={styles.signalChip}>
              <Text style={styles.signalChipText}>{signal}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.recommendationHeading}>Recommended Action</Text>
        <Text style={styles.recommendationText}>{item.recommendedAction}</Text>

        {canTriggerCorrectiveActions ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              setSelectedReport(item);
              setActionNotes("");
              setActionType("FOLLOW_UP");
              setNextStatus("");
              setShowActionModal(true);
            }}
          >
            <Text style={styles.ctaButtonText}>Trigger Corrective Action</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading && reports.length === 0) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={themeRef.current?.colors?.loaderSecondary || "#2563eb"} />
          <Text style={styles.loaderText}>Loading reconciliation reportsâ€¦</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Unable to load reconciliation reports
          </Text>
          <Text style={styles.errorMessage}>
            {error?.message || "Please check the connection and try again."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderReportCard}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reconciliation variances</Text>
            <Text style={styles.emptySubtitle}>
              All submitted reconciliation reports look healthy for the selected
              filters.
            </Text>
          </View>
        }
      />
    );
  };

  const renderDetailModal = () => {
    if (!selectedReport) return null;
    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedReport.msName || selectedReport.msStation}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedReport.reportingPeriod} â€¢ {selectedReport.dbsStation}
            </Text>

            <View style={styles.modalMetrics}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Variance</Text>
                <Text style={styles.metricValue}>
                  {selectedReport.variancePercentage?.toFixed?.(1) ??
                    selectedReport.variancePercentage}
                  %
                </Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Volume</Text>
                <Text style={styles.metricValue}>
                  {selectedReport.volumeDiscrepancy?.toLocaleString?.() ??
                    selectedReport.volumeDiscrepancy}{" "}
                  scm
                </Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Financial Impact</Text>
                <Text style={styles.metricValue}>
                  {selectedReport.currency}{" "}
                  {(selectedReport.financialImpact ?? 0).toLocaleString?.() ??
                    selectedReport.financialImpact}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>Signals</Text>
            {(selectedReport.rootCauseSignals || []).map((signal) => (
              <Text key={signal} style={styles.signalText}>
                â€¢ {signal}
              </Text>
            ))}

            <Text style={styles.sectionHeading}>Corrective Actions</Text>
            {selectedReport.correctiveActions?.length ? (
              selectedReport.correctiveActions.map((action) => (
                <View key={action.actionId} style={styles.actionItem}>
                  <Text style={styles.actionTitle}>
                    {action.actionType} â€¢ {action.status}
                  </Text>
                  <Text style={styles.actionMeta}>
                    Triggered by {action.triggeredBy} on {action.triggeredAt}
                  </Text>
                  <Text style={styles.actionNotes}>{action.notes}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyActions}>
                No corrective actions have been logged for this variance yet.
              </Text>
            )}

            {canTriggerCorrectiveActions ? (
              <TouchableOpacity
                style={[styles.ctaButton, styles.ctaButtonModal]}
                onPress={() => {
                  setShowDetailModal(false);
                  setShowActionModal(true);
                }}
              >
                <Text style={styles.ctaButtonText}>
                  Trigger Corrective Action
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.permissionInlineNotice}>
                You do not have access to trigger corrective actions. Contact
                the Super Admin to enable this capability.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.actionModalContent}>
          <Text style={styles.modalTitle}>Trigger corrective action</Text>
          <Text style={styles.modalDescription}>
            Describe the action you are initiating so DBS and MS teams can
            execute it.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Action type</Text>
            <TextInput
              style={styles.input}
              value={actionType}
              onChangeText={setActionType}
              placeholder="FOLLOW_UP / CALIBRATION / AUDIT"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Next status (optional)</Text>
            <TextInput
              style={styles.input}
              value={nextStatus}
              onChangeText={setNextStatus}
              placeholder="RESOLVED / ACTION_TRIGGERED"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={actionNotes}
              onChangeText={setActionNotes}
              multiline
              numberOfLines={4}
              placeholder="Describe the corrective action"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActionModal(false)}
              disabled={triggerActionMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleTriggerAction}
              disabled={triggerActionMutation.isPending}
            >
              {triggerActionMutation.isPending ? (
                <ActivityIndicator color={themeRef.current?.colors?.surfaceElevated || "#ffffff"} />
              ) : (
                <Text style={styles.confirmButtonText}>Trigger</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {!canTriggerCorrectiveActions && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionTitle}>Corrective actions locked</Text>
          <Text style={styles.permissionText}>
            You can review reconciliation reports but only Super Admins can
            enable you to trigger corrective actions. Ask them to grant this
            permission.
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.filterPillRow}>
            {STATUS_FILTERS.map((option) => renderFilterPill(option, "status"))}
          </View>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Severity</Text>
          <View style={styles.filterPillRow}>
            {SEVERITY_FILTERS.map((option) => renderFilterPill(option, "severity"))}
          </View>
        </View>
      </View>

      {renderContent()}
      {renderDetailModal()}
      {renderActionModal()}
    </SafeAreaView>
  );
}
