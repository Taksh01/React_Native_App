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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../store/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  apiSignalArrival,
  apiGetPre,
  apiStartDecant,
  apiEndDecant,
  apiGetEnd,
  apiConfirmDelivery,
  apiOperatorAcknowledge,
  getDriverToken,
  apiGetPendingArrivals,
} from "../../lib/dbsApi";
import { CONFIG } from "../../config";
import NotificationService from "../../services/NotificationService";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

// demo tripId — replace with selection later


// Step legend:
// 0 = Simulate Arrival (Wait for Notif)
// 1 = Confirm Truck Arrival (Visual Check)
// 2 = Enter Pre-Decant Readings & Start
// 3 = Enter Post-Decant Readings & End
// 4 = Confirm & Close STO
const STORAGE_KEY = "@dbs_decanting_state";

export default function Decanting() {
  useScreenPermissionSync("Decanting");
  const route = useRoute();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const { token: authToken } = useAuth();
  const [qty, setQty] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [preReadings, setPreReadings] = useState({
    pressure: "",
    mfm: "",
  });
  const [postReadings, setPostReadings] = useState({
    pressure: "",
    mfm: "",
  });
  const [opAck, setOpAck] = useState(false);
  const [drvAck, setDrvAck] = useState(true);

  const [tripToken, setTripToken] = useState(null);
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
    truckNumber: null,
    tripToken: null,
  });
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // refs for keyboard/scroll
  const scrollRef = useRef(null);
  const qtyRef = useRef(null);

  // Subscribe to dbs_arrival emitter to set assignment when opened from notification
  useEffect(() => {
    const off = NotificationService.addListener("dbs_arrival", (data) => {
      // Require both tripId and driverId to behave like MS
      if (!data?.tripId || !data?.driverId) return;
      setNotifAssignment({
        tripId: data.tripId,
        driverId: data.driverId,
        truckNumber: data.truckNumber,
        tripToken: data.tripToken || data.token || data.trip_token,
      });
    });
    return () => off && off();
  }, []);

  // Poll for pending arrivals on mount (recover flow if notification cleared)
  useEffect(() => {
    const checkPending = async () => {
      // Only check if we are in initial state
      if (step > 0 || tripId) return;

      const data = await apiGetPendingArrivals();
      if (data?.arrivals?.length > 0) {
        const arrival = data.arrivals[0];
        console.log("[Decanting] Found pending arrival:", arrival);
        
        // Map API response to internal state format
        setNotifAssignment({
          tripId: arrival.tripId || arrival.trip_id,
          driverId: arrival.driverId || arrival.driver_id,
          truckNumber: arrival.truckNumber || arrival.truck_number,
          tripToken: arrival.tripToken || arrival.trip_token,
        });
        
        // Also set gate immediately like notification would
        if (arrival.tripId || arrival.trip_id) {
           setArrivalGate({ 
             allowed: true, 
             forTrip: arrival.tripId || arrival.trip_id 
           });
           setTripId(arrival.tripId || arrival.trip_id);
           if (arrival.tripToken || arrival.trip_token) {
              setTripToken(arrival.tripToken || arrival.trip_token);
           }
        }
      }
    };
    checkPending();
  }, []);

  // Persistence: Load State
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          console.log("[Decanting] Loaded state:", state);
          // Only restore if we are not already deep-linked (route params take precedence)
          if (!route?.params?.tripId) {
            if (state.step !== undefined) setStep(state.step);
            if (state.tripId) setTripId(state.tripId);
            if (state.tripToken) setTripToken(state.tripToken);
            if (state.arrivalGate) setArrivalGate(state.arrivalGate);
            if (state.notifAssignment) setNotifAssignment(state.notifAssignment);
            if (state.truckNumber) setTruckNumber(state.truckNumber);
            // Restore readings if needed (optional, but good for step 2/3)
            if (state.preReadings) setPreReadings(state.preReadings);
            if (state.postReadings) setPostReadings(state.postReadings);
          }
        }
      } catch (e) {
        console.warn("Failed to load decanting state", e);
      } finally {
        setIsStateLoaded(true);
      }
    };
    loadState();
  }, []);

  // Persistence: Save State
  useEffect(() => {
    if (!isStateLoaded) return;

    const saveState = async () => {
      // Prevent saving if user is logged out (token is null)
      if (!authToken) return;

      // Only save if we have an active session (gate allowed or step > 0)
      if (arrivalGate.allowed || step > 0) {
        const state = {
          step,
          tripId,
          tripToken,
          arrivalGate,
          notifAssignment,
          truckNumber, // For display/logic
          preReadings,
          postReadings,
        };
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn("Failed to save decanting state", e);
        }
      }
    };
    saveState();
  }, [
    isStateLoaded,
    step,
    tripId,
    tripToken,
    arrivalGate,
    notifAssignment,
    truckNumber,
    preReadings,
    postReadings,
    authToken,
  ]);

  // Compute effective assigned ids (from route params, notification, or dev fallback)
  const assignedTripId = route?.params?.tripId || null;
  const assignedDriverId = route?.params?.driverId || null;
  const effectiveAssignedTripId =
    assignedTripId ||
    notifAssignment.tripId ||
    notifAssignment.tripId;
  const effectiveAssignedDriverId =
    assignedDriverId ||
    notifAssignment.driverId;

  // Just-in-time token retrieval when an assignment exists (from notification or queue)
  useEffect(() => {
    let cancelled = false;
    const getToken = async () => {
      if (!effectiveAssignedDriverId || !effectiveAssignedTripId) return;
      setTokenLoading(true);

      // Dev or limited notifications -> create mock token immediately
      if (
        NotificationService.areNotificationsLimited()
      ) {
         if (cancelled) return;
         setTokenLoading(false);
         return;
      }

      // 1. Check Route Params (prioritize notification payload)
      if (route?.params?.token) {
        if (cancelled) return;
        setTripToken(route.params.token);
        setTripId(effectiveAssignedTripId);
        setArrivalGate({
          allowed: true,
          forTrip: effectiveAssignedTripId,
        });
        setTokenLoading(false);
        return;
      }

      // 2. If we have a token from event listener, use it directly
      if (notifAssignment.tripToken) {
        if (cancelled) return;
        setTripToken(notifAssignment.tripToken);
        setTripId(effectiveAssignedTripId);
        setArrivalGate({
          allowed: true,
          forTrip: effectiveAssignedTripId,
        });
        setTokenLoading(false);
        return;
      }

      // Fallback: Fetch token if not in notification
      try {
        const driverTokenResponse = await getDriverToken(
          effectiveAssignedDriverId
        );
        if (cancelled) return;
        setTripToken(driverTokenResponse.token);
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
          setTripToken(null);
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
    console.log("[Decanting] Route params changed:", route.params);
    // check route params for dbs_arrival
    if (notifTripId) {
      setArrivalGate({ allowed: true, forTrip: notifTripId });
      // Only set ID and alert if we aren't already working on this trip
      if (tripId !== notifTripId) {
        setTripId(notifTripId);
        Alert.alert(
          "Truck arrived",
          `Truck for trip ${notifTripId} reached your DBS.`
        );
      }
    }
    // If no route params, use last event if present (covers late mount)
    if (!notifTripId) {
      const last = NotificationService.getLastEvent("dbs_arrival");
      if (last?.tripId) {
        setArrivalGate({ allowed: true, forTrip: last.tripId });
        if (!tripId) setTripId(last.tripId);
        if (last.truckNumber) {
          setNotifAssignment((prev) => ({
            ...prev,
            truckNumber: last.truckNumber,
          }));
        }
        if (last.tripToken) {
          setNotifAssignment((prev) => ({
            ...prev,
            tripToken: last.tripToken,
          }));
        }
      }
    }
  }, [route?.params?.type, route?.params?.tripId]);

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
            truckNumber: route.params.truckNumber || route.params.vehicleNo,
            tripToken: route.params.tripToken || route.params.token,
          });
        }
      } catch (_error) {}
    }, [route?.params, tripId])
  );

  // Dev helper to simulate arrival without notification
  const simulateDevArrival = () => {
    const mockTripId = "TRIP-2573";
    const mockTruck = "001";
    const mockToken = "2573";
    
    setTripId(mockTripId);
    setTripToken(mockToken);
    setArrivalGate({ allowed: true, forTrip: mockTripId });
    setNotifAssignment({
      tripId: mockTripId,
      driverId: "MOCK-DRIVER",
      truckNumber: mockTruck,
      tripToken: mockToken,
    });
    Alert.alert(
      "Dev Mode",
      `Simulated arrival for ${mockTripId} (${mockTruck}) with Token: ${mockToken}`
    );
  };

  // Mutations
  const signalArrival = useMutation({
    mutationFn: () => apiSignalArrival(tripToken),
    onSuccess: (data) => {
      // Auto-set truck number from notification if available, or from response if backend sends it
      if (notifAssignment.truckNumber) {
        setTruckNumber(notifAssignment.truckNumber);
      }
      setStep(2); // Skip old Step 1 (manual entry) -> Go straight to Pre-Readings
      setTripId(data.trip.id);
      Alert.alert(
        "Arrival Confirmed",
        "Truck confirmed. Proceed to pre-decant readings."
      );
    },
  });

  const confirmTruck = useMutation({
    mutationFn: () => Promise.resolve({ truckNumber, confirmed: true }),
    onSuccess: () => {
      setStep(2);
      Alert.alert(
        "Truck Confirmed",
        `Truck ${truckNumber} confirmed. Now enter pre-decant readings.`
      );
    },
  });

  const confirmPreReadings = useMutation({
    mutationFn: () => apiStartDecant(tripToken, preReadings),
    onSuccess: () => {
      Alert.alert(
        "Pre-readings Confirmed",
        "Decanting process started. Proceed when ready to take post readings."
      );
      setStep(3);
    },
  });

  const confirmPostReadings = useMutation({
    mutationFn: () => apiEndDecant(tripToken, postReadings),
    onSuccess: () => {
      Alert.alert(
        "Post-readings Confirmed",
        "Decanting process completed. Proceed to confirm delivery."
      );
      setStep(4);
    },
  });

  const acknowledgeOperator = useMutation({
    mutationFn: () => apiOperatorAcknowledge(tripToken, qty),
    onSuccess: () => {
      // 1. Clear everything immediately
      setQty("");
      setOpAck(false);
      setDrvAck(true);

      setStep(0);
      setTruckNumber("");
      setTripId(null);
      setTripToken(null);
      setArrivalGate({ allowed: false, forTrip: null });
      setNotifAssignment({
        tripId: null,
        driverId: null,
        truckNumber: null,
        tripToken: null,
      });
              
      // Clear route params to prevent state revival
      navigation.setParams({
         tripId: undefined,
         driverId: undefined,
         token: undefined,
         type: undefined,
         vehicleNo: undefined,
         truckNumber: undefined,
         tripToken: undefined
      });

      // Clear persistent notification event so it doesn't revive state
      NotificationService.clearLastEvent("dbs_arrival");
              
      setPreReadings({ pressure: "", mfm: "" });
      setPostReadings({ pressure: "", mfm: "" });
      
      // Reset mutations
      signalArrival.reset();
      confirmTruck.reset();
      confirmPreReadings.reset();
      confirmPostReadings.reset();
      acknowledgeOperator.reset();
      
      // Clear persistence immediately
      AsyncStorage.removeItem(STORAGE_KEY).catch((e) =>
        console.warn("Failed to clear state", e)
      );

      Keyboard.dismiss();

      // 2. Show Alert (Just for display)
      Alert.alert(
        "Operator Acknowledged",
        "Decanting confirmed successfully. Process completed.",
        [{ text: "OK" }]
      );
    },
  });

  // Helpers for keyboard safe input
  const onQtyFocus = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };
  const onQtySubmit = () => Keyboard.dismiss();


  // Gate each button strictly by step (and usual pending checks)
  // Arrival must be permitted via notification (or dev sim) to enable arrival confirmation
  const canSimulate = (() => {
    // gating evaluation for arrival button
    if (step !== 0 || signalArrival.isPending) return false;
    if (!tripToken || !arrivalGate.allowed) return false;
    // If both trip ids are known, require match; otherwise allow to proceed (backend will validate)
    if (arrivalGate.forTrip && tripId) return arrivalGate.forTrip === tripId;
    return true;
  })();

  // Step 2: Pre-Readings (was Step 3)
  const canConfirmPre =
    step === 2 &&
    !confirmPreReadings.isPending &&
    preReadings.pressure.trim() !== "" &&
    preReadings.mfm.trim() !== "";

  // Step 3: Post-Readings (was Step 4)
  const canConfirmPost =
    step === 3 &&
    !confirmPostReadings.isPending &&
    postReadings.pressure.trim() !== "" &&
    postReadings.mfm.trim() !== "";

  // Step 4: Final Confirm (was Step 5)




  // Acks only in step 4
  const ackButtonsDisabled = step !== 4;

  // Show post data from manual readings
  const postData = confirmPostReadings.data;

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
          {/* <View style={styles.header}>
            <Text style={styles.title}>DBS Decanting</Text>
            <Text style={styles.subtitle}>
              Manage truck arrivals and decanting operations
            </Text>
          </View> */}

          {/* Token Status */}
          <View style={styles.tokenStatus}>
            <View style={styles.tokenHeader}>
              <View style={styles.tokenIcon}>
                {tokenLoading ? (
                  <ActivityIndicator size="small" color="#1e293b" />
                ) : (
                    <AppIcon
                      icon={
                        tripToken
                          ? tripToken.startsWith("MOCK-")
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
                  : tripToken
                  ? `${
                      tripToken.startsWith("MOCK-") ? "Mock" : "Real"
                    } Token - Trip: ${tripId}`
                  : "No active token"}
              </Text>
            </View>
            {tripToken && (
              <View style={styles.tokenContent}>
                <Text style={styles.tokenLabel}>Token ID:</Text>
                <Text style={styles.tokenValue}>{tripToken}</Text>
                {tripToken.startsWith("MOCK-") && (
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
            {arrivalGate.allowed && notifAssignment.truckNumber && (
              <View
                style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: "#f0fdf4",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                }}
              >
                <Text style={{ color: "#166534", fontWeight: "bold" }}>
                  Expected Truck: {notifAssignment.truckNumber}
                </Text>
              </View>
            )}
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
              <View>
                <Text style={styles.statusMessage}>
                  Awaiting backend push notification: type=dbs_arrival with
                  tripId.
                </Text>
              </View>
            )}

            {/* Dev Helper - Always Visible for now to help user unblock */}
            {NotificationService.areNotificationsLimited() && (
              <View style={styles.devSection}>
                <Text style={styles.devTitle}>Development Mode</Text>
                <Text style={styles.devText}>
                  Simulate arrival or reset state if stuck.
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <AppButton
                    title="Simulate Arrival"
                    onPress={simulateDevArrival}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title="Reset State"
                    onPress={() => {
                      AsyncStorage.removeItem(STORAGE_KEY);
                      setStep(0);
                      setTripId(null);
                      setTripToken(null);
                      setArrivalGate({ allowed: false, forTrip: null });
                      setNotifAssignment({
                        tripId: null,
                        driverId: null,
                        truckNumber: null,
                        tripToken: null,
                      });
                      Alert.alert("Reset", "State cleared.");
                    }}
                    variant="danger"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
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
          </View>

          {/* Step 2: Pre-Decant Readings */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 2: Pre-Decant Readings</Text>
            </View>
            <Text style={styles.stepDescription}>
              Enter pre-decant meter readings before starting the decanting
              process.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pressure Reading</Text>
              <AppTextField
                value={preReadings.pressure}
                onChangeText={(text) =>
                  setPreReadings((prev) => ({ ...prev, pressure: text }))
                }
                keyboardType="numeric"
                placeholder="Enter pressure reading"
                returnKeyType="next"
                editable={step === 2}
              />
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MFM Reading</Text>
              <AppTextField
                value={preReadings.mfm}
                onChangeText={(text) =>
                  setPreReadings((prev) => ({ ...prev, mfm: text }))
                }
                keyboardType="numeric"
                placeholder="Enter MFM reading"
                returnKeyType="done"
                editable={step === 2}
              />
            </View>

            <AppButton
              title="Start Decanting"
              onPress={() => confirmPreReadings.mutate()}
              disabled={!canConfirmPre}
              loading={confirmPreReadings.isPending}
              variant={canConfirmPre ? "primary" : "neutral"}
            />

            {confirmPreReadings.data && (
              <View style={styles.successMessage}>
                <AppIcon icon="check" size={16} color="#10b981" />
                <Text style={styles.successText}>
                  Pre-readings confirmed. Decanting process started.
                </Text>
              </View>
            )}
          </View>

          {/* Step 3: Post-Decant Readings */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 3: Post-Decant Readings</Text>
            </View>
            <Text style={styles.stepDescription}>
              Enter post-decant meter readings after completing the decanting
              process.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pressure Reading</Text>
              <AppTextField
                value={postReadings.pressure}
                onChangeText={(text) =>
                  setPostReadings((prev) => ({ ...prev, pressure: text }))
                }
                keyboardType="numeric"
                placeholder="Enter final pressure reading"
                returnKeyType="next"
                editable={step === 3}
              />
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MFM Reading</Text>
              <AppTextField
                value={postReadings.mfm}
                onChangeText={(text) =>
                  setPostReadings((prev) => ({ ...prev, mfm: text }))
                }
                keyboardType="numeric"
                placeholder="Enter final MFM reading"
                returnKeyType="done"
                editable={step === 3}
              />
            </View>

            <AppButton
              title="End Decanting"
              onPress={() => confirmPostReadings.mutate()}
              disabled={!canConfirmPost}
              loading={confirmPostReadings.isPending}
              variant={canConfirmPost ? "primary" : "neutral"}
            />

            {postData && (
              <>

                <View style={styles.successMessage}>
                  <AppIcon icon="check" size={16} color="#10b981" />
                  <Text style={styles.successText}>
                    Post-decant readings confirmed successfully
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Step 5: Confirm Delivery */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="check" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>
                Step 5: Confirm Delivered Quantity
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivered Quantity</Text>
              <AppTextField
                ref={qtyRef}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                placeholder={
                  step === 4
                    ? "Enter delivered quantity (e.g. 998.7)"
                    : "Complete decanting process first"
                }
                returnKeyType="done"
                onFocus={onQtyFocus}
                onSubmitEditing={onQtySubmit}
                editable={step === 4}
              />
            </View>



            <View style={styles.ackRow}>
              <AppButton
                title={opAck ? "Operator Confirmed" : "Operator Acknowledgment"}
                onPress={() => acknowledgeOperator.mutate()}
                disabled={ackButtonsDisabled || opAck || !qty}
                loading={acknowledgeOperator.isPending}
                variant={
                  opAck ? "success" : ackButtonsDisabled ? "neutral" : "primary"
                }
                style={styles.ackButton}
              />
              {/* <AppButton
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
              /> */}
            </View>


          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
