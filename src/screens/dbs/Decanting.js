import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import {
  apiSignalArrival,
  apiGetPre,
  apiStartDecant,
  apiEndDecant,
  apiGetEnd,
  apiConfirmDelivery,
  getDriverToken,
} from "../../lib/dbsApi";
import { CONFIG } from "../../config";
import NotificationService from "../../services/NotificationService";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import { useThemedStyles } from "../../theme";

// demo tripId — replace with selection later
const DEFAULT_TRIP_ID = "TRIP-001";

// Step legend:
// 0 = Simulate Arrival
// 1 = Start Decant
// 2 = End Decant
// 3 = Confirm & Close STO
export default function Decanting() {
  const route = useRoute();
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState("");
  const [opAck, setOpAck] = useState(false);
  const [drvAck, setDrvAck] = useState(false);
  const [sapPushed, setSapPushed] = useState(false);

  const [currentToken, setCurrentToken] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [arrivalGate, setArrivalGate] = useState({
    allowed: false,
    forTrip: null,
  });
  const [devAssignmentEnabled, setDevAssignmentEnabled] = useState(false);
  const [notifAssignment, setNotifAssignment] = useState({
    tripId: null,
    driverId: null,
  });

  // refs for keyboard/scroll
  const scrollRef = useRef(null);
  const qtyRef = useRef(null);

  // Subscribe to dbs_arrival emitter to set assignment when opened from notification
  useEffect(() => {
    const off = NotificationService.addListener("dbs_arrival", (data) => {
      // Require both tripId and driverId to behave like MS
      if (!data?.tripId || !data?.driverId) return;
      setNotifAssignment({ tripId: data.tripId, driverId: data.driverId });
    });
    return () => off && off();
  }, []);

  // Compute effective assigned ids (from route params, notification, or dev fallback)
  const assignedTripId = route?.params?.tripId || null;
  const assignedDriverId = route?.params?.driverId || null;
  const effectiveAssignedTripId =
    assignedTripId ||
    notifAssignment.tripId ||
    (devAssignmentEnabled ? DEFAULT_TRIP_ID : null);
  const effectiveAssignedDriverId =
    assignedDriverId ||
    notifAssignment.driverId ||
    (devAssignmentEnabled ? "DEV-DRIVER" : null);

  // Just-in-time token retrieval when an assignment exists (from notification or queue)
  useEffect(() => {
    let cancelled = false;
    const getToken = async () => {
      if (!effectiveAssignedDriverId || !effectiveAssignedTripId) return;
      setTokenLoading(true);

      // Dev or limited notifications -> create mock token immediately
      if (
        NotificationService.areNotificationsLimited() ||
        devAssignmentEnabled
      ) {
        if (cancelled) return;
        const mockToken = `MOCK-DBS-${effectiveAssignedTripId}-${effectiveAssignedDriverId}-${Date.now()}`;
        setCurrentToken(mockToken);
        setTripId(effectiveAssignedTripId);
        setArrivalGate({ allowed: true, forTrip: effectiveAssignedTripId });
        setTokenLoading(false);
        return;
      }

      try {
        const driverTokenResponse = await getDriverToken(
          effectiveAssignedDriverId
        );
        if (cancelled) return;
        setCurrentToken(driverTokenResponse.token);
        setTripId(driverTokenResponse.tripId || effectiveAssignedTripId);
        setArrivalGate({
          allowed: true,
          forTrip: driverTokenResponse.tripId || effectiveAssignedTripId,
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("No token found for driver - trip not accepted yet");
          Alert.alert(
            "Token Not Found",
            "Driver hasn't accepted this trip yet. Please ask the driver to accept the trip first, or wait for them to arrive at the DBS station.",
            [{ text: "OK" }]
          );
          setCurrentToken(null);
          setTripId(null);
          setArrivalGate({ allowed: false, forTrip: null });
        }
      } finally {
        if (!cancelled) setTokenLoading(false);
      }
    };
    getToken();
    return () => {
      cancelled = true;
    };
  }, [
    effectiveAssignedDriverId,
    effectiveAssignedTripId,
    devAssignmentEnabled,
  ]);

  // When opened from notification with type=dbs_arrival, gate arrival for that trip only
  useEffect(() => {
    const notifTripId =
      route?.params?.type === "dbs_arrival" ? route?.params?.tripId : null;
    // check route params for dbs_arrival
    if (notifTripId) {
      setArrivalGate({ allowed: true, forTrip: notifTripId });
      // Prefer using notif tripId until backend token resolves
      if (!tripId) setTripId(notifTripId);
      // set arrival gate from params
      Alert.alert(
        "Truck arrived",
        `Truck for trip ${notifTripId} reached your DBS.`
      );
    }
    // If no route params, use last event if present (covers late mount)
    if (!notifTripId) {
      const last = NotificationService.getLastEvent("dbs_arrival");
      if (last?.tripId) {
        setArrivalGate({ allowed: true, forTrip: last.tripId });
        if (!tripId) setTripId(last.tripId);
      }
    }
  }, [route?.params?.type, route?.params?.tripId, tripId]);

  // On focus, if we came here manually and there was a queued intent, emit locally
  useFocusEffect(
    React.useCallback(() => {
      try {
        // No direct access to private pending state; rely on route params already set by service.
        // Also ask service to flush any pending intents now that UI is focused
        try {
          NotificationService.flushPendingIntents?.();
        } catch (_error) {}
        const notifTripId =
          route?.params?.type === "dbs_arrival" ? route?.params?.tripId : null;
        // focus: if route params were set directly (deep link), seed notifAssignment so token effect can run
        if (notifTripId && route?.params?.driverId) {
          setNotifAssignment({
            tripId: notifTripId,
            driverId: route.params.driverId,
          });
        }
      } catch (_error) {}
    }, [route?.params, tripId])
  );

  // Mutations
  const signalArrival = useMutation({
    mutationFn: () => apiSignalArrival(currentToken),
    onSuccess: (data) => {
      setStep(1);
      setTripId(data.trip.id);
    },
  });

  const pre = useQuery({
    queryKey: ["pre", currentToken, signalArrival.data?.trip?.status],
    queryFn: () => apiGetPre(currentToken),
    enabled: !!signalArrival.data?.trip && !!currentToken,
  });

  const start = useMutation({
    mutationFn: () => apiStartDecant(currentToken),
    onSuccess: () => {
      Alert.alert("Decant started", "Recording in progress.");
      setStep(2);
    },
  });

  const end = useMutation({
    mutationFn: () => apiEndDecant(currentToken),
    onSuccess: (data) => {
      Alert.alert("Decant ended", "Captured post-decant metrics.");
      // Set step to 3 immediately to enable acknowledgment buttons
      setStep(3);
      // Trigger post data refetch
      setTimeout(() => {
        refetchPost();
      }, 500);
    },
  });

  const {
    data: post,
    refetch: refetchPost,
    isFetching: postLoading,
  } = useQuery({
    queryKey: ["post", currentToken, end.data?.endTime],
    queryFn: () => apiGetEnd(currentToken),
    enabled: !!end.data && !!currentToken,
    retry: 3,
    retryDelay: 1000,
  });

  const confirm = useMutation({
    mutationFn: () =>
      apiConfirmDelivery(currentToken, {
        deliveredQty: Number(qty),
        operatorAck: opAck,
        driverAck: drvAck,
      }),
    onSuccess: () => {
      Keyboard.dismiss();
      Alert.alert(
        "Delivery confirmed",
        "STO will be closed in SAP via GTS (mock)."
      );
      // Reset flow to start
      setQty("");
      setOpAck(false);
      setDrvAck(false);
      setSapPushed(false);
      setStep(0);
      signalArrival.reset();
      start.reset();
      end.reset();
      confirm.reset();
    },
  });

  // Helpers for keyboard safe input
  const onQtyFocus = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };
  const onQtySubmit = () => Keyboard.dismiss();

  // TEMP: Push delivery confirmation to SAP (stub)
  const handlePushToSap = () => {
    // TODO: POST to SAP integration endpoint once available
    // Example: apiPushSap({ tripId, deliveredQty: Number(qty), operatorAck: opAck, driverAck: drvAck })
    setSapPushed(true);
    Alert.alert(
      "Push to SAP (mock)",
      "Delivery confirmation will be sent to SAP."
    );
  };
  // Gate each button strictly by step (and usual pending checks)
  // Arrival must be permitted via notification (or dev sim) to enable arrival confirmation
  const canSimulate = (() => {
    // gating evaluation for arrival button
    if (step !== 0 || signalArrival.isPending) return false;
    if (!currentToken || !arrivalGate.allowed) return false;
    // If both trip ids are known, require match; otherwise allow to proceed (backend will validate)
    if (arrivalGate.forTrip && tripId) return arrivalGate.forTrip === tripId;
    return true;
  })();
  const canStart = step === 1 && !start.isPending && !!pre.data;
  const canEnd = step === 2 && !end.isPending && !!start.data;
  const canConfirm =
    step === 3 &&
    !confirm.isPending &&
    !!qty &&
    !isNaN(parseFloat(qty)) &&
    parseFloat(qty) > 0 &&
    opAck &&
    drvAck;

  // Enable SAP push when Step 4 is reached (with the ack buttons)
  const canPush =
    step === 3 && !!qty && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0;

  // Acks only in step 3
  const ackButtonsDisabled = step !== 3;

  // Show post data if available (either from end mutation or query)
  const postData = end.data || post;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(6),
      },
      header: {
        marginBottom: theme.spacing(6),
      },
      title: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.heading,
        marginBottom: theme.spacing(1),
      },
      subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        ...theme.shadows.level1,
      },
      stepHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.spacing(3),
      },
      stepTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.bodyLarge,
        flex: 1,
      },
      stepDescription: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
        marginBottom: theme.spacing(3),
      },
      tokenStatus: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        ...theme.shadows.level1,
      },
      tokenHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing(3),
      },
      tokenIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.spacing(3),
      },
      tokenText: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        flex: 1,
      },
      tokenContent: {
        gap: theme.spacing(2),
      },
      tokenLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightMedium,
      },
      tokenValue: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: "monospace",
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.surfaceMuted,
        padding: theme.spacing(2),
        borderRadius: theme.radii.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      tokenWarning: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.warning,
        fontStyle: "italic",
        lineHeight: theme.typography.lineHeights.caption,
      },
      metricsContainer: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        marginVertical: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      metricsTitle: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      metricItem: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
        lineHeight: theme.typography.lineHeights.body,
      },
      statusMessage: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        fontStyle: "italic",
        marginVertical: theme.spacing(2),
        lineHeight: theme.typography.lineHeights.body,
      },
      errorMessage: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.danger,
        marginVertical: theme.spacing(2),
        lineHeight: theme.typography.lineHeights.body,
      },
      successMessage: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: theme.spacing(2),
      },
      successText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.success,
        marginLeft: theme.spacing(2),
        lineHeight: theme.typography.lineHeights.body,
      },
      inputGroup: {
        marginBottom: theme.spacing(4),
      },
      inputLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      ackRow: {
        flexDirection: "row",
        gap: theme.spacing(3),
        marginBottom: theme.spacing(4),
      },
      ackButton: {
        flex: 1,
      },
      devSection: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        marginTop: theme.spacing(2),
        borderWidth: 1,
        borderColor: theme.colors.warning,
      },
      devTitle: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.warning,
        marginBottom: theme.spacing(2),
      },
      devText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
        marginBottom: theme.spacing(3),
      },
    })
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>DBS Decanting</Text>
            <Text style={styles.subtitle}>
              Manage truck arrivals and decanting operations
            </Text>
          </View>

          {/* Token Status */}
          <View style={styles.tokenStatus}>
            <View style={styles.tokenHeader}>
              <View style={styles.tokenIcon}>
                {tokenLoading ? (
                  <ActivityIndicator size="small" color="#1e293b" />
                ) : (
                  <AppIcon
                    icon={
                      currentToken
                        ? currentToken.startsWith("MOCK-")
                          ? "robot"
                          : "check"
                        : "info"
                    }
                    size={16}
                    color="#1e293b"
                  />
                )}
              </View>
              <Text style={styles.tokenText}>
                {tokenLoading
                  ? "Setting up token..."
                  : currentToken
                  ? `${
                      currentToken.startsWith("MOCK-") ? "Mock" : "Real"
                    } Token - Trip: ${tripId}`
                  : "No active token"}
              </Text>
            </View>
            {currentToken && (
              <View style={styles.tokenContent}>
                <Text style={styles.tokenLabel}>Token ID:</Text>
                <Text style={styles.tokenValue}>{currentToken}</Text>
                {currentToken.startsWith("MOCK-") && (
                  <Text style={styles.tokenWarning}>
                    Development mode - real driver token not available
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Step 1: Truck Arrival */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="vehicle" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 1: Truck Arrival</Text>
            </View>
            <Text style={styles.stepDescription}>
              This step is enabled only after a DBS-arrival notification for the
              matching trip.
            </Text>
            <AppButton
              title={
                arrivalGate.allowed
                  ? "Confirm Truck Arrival"
                  : "Waiting for Arrival Notification"
              }
              onPress={() => signalArrival.mutate()}
              disabled={!canSimulate}
              loading={signalArrival.isPending}
              variant={canSimulate ? "primary" : "neutral"}
            />
            {!arrivalGate.allowed && (
              <Text style={styles.statusMessage}>
                Awaiting backend push notification: type=dbs_arrival with
                tripId.
              </Text>
            )}
            {signalArrival.error && (
              <Text style={styles.errorMessage}>
                Arrival error: {signalArrival.error.message}
              </Text>
            )}
            {signalArrival.data?.trip && (
              <View style={styles.successMessage}>
                <AppIcon icon="check" size={16} color="#10b981" />
                <Text style={styles.successText}>
                  Trip {signalArrival.data.trip.id} • Status:{" "}
                  {signalArrival.data.trip.status}
                </Text>
              </View>
            )}

            {/* Development Simulator */}
            {(!process.env.NODE_ENV || process.env.NODE_ENV !== "production") &&
              !process.env.EAS_BUILD && (
                <View style={styles.devSection}>
                  <Text style={styles.devTitle}>Development Mode</Text>
                  <Text style={styles.devText}>
                    For testing purposes, you can simulate an arrival
                    notification below.
                  </Text>
                  <AppButton
                    title="Simulate Arrival Notification"
                    onPress={() => {
                      const devTrip = tripId || DEFAULT_TRIP_ID;
                      setArrivalGate({ allowed: true, forTrip: devTrip });
                      setDevAssignmentEnabled(true);
                      Alert.alert("Test", `Simulated arrival for ${devTrip}`);
                    }}
                    variant="neutral"
                  />
                </View>
              )}
          </View>

          {/* Step 2: Pre-decant Metrics */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 2: Pre-decant Metrics</Text>
            </View>
            {pre.isPending && (
              <Text style={styles.statusMessage}>
                Loading pre-decant metrics...
              </Text>
            )}
            {pre.error && (
              <Text style={styles.errorMessage}>
                No pre-decant metrics available. Complete truck arrival first.
              </Text>
            )}
            {pre.data && (
              <View style={styles.metricsContainer}>
                <Text style={styles.metricsTitle}>Pre-Decant Readings</Text>
                <Text style={styles.metricItem}>
                  Pressure: {pre.data.pressure} PSI
                </Text>
                <Text style={styles.metricItem}>
                  Flow Rate: {pre.data.flow} L/min
                </Text>
                <Text style={styles.metricItem}>
                  MFM Reading: {pre.data.mfm} L
                </Text>
              </View>
            )}
            <AppButton
              title="Start Decanting Process"
              onPress={() => start.mutate()}
              disabled={!canStart}
              loading={start.isPending}
              variant={canStart ? "primary" : "neutral"}
            />
          </View>

          {/* Step 3: Post-decant Metrics */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>
                Step 3: End Decanting Process
              </Text>
            </View>
            <AppButton
              title="End Decanting Process"
              onPress={() => end.mutate()}
              disabled={!canEnd}
              loading={end.isPending}
              variant={canEnd ? "primary" : "neutral"}
            />
            {postLoading && (
              <Text style={styles.statusMessage}>
                Loading post-decant metrics...
              </Text>
            )}
            {end.isPending && (
              <Text style={styles.statusMessage}>
                Ending decanting process...
              </Text>
            )}
            {postData && (
              <>
                <View style={styles.metricsContainer}>
                  <Text style={styles.metricsTitle}>Post-Decant Readings</Text>
                  <Text style={styles.metricItem}>
                    Pressure: {postData.pressure} PSI
                  </Text>
                  <Text style={styles.metricItem}>
                    Flow Rate: {postData.flow} L/min
                  </Text>
                  <Text style={styles.metricItem}>
                    MFM Reading: {postData.mfm} L
                  </Text>
                </View>
                <View style={styles.successMessage}>
                  <AppIcon icon="check" size={16} color="#10b981" />
                  <Text style={styles.successText}>
                    Post-decant metrics captured successfully
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Step 4: Confirm Delivery */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="check" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>
                Step 4: Confirm Delivered Quantity
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivered Quantity (kg)</Text>
              <AppTextField
                ref={qtyRef}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                placeholder={
                  step === 3
                    ? "Enter delivered quantity (e.g. 998.7)"
                    : "Complete decanting process first"
                }
                returnKeyType="done"
                onFocus={onQtyFocus}
                onSubmitEditing={onQtySubmit}
                editable={step === 3}
              />
            </View>

            <AppButton
              title="Push delivery confirmation to SAP"
              onPress={handlePushToSap}
              disabled={!canPush || sapPushed}
              variant={sapPushed ? "success" : canPush ? "primary" : "neutral"}
              style={{ marginBottom: 12 }}
            />

            <View style={styles.ackRow}>
              <AppButton
                title={opAck ? "Operator Confirmed" : "Operator Acknowledgment"}
                onPress={() => setOpAck(true)}
                disabled={ackButtonsDisabled || opAck}
                variant={
                  opAck ? "success" : ackButtonsDisabled ? "neutral" : "primary"
                }
                style={styles.ackButton}
              />
              <AppButton
                title={drvAck ? "Driver Confirmed" : "Driver Acknowledgment"}
                onPress={() => setDrvAck(true)}
                disabled={ackButtonsDisabled || drvAck}
                variant={
                  drvAck
                    ? "success"
                    : ackButtonsDisabled
                    ? "neutral"
                    : "primary"
                }
                style={styles.ackButton}
              />
            </View>

            <AppButton
              title="Confirm & Close STO"
              onPress={() => {
                Keyboard.dismiss();
                confirm.mutate();
              }}
              disabled={!canConfirm}
              loading={confirm.isPending}
              variant={canConfirm ? "success" : "neutral"}
            />
            {confirm.error && (
              <Text style={styles.errorMessage}>
                Confirmation error: {confirm.error.message}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
