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
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const createClusterForm = (cluster) => {
  const dbsStations = cluster?.dbsStations || [];
  const mapped = dbsStations.map((station) => ({
    id: station.id || "",
    name: station.name || "",
    capacity: station.capacity != null ? String(station.capacity) : "",
  }));
  if (mapped.length === 0) {
    mapped.push({ id: "", name: "", capacity: "" });
  }
  return {
    dbsStations: mapped,
  };
};

const parseDbsStations = (fields) =>
  fields
    .filter((row) => row.id || row.name || row.capacity)
    .map((row) => ({
      id: (row.id || "").toUpperCase(),
      name: row.name || "",
      capacity: row.capacity ? Number(row.capacity) || 0 : undefined,
    }));

export default function ClusterManagement() {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clusterForm, setClusterForm] = useState(createClusterForm({}));

  const queryClient = useQueryClient();
  const { user, updateUserPermissions } = useAuth();
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
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
      permissionCopy: {
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
        padding: theme.spacing(5),
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      cardHeader: {
        marginBottom: theme.spacing(4),
      },
      clusterName: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      clusterId: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      clusterBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        marginTop: theme.spacing(3),
      },
      clusterBadge: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      badgeLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
      },
      badgeValue: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.weightBold,
        marginTop: theme.spacing(1),
      },
      msCard: {
        marginBottom: theme.spacing(5),
        padding: theme.spacing(4),
        borderRadius: theme.radii.lg,
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
      },
      msTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: "#92400e",
        marginBottom: theme.spacing(2),
      },
      msMeta: {
        fontSize: theme.typography.sizes.body,
        color: "#78350f",
        marginBottom: theme.spacing(1),
      },
      section: {
        marginBottom: theme.spacing(5),
      },
      sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      addDbsButton: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.primary,
      },
      addDbsText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
      },
      dbsList: {
        gap: theme.spacing(2),
      },
      dbsCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      dbsCardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      dbsInfo: {
        flex: 1,
      },
      dbsCardTitle: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      dbsCardId: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      dbsCardCapacity: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
      editDbsButton: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.sm,
        backgroundColor: "#e0f2fe",
        borderWidth: 1,
        borderColor: "#0ea5e9",
      },
      editDbsText: {
        color: "#0369a1",
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      notesText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
      },
      footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: theme.spacing(3),
        borderTopWidth: 1,
        borderTopColor: theme.colors.surfaceMuted,
      },
      footerLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
      },
      footerRole: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
      },
      loaderContainer: {
        marginTop: 80,
        alignItems: "center",
        gap: theme.spacing(3),
        paddingHorizontal: theme.spacing(6),
      },
      loaderText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      errorTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.danger,
      },
      errorMessage: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.danger,
        textAlign: "center",
      },
      retryButton: {
        marginTop: theme.spacing(2),
        paddingHorizontal: theme.spacing(5),
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.primary,
      },
      retryButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
      },
      emptyState: {
        alignItems: "center",
        marginTop: 80,
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
      modalCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        maxHeight: "90%",
      },
      modalContent: {
        paddingHorizontal: theme.spacing(6),
        paddingTop: theme.spacing(7),
        paddingBottom: theme.spacing(6),
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
        marginBottom: theme.spacing(6),
        lineHeight: theme.typography.lineHeights.body,
      },
      formGroup: {
        marginBottom: theme.spacing(5),
      },
      inputLabel: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(3),
      },
      stationCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      stationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(4),
      },
      stationNumber: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
      },
      removeButtonText: {
        fontSize: 18,
        color: "#dc2626",
        fontWeight: theme.typography.weightSemiBold,
      },
      inputRow: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginBottom: theme.spacing(3),
      },
      inputColumn: {
        flex: 1,
      },
      fieldLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(3),
        backgroundColor: theme.colors.surfaceElevated,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.body,
      },
      addStationButton: {
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(4),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 2,
        borderColor: theme.colors.borderSubtle,
        borderStyle: "dashed",
        alignItems: "center",
      },
      addStationText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
      },
      modalActions: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginTop: theme.spacing(2),
      },
      cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing(4),
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        alignItems: "center",
        backgroundColor: theme.colors.surfaceElevated,
      },
      cancelButtonText: {
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
        fontSize: theme.typography.sizes.bodyLarge,
      },
      saveButton: {
        flex: 1,
        paddingVertical: theme.spacing(4),
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
      },
      saveButtonText: {
        color: theme.colors.surfaceElevated,
        fontWeight: theme.typography.weightSemiBold,
        fontSize: theme.typography.sizes.bodyLarge,
      },
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
  const canManageClusters = true; // Temporarily enabled for testing

  const {
    data: clusterData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["clusters"],
    queryFn: () => GTS.getClusters(),
    staleTime: 30 * 1000,
  });

  const clusters = useMemo(() => clusterData?.clusters || [], [clusterData]);

  const updateClusterMutation = useMutation({
    mutationFn: ({ clusterId, payload }) =>
      GTS.updateCluster(clusterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["clusters"]);
      setShowEditModal(false);
      setSelectedCluster(null);
    },
  });

  const handleRefresh = useCallback(() => {
    const tasks = [refetch()];
    if (user?.id) tasks.push(refetchPermissions());
    Promise.all(tasks).catch(() => undefined);
  }, [refetch, refetchPermissions, user?.id]);

  const openEditModal = useCallback((cluster) => {
    setSelectedCluster(cluster);
    setClusterForm(createClusterForm(cluster));
    setShowEditModal(true);
  }, []);

  const openAddModal = useCallback((cluster) => {
    setSelectedCluster(cluster);
    const form = createClusterForm(cluster);
    form.dbsStations = [
      ...form.dbsStations,
      { id: "", name: "", capacity: "" },
    ];
    setClusterForm(form);
    setShowEditModal(true);
  }, []);

  const handleClusterChange = (index, field, value) => {
    setClusterForm((prev) => {
      const next = [...prev.dbsStations];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { dbsStations: next };
    });
  };

  const addDbsRow = () => {
    setClusterForm((prev) => ({
      dbsStations: [...prev.dbsStations, { id: "", name: "", capacity: "" }],
    }));
  };

  const removeDbsRow = (index) => {
    setClusterForm((prev) => {
      const next = prev.dbsStations.filter((_, idx) => idx !== index);
      return {
        dbsStations:
          next.length > 0 ? next : [{ id: "", name: "", capacity: "" }],
      };
    });
  };

  const handleClusterSave = () => {
    if (!selectedCluster) return;

    const dbsStations = parseDbsStations(clusterForm.dbsStations);
    updateClusterMutation.mutate({
      clusterId: selectedCluster.id,
      payload: {
        dbsStations,
        userId: user?.id,
      },
    });
  };

  const renderPermissionsBanner = () =>
    canManageClusters ? null : (
      <View style={styles.permissionBanner}>
        <Text style={styles.permissionTitle}>Cluster edits disabled</Text>
        <Text style={styles.permissionCopy}>
          You can review cluster topology, but only Super Admins can enable
          central edits to MS/DBS groups. Ask them to grant "Manage Clusters".
        </Text>
      </View>
    );

  const renderClusterCard = ({ item }) => {
    const ms = item.msStation || {};
    const dbsStations = item.dbsStations || [];
    const totalCapacity =
      dbsStations.reduce((sum, station) => sum + (station.capacity || 0), 0) ||
      "—";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* <View>
            <Text style={styles.clusterName}>{item.name}</Text>
            <Text style={styles.clusterId}>{item.id}</Text>
          </View> */}

          <View style={styles.msCard}>
            <Text style={styles.msTitle}>{ms.name || ms.id}</Text>
            <Text style={styles.msMeta}>
              Location: {ms.location || "Unknown"}
            </Text>
            {/* <Text style={styles.msMeta}>
            Capacity: {ms.capacity != null ? ms.capacity : "—"} scm
          </Text> */}
          </View>
          <View style={styles.clusterBadges}>
            <View style={styles.clusterBadge}>
              <Text style={styles.badgeLabel}>DBS Count</Text>
              <Text style={styles.badgeValue}>{dbsStations.length}</Text>
            </View>
            {/* <View style={styles.clusterBadge}>
              <Text style={styles.badgeLabel}>Network Capacity</Text>
              <Text style={styles.badgeValue}>{totalCapacity} scm</Text>
            </View> */}
            {/* <View style={styles.clusterBadge}>
              <Text style={styles.badgeLabel}>MS Capacity</Text>
              <Text style={styles.badgeValue}>
                {ms.capacity != null ? ms.capacity : "—"} scm
              </Text>
            </View> */}
          </View>
        </View>

        {/* <View style={styles.msCard}>
          <Text style={styles.msTitle}>{ms.name || ms.id}</Text>
          <Text style={styles.msMeta}>
            Location: {ms.location || "Unknown"}
          </Text>
          <Text style={styles.msMeta}>
            Capacity: {ms.capacity != null ? ms.capacity : "—"} scm
          </Text>
        </View> */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Distribution Stations ({dbsStations.length})
            </Text>
            {canManageClusters && (
              <TouchableOpacity
                style={styles.addDbsButton}
                onPress={() => openAddModal(item)}
              >
                <Text style={styles.addDbsText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dbsList}>
            {dbsStations.map((station, index) => (
              <View key={`${station.id}-${index}`} style={styles.dbsCard}>
                <View style={styles.dbsCardContent}>
                  <View style={styles.dbsInfo}>
                    <Text style={styles.dbsCardTitle}>
                      {station.name || "Unnamed DBS"}
                    </Text>
                    <Text style={styles.dbsCardId}>{station.id}</Text>
                    <Text style={styles.dbsCardCapacity}>
                      {station.capacity != null
                        ? `${station.capacity} scm`
                        : "No capacity"}
                    </Text>
                  </View>
                  {canManageClusters && (
                    <TouchableOpacity
                      style={styles.editDbsButton}
                      onPress={() => openEditModal(item)}
                    >
                      <Text style={styles.editDbsText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{item.notes || "—"}</Text>
        </View> */}

        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>
            Last updated {new Date(item.lastUpdated).toLocaleString()}
          </Text>
          <Text style={styles.footerRole}>
            Manager: {item.clusterManager || "Unassigned"}
          </Text>
        </View>
      </View>
    );
  };

  const renderClusters = () => {
    if (isLoading && clusters.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={themeRef.current?.colors?.loaderPrimary || "#1d4ed8"}
          />
          <Text style={styles.loaderText}>Loading cluster topology…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorTitle}>Failed to load clusters</Text>
          <Text style={styles.errorMessage}>
            {error?.message || "Check the connection and try again."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={clusters}
        keyExtractor={(cluster) => cluster.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderClusterCard}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || isPermissionsFetching}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No clusters configured</Text>
            <Text style={styles.emptySubtitle}>
              Central dashboards will list MS/DBS pairings here once they are
              registered.
            </Text>
          </View>
        }
      />
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEditModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.modalCard}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalTitle}>Manage DBS Stations</Text>
          <Text style={styles.modalSubtitle}>
            Add, edit, or remove DBS stations for this cluster. Changes will be
            saved immediately.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>DBS Stations</Text>
            {clusterForm.dbsStations.map((station, index) => (
              <View
                key={`${selectedCluster?.id}-${index}`}
                style={styles.stationCard}
              >
                <View style={styles.stationHeader}>
                  <Text style={styles.stationNumber}>DBS #{index + 1}</Text>
                  {clusterForm.dbsStations.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDbsRow(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputColumn}>
                    <Text style={styles.fieldLabel}>DBS ID</Text>
                    <TextInput
                      style={styles.input}
                      value={station.id}
                      onChangeText={(value) =>
                        handleClusterChange(index, "id", value)
                      }
                      placeholder="DBS-09"
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={styles.inputColumn}>
                    <Text style={styles.fieldLabel}>Capacity (scm)</Text>
                    <TextInput
                      style={styles.input}
                      value={station.capacity}
                      onChangeText={(value) =>
                        handleClusterChange(index, "capacity", value)
                      }
                      placeholder="7500"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inputColumn}>
                  <Text style={styles.fieldLabel}>Station Name</Text>
                  <TextInput
                    style={styles.input}
                    value={station.name}
                    onChangeText={(value) =>
                      handleClusterChange(index, "name", value)
                    }
                    placeholder="Example DBS Station"
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addStationButton}
              onPress={addDbsRow}
            >
              <Text style={styles.addStationText}>
                + Add Another DBS Station
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
              disabled={updateClusterMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleClusterSave}
              disabled={updateClusterMutation.isPending}
            >
              {updateClusterMutation.isPending ? (
                <ActivityIndicator
                  color={themeRef.current?.colors?.surfaceElevated || "#ffffff"}
                />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        {/* <Text style={styles.screenTitle}>Cluster Management</Text>
        <Text style={styles.screenSubtitle}>
          Central view of MS hubs and their DBS satellites. Update alignments
          as network topology evolves.
        </Text> */}
      </View>

      {renderPermissionsBanner()}
      {renderClusters()}
      {renderEditModal()}
    </SafeAreaView>
  );
}
