import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
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
import AppSwitch from "../../components/AppSwitch";

const createInitialApprovalForm = (driver) => ({
  shiftStart: driver?.requestedShiftStart || "",
  shiftEnd: driver?.requestedShiftEnd || "",
  licenseVerified: true,
  trainingVerified: driver?.trainingCompleted ?? false,
  shiftAssigned: true,
  trainingCompleted: driver?.trainingCompleted ?? false,
  trainingModules: (driver?.trainingModules || []).join(", "),
  notes: "",
});

export default function DriverApprovals() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState(createInitialApprovalForm());
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const queryClient = useQueryClient();
  const { user, updateUserPermissions } = useAuth();
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      header: {
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      },
      screenTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      screenSubtitle: {
        marginTop: theme.spacing(1),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      permissionBanner: {
        marginHorizontal: theme.spacing(4),
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(3),
        backgroundColor: "#dbeafe",
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: "#93c5fd",
      },
      permissionTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: "#1d4ed8",
        marginBottom: theme.spacing(1),
      },
      permissionBody: {
        fontSize: theme.typography.sizes.body,
        color: "#1e3a8a",
        lineHeight: theme.typography.lineHeights.body,
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
      driverName: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      driverId: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: theme.spacing(2),
      },
      rowLabel: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      rowValue: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.weightSemiBold,
      },
      trainingContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        marginBottom: theme.spacing(3),
      },
      trainingChip: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        backgroundColor: "#eef2ff",
        borderRadius: theme.radii.pill,
      },
      trainingChipText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: "#3730a3",
      },
      remarksLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
      },
      remarksText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.body,
      },
      documentsContainer: {
        marginTop: theme.spacing(5),
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
        paddingTop: theme.spacing(3),
        gap: theme.spacing(2),
      },
      documentRow: { gap: theme.spacing(1) },
      documentType: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
      },
      documentUrl: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.primary,
      },
      cardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: theme.spacing(4),
      },
      cardButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        alignItems: "center",
      },
      rejectButton: {
        backgroundColor: "#fee2e2",
        marginRight: theme.spacing(2),
        borderWidth: 1,
        borderColor: "#fecaca",
      },
      approveButton: {
        backgroundColor: "#1d4ed8",
        marginLeft: theme.spacing(2),
      },
      rejectButtonText: {
        color: "#b91c1c",
        fontWeight: theme.typography.weightSemiBold,
      },
      approveButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
      loaderContainer: {
        marginTop: 80,
        alignItems: "center",
        paddingHorizontal: theme.spacing(6),
        gap: theme.spacing(3),
      },
      loaderText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      errorText: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.danger,
        textAlign: "center",
      },
      retryButton: {
        paddingHorizontal: theme.spacing(5),
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        backgroundColor: "#1d4ed8",
      },
      retryButtonText: {
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
        maxHeight: "92%",
        width: "100%",
        overflow: "hidden",
      },
      modalInner: {
        paddingHorizontal: theme.spacing(6),
        paddingTop: theme.spacing(7),
        paddingBottom: theme.spacing(4),
      },
      modalCompact: {
        paddingHorizontal: theme.spacing(6),
        paddingVertical: theme.spacing(6),
      },
      modalTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      modalSubtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(4),
      },
      modalSubtitleTight: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(6),
        lineHeight: 21,
      },
      formGroup: { marginBottom: theme.spacing(4) },
      formGroupRow: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginBottom: theme.spacing(4),
      },
      formColumn: { flex: 1 },
      inputLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      input: {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(3),
        backgroundColor: theme.colors.surfaceMuted,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.body,
      },
      notesInput: { minHeight: 100, textAlignVertical: "top" },
      toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      toggleLabel: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.weightSemiBold,
      },
      modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: theme.spacing(5),
      },
      cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        marginRight: theme.spacing(2),
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
        marginLeft: theme.spacing(2),
        borderRadius: theme.radii.md,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
      },
      rejectConfirmButton: { backgroundColor: "#b91c1c" },
      confirmButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
    });
  });

  const {
    data: permissionData,
    refetch: refetchPermissions,
    isFetching: isPermissionsFetching,
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
  const canManageDrivers = true; // Temporarily enabled for testing

  const {
    data: pendingData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["pendingDrivers"],
    queryFn: () => GTS.getPendingDrivers(),
    staleTime: 30 * 1000,
  });

  const pendingDrivers = useMemo(
    () =>
      (pendingData?.pending || []).map((driver) => ({
        ...driver,
        trainingModules: driver.trainingModules || [],
      })),
    [pendingData]
  );

  const approveMutation = useMutation({
    mutationFn: ({ driverId, payload }) => GTS.approveDriver(driverId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingDrivers"]);
      setShowApproveModal(false);
      setApprovalForm(createInitialApprovalForm());
      setSelectedDriver(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ driverId, payload }) => GTS.rejectDriver(driverId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingDrivers"]);
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectionNotes("");
      setSelectedDriver(null);
    },
  });

  const handleRefresh = useCallback(() => {
    const tasks = [refetch()];
    if (user?.id) {
      tasks.push(refetchPermissions());
    }
    Promise.all(tasks).catch(() => undefined);
  }, [refetch, refetchPermissions, user?.id]);

  const openApproveModal = useCallback(
    (driver) => {
      setSelectedDriver(driver);
      setApprovalForm(createInitialApprovalForm(driver));
      setShowApproveModal(true);
    },
    [setSelectedDriver]
  );

  const openRejectModal = useCallback((driver) => {
    setSelectedDriver(driver);
    setRejectionReason("");
    setRejectionNotes("");
    setShowRejectModal(true);
  }, []);

  const handleApprovalSubmit = useCallback(() => {
    if (!selectedDriver) return;
    const modules =
      approvalForm.trainingModules
        ?.split(",")
        .map((module) => module.trim())
        .filter(Boolean) || [];

    approveMutation.mutate({
      driverId: selectedDriver.id,
      payload: {
        userId: user?.id,
        shiftStart: approvalForm.shiftStart,
        shiftEnd: approvalForm.shiftEnd,
        licenseVerified: approvalForm.licenseVerified,
        trainingVerified: approvalForm.trainingVerified,
        trainingCompleted: approvalForm.trainingCompleted,
        trainingModules: modules,
        shiftAssigned: approvalForm.shiftAssigned,
        notes: approvalForm.notes,
      },
    });
  }, [approvalForm, approveMutation, selectedDriver, user?.id]);

  const handleRejectSubmit = useCallback(() => {
    if (!selectedDriver || !rejectionReason.trim()) {
      return;
    }
    rejectMutation.mutate({
      driverId: selectedDriver.id,
      payload: {
        userId: user?.id,
        reason: rejectionReason.trim(),
        notes: rejectionNotes.trim(),
      },
    });
  }, [
    rejectMutation,
    rejectionNotes,
    rejectionReason,
    selectedDriver,
    user?.id,
  ]);

  const renderPermissionBanner = () => {
    if (canManageDrivers) return null;
    return (
      <View style={styles.permissionBanner}>
        <Text style={styles.permissionTitle}>Driver approvals locked</Text>
        <Text style={styles.permissionBody}>
          You can review registration details but only Super Admins can allow
          you to approve or reject new drivers. Ask them to enable the “Manage
          Drivers” permission.
        </Text>
      </View>
    );
  };

  const renderDriverCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverId}>{item.id}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Phone</Text>
        <Text style={styles.rowValue}>{item.phone}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>License</Text>
        <Text style={styles.rowValue}>
          {item.licenseNumber} • Exp {item.licenseExpiry}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Preferred Shift</Text>
        <Text style={styles.rowValue}>
          {item.preferredShift} ({item.requestedShiftStart} -{" "}
          {item.requestedShiftEnd})
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Training</Text>
        <Text style={styles.rowValue}>
          {item.trainingCompleted ? "Completed" : "Pending"}
        </Text>
      </View>
      {item.trainingModules?.length ? (
        <View style={styles.trainingContainer}>
          {item.trainingModules.map((module) => (
            <View key={module} style={styles.trainingChip}>
              <Text style={styles.trainingChipText}>{module}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.remarksLabel}>Remarks</Text>
      <Text style={styles.remarksText}>{item.remarks || "—"}</Text>

      <View style={styles.documentsContainer}>
        {(item.documents || []).map((doc) => (
          <View key={`${item.id}-${doc.type}`} style={styles.documentRow}>
            <Text style={styles.documentType}>{doc.type}</Text>
            <Text style={styles.documentUrl}>{doc.url}</Text>
          </View>
        ))}
      </View>

      {canManageDrivers ? (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardButton, styles.rejectButton]}
            onPress={() => openRejectModal(item)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardButton, styles.approveButton]}
            onPress={() => openApproveModal(item)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderContent = () => {
    if (isLoading && pendingDrivers.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={themeRef.current?.colors?.loaderPrimary || "#1d4ed8"}
          />
          <Text style={styles.loaderText}>Loading pending drivers…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>
            Unable to load driver registrations
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={pendingDrivers}
        keyExtractor={(driver) => driver.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderDriverCard}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || isPermissionsFetching}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No pending drivers</Text>
            <Text style={styles.emptySubtitle}>
              New driver registrations will show up here for validation.
            </Text>
          </View>
        }
      />
    );
  };

  const renderApproveModal = () => (
    <Modal
      visible={showApproveModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowApproveModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalInner}
        >
          <Text style={styles.modalTitle}>Approve driver</Text>
          <Text style={styles.modalSubtitle}>
            Validate license, assign shift, confirm training before activating
            the driver.
          </Text>

          <View style={styles.formGroupRow}>
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Shift start</Text>
              <TextInput
                style={styles.input}
                value={approvalForm.shiftStart}
                placeholder="08:00"
                onChangeText={(value) =>
                  setApprovalForm((prev) => ({ ...prev, shiftStart: value }))
                }
              />
            </View>
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Shift end</Text>
              <TextInput
                style={styles.input}
                value={approvalForm.shiftEnd}
                placeholder="16:00"
                onChangeText={(value) =>
                  setApprovalForm((prev) => ({ ...prev, shiftEnd: value }))
                }
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>License verified</Text>
            <AppSwitch
              value={approvalForm.licenseVerified}
              onValueChange={(value) =>
                setApprovalForm((prev) => ({ ...prev, licenseVerified: value }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Training verified</Text>
            <AppSwitch
              value={approvalForm.trainingVerified}
              onValueChange={(value) =>
                setApprovalForm((prev) => ({
                  ...prev,
                  trainingVerified: value,
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Training completed</Text>
            <AppSwitch
              value={approvalForm.trainingCompleted}
              onValueChange={(value) =>
                setApprovalForm((prev) => ({
                  ...prev,
                  trainingCompleted: value,
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Shift assigned</Text>
            <AppSwitch
              value={approvalForm.shiftAssigned}
              onValueChange={(value) =>
                setApprovalForm((prev) => ({ ...prev, shiftAssigned: value }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Training modules (comma separated)
            </Text>
            <TextInput
              style={styles.input}
              value={approvalForm.trainingModules}
              onChangeText={(value) =>
                setApprovalForm((prev) => ({ ...prev, trainingModules: value }))
              }
              placeholder="Hazmat Handling, Emergency Response"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={approvalForm.notes}
              onChangeText={(value) =>
                setApprovalForm((prev) => ({ ...prev, notes: value }))
              }
              multiline
              numberOfLines={4}
              placeholder="Add any remarks for dispatch or compliance teams"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowApproveModal(false)}
              disabled={approveMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleApprovalSubmit}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <ActivityIndicator
                  color={themeRef.current?.colors?.surfaceElevated || "#ffffff"}
                />
              ) : (
                <Text style={styles.confirmButtonText}>Approve</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.modalCompact]}>
          <Text style={styles.modalTitle}>Reject driver</Text>
          <Text style={[styles.modalSubtitle, styles.modalSubtitleTight]}>
            Provide a reason so the applicant knows what to fix before
            reapplying.
          </Text>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={styles.input}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="License expired / incomplete documents..."
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
              multiline
              numberOfLines={3}
              placeholder="Extra guidance for the driver"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRejectModal(false)}
              disabled={rejectMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.rejectConfirmButton]}
              onPress={handleRejectSubmit}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator
                  color={themeRef.current?.colors?.surfaceElevated || "#ffffff"}
                />
              ) : (
                <Text style={styles.confirmButtonText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        {/* <Text style={styles.screenTitle}>Driver Approvals</Text>
        <Text style={styles.screenSubtitle}>
          Validate license documents, confirm training, and activate drivers.
        </Text> */}
      </View>

      {renderPermissionBanner()}
      {renderContent()}
      {renderApproveModal()}
      {renderRejectModal()}
    </SafeAreaView>
  );
}
