import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppTextField from "../../components/AppTextField";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";

export default function FDODORequest() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-15";
  const queryClient = useQueryClient();
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(6),
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      },
      loadingText: {
        marginTop: theme.spacing(3),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      errorText: {
        fontSize: theme.typography.sizes.bodyLarge,
        color: theme.colors.danger,
        textAlign: "center",
        paddingHorizontal: theme.spacing(4),
      },
      section: {
        marginBottom: theme.spacing(6),
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(4),
        lineHeight: theme.typography.lineHeights.title,
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        ...theme.shadows.level1,
      },
      creditGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -theme.spacing(2),
      },
      creditItem: {
        width: "50%",
        paddingHorizontal: theme.spacing(2),
        marginBottom: theme.spacing(3),
      },
      creditItemInner: {
        alignItems: "center",
        padding: theme.spacing(3),
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
      },
      creditLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
        fontWeight: theme.typography.weightMedium,
      },
      creditValue: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        textAlign: "center",
      },
      creditWarning: {
        color: theme.colors.danger,
      },
      creditFooter: {
        marginTop: theme.spacing(4),
        paddingTop: theme.spacing(3),
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
        alignItems: "center",
      },
      creditFooterText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      formContainer: {
        gap: theme.spacing(4),
      },
      inputGroup: {
        gap: theme.spacing(2),
      },
      label: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textPrimary,
      },
      emptyState: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(6),
        alignItems: "center",
      },
      emptyTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
        textAlign: "center",
      },
      emptyText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeights.body,
      },
      requestCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        ...theme.shadows.level1,
      },
      requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: theme.spacing(3),
      },
      requestId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        flex: 1,
        marginRight: theme.spacing(2),
      },
      statusBadge: {
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.pill,
        alignItems: "center",
        justifyContent: "center",
      },
      statusText: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.surfaceElevated,
      },
      requestContent: {
        gap: theme.spacing(2),
      },
      requestMeta: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
      },
      requestNotes: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        fontStyle: "italic",
        marginTop: theme.spacing(1),
      },
      requestWarning: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.danger,
        marginTop: theme.spacing(2),
        fontWeight: theme.typography.weightMedium,
      },
      confirmSection: {
        marginTop: theme.spacing(4),
        paddingTop: theme.spacing(3),
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
        gap: theme.spacing(3),
      },
      confirmRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: theme.spacing(3),
      },
      confirmInput: {
        flex: 1,
      },
    });
  });

  const [quantity, setQuantity] = useState("10000");
  const [notes, setNotes] = useState("");
  const [confirmValues, setConfirmValues] = useState({});

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["fdodoRequests", dbsId],
    queryFn: () => GTS.getFdodoRequests(dbsId),
    refetchInterval: 45 * 1000,
  });

  const credit = data?.credit || {};
  const requests = data?.requests || [];

  // Map any backend status to just APPROVED or PENDING
  function normalizeRequestStatus(status) {
    const s = (status ?? "").toString().toUpperCase();
    if (["APPROVED", "FILLED", "CONFIRMED", "COMPLETED"].includes(s)) {
      return "APPROVED";
    }
    return "PENDING";
  }

  // Only show APPROVED or PENDING, and hide any that expect confirmation
  const filteredRequests = requests
    .filter((r) => !r?.requiresConfirmation) // hide confirm flows
    .map((r) => ({ ...r, _status: normalizeRequestStatus(r.status) })) // attach normalized
    .filter((r) => r._status === "APPROVED" || r._status === "PENDING");

  const submitMutation = useMutation({
    mutationFn: (payload) => GTS.fdodoRequest(payload),
    onSuccess: (response) => {
      Alert.alert("Request submitted", response?.id || "Created successfully");
      setNotes("");
      queryClient.invalidateQueries(["fdodoRequests", dbsId]);
      // cross-screen invalidation of query is possible and that is done here
      // this query is used in FDODODashboard screen
      queryClient.invalidateQueries(["fdodoDashboard", dbsId]);
    },
    onError: (err) => {
      Alert.alert("Submit failed", err?.message || "Unable to place request");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ requestId, filledQuantity }) =>
      GTS.fdodoConfirmFill(requestId, { dbsId, filledQuantity }),
    onSuccess: (_data, variables) => {
      Alert.alert("Confirmation received", "Fill quantity recorded");
      if (variables?.requestId) {
        setConfirmValues((prev) => {
          const next = { ...prev };
          delete next[variables.requestId];
          return next;
        });
      }
      queryClient.invalidateQueries(["fdodoRequests", dbsId]);
      queryClient.invalidateQueries(["fdodoDashboard", dbsId]);
    },
    onError: (err) => {
      Alert.alert("Confirmation failed", err?.message || "Try again later");
    },
  });

  const handleSubmit = () => {
    const numericQty = Number(quantity);
    if (!numericQty || Number.isNaN(numericQty) || numericQty <= 0) {
      Alert.alert("Invalid quantity", "Enter a quantity greater than zero.");
      return;
    }
    if (credit.status && credit.status !== "OK") {
      Alert.alert(
        "Credit blocked",
        "SAP credit status is not OK. Resolve credit issues before submitting."
      );
      return;
    }
    if (typeof credit.available === "number" && credit.available < numericQty) {
      Alert.alert(
        "Insufficient credit",
        "Requested quantity exceeds available credit."
      );
      return;
    }
    submitMutation.mutate({
      dbsId,
      quantity: numericQty,
      notes: notes.trim() || undefined,
    });
  };

  const handleConfirmChange = (requestId, value) => {
    setConfirmValues((prev) => ({ ...prev, [requestId]: value }));
  };

  const handleConfirm = (requestId) => {
    const request = requests.find((req) => req.id === requestId);
    const rawValue =
      confirmValues[requestId] ??
      request?.fulfilledQuantity ??
      request?.quantity;
    const numericQty = Number(rawValue);
    if (!numericQty || Number.isNaN(numericQty) || numericQty <= 0) {
      Alert.alert(
        "Invalid quantity",
        "Set a valid filled quantity greater than zero."
      );
      return;
    }
    confirmMutation.mutate({ requestId, filledQuantity: numericQty });
  };

  const refreshing =
    isRefetching || submitMutation.isLoading || confirmMutation.isLoading;

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={themeRef.current?.colors?.info || "#3b82f6"}
        />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Unable to load requests. Pull to retry.
        </Text>
      </SafeAreaView>
    );
  }

  const renderRequestCard = (request) => {
    const createdAt = new Date(request.requestedAt).toLocaleString("en-IN");
    const confirmValue =
      confirmValues[request.id] ??
      String(request.fulfilledQuantity ?? request.quantity ?? "");
    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestId}>{request.id}</Text>
          <View
            style={[styles.statusBadge, requestStatusColors[request.status]]}
          >
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
        <View style={styles.requestContent}>
          <Text style={styles.requestMeta}>
            Quantity: {request.quantity?.toLocaleString?.() ?? "--"}
          </Text>
          {/* <Text style={styles.requestMeta}>
            SAP: {request.sapStatus || "--"}
          </Text> */}
          <Text style={styles.requestMeta}>Requested: {createdAt}</Text>
          {/* {request.notes && (
            <Text style={styles.requestNotes}>Note: {request.notes}</Text>
          )} */}
          {/* {request.blockReason && (
            <Text style={styles.requestWarning}>{request.blockReason}</Text>
          )} */}
        </View>
        {request.requiresConfirmation && (
          <View style={styles.confirmSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Filled Quantity</Text>
              <View style={styles.confirmRow}>
                <View style={styles.confirmInput}>
                  <AppTextField
                    keyboardType="numeric"
                    value={confirmValue}
                    onChangeText={(value) =>
                      handleConfirmChange(request.id, value)
                    }
                    placeholder="Enter filled quantity"
                  />
                </View>
                <AppButton
                  title="Confirm"
                  onPress={() => handleConfirm(request.id)}
                  disabled={confirmMutation.isLoading}
                  loading={confirmMutation.isLoading}
                  variant="success"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} />
          }
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit Summary</Text>
            <View style={styles.card}>
              <View style={styles.creditGrid}>
                <View style={styles.creditItem}>
                  <View style={styles.creditItemInner}>
                    <Text style={styles.creditLabel}>Status</Text>
                    <Text
                      style={[
                        styles.creditValue,
                        credit.status !== "OK" && styles.creditWarning,
                      ]}
                    >
                      {credit.status || "UNKNOWN"}
                    </Text>
                  </View>
                </View>
                <View style={styles.creditItem}>
                  <View style={styles.creditItemInner}>
                    <Text style={styles.creditLabel}>Available</Text>
                    <Text style={styles.creditValue}>
                      {credit.available?.toLocaleString?.() ?? "0"}
                    </Text>
                  </View>
                </View>
                <View style={styles.creditItem}>
                  {/* <View style={styles.creditItemInner}>
                    <Text style={styles.creditLabel}>Reserved</Text>
                    <Text style={styles.creditValue}>
                      {credit.reserved?.toLocaleString?.() ?? "0"}
                    </Text>
                  </View> */}
                </View>
                {/* <View style={styles.creditItem}>
                  <View style={styles.creditItemInner}>
                    <Text style={styles.creditLabel}>Limit</Text>
                    <Text style={styles.creditValue}>
                      {credit.limit?.toLocaleString?.() ?? "0"}
                    </Text>
                  </View>
                </View> */}
              </View>
              <View style={styles.creditFooter}>
                <Text style={styles.creditFooterText}>
                  SAP Status: {credit.sapStatus || "OFFLINE"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raise New Request</Text>
            <View style={styles.card}>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <AppTextField
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Enter quantity"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes (optional)</Text>
                  <AppTextField
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Special instructions"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <AppButton
                  title="Submit Request"
                  onPress={handleSubmit}
                  disabled={submitMutation.isLoading}
                  loading={submitMutation.isLoading}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request History</Text>
            {filteredRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptyText}>
                  Submit a request to start tracking status here.
                </Text>
              </View>
            ) : (
              filteredRequests.map(renderRequestCard)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const requestStatusColors = StyleSheet.create({
  PENDING: { backgroundColor: "#f59e0b" },
  APPROVED: { backgroundColor: "#3b82f6" },
});
