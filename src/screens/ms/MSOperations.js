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
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import {
  apiSignalArrival,
  apiStartDecant,
  apiEndDecant,
  apiOperatorAcknowledge,
} from "../../lib/msApi";
import NotificationService from "../../services/NotificationService";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import { useThemedStyles } from "../../theme";

// Step legend:
// 0 = Simulate Arrival (Wait for Notif)
// 1 = Confirm Truck Arrival (Visual Check)
// 2 = Enter Pre-Fill Readings & Start
// 3 = Enter Post-Fill Readings & End
// 4 = Confirm & Close
const STORAGE_KEY = "@ms_operations_state";

export default function MSOperations() {
  const route = useRoute();
  const [step, setStep] = useState(0);
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

  const [tripToken, setTripToken] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [arrivalGate, setArrivalGate] = useState({
    allowed: false,
    forTrip: null,
  });
  const [notifAssignment, setNotifAssignment] = useState({
    tripId: null,
    driverId: null,
    truckNumber: null,
    tripToken: null,
  });
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // refs for keyboard/scroll
  const scrollRef = useRef(null);

  // Subscribe to ms_arrival emitter to set assignment when opened from notification
  useEffect(() => {
    const off = NotificationService.addListener("ms_arrival", (data) => {
      if (!data?.tripId || !data?.driverId) return;
      setNotifAssignment({
        tripId: data.tripId,
        driverId: data.driverId,
        truckNumber: data.truckNumber,
        tripToken: data.tripToken,
      });
    });
    return () => off && off();
  }, []);

  // Persistence: Load State
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          // Only restore if we are not already deep-linked (route params take precedence)
          if (!route?.params?.tripId) {
            if (state.step !== undefined) setStep(state.step);
            if (state.tripId) setTripId(state.tripId);
            if (state.tripToken) setTripToken(state.tripToken);
            if (state.arrivalGate) setArrivalGate(state.arrivalGate);
            if (state.notifAssignment) setNotifAssignment(state.notifAssignment);
            if (state.truckNumber) setTruckNumber(state.truckNumber);
            if (state.preReadings) setPreReadings(state.preReadings);
            if (state.postReadings) setPostReadings(state.postReadings);
          }
        }
      } catch (e) {
        console.warn("Failed to load MS state", e);
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
      // Only save if we have an active session (gate allowed or step > 0)
      if (arrivalGate.allowed || step > 0) {
        const state = {
          step,
          tripId,
          tripToken,
          arrivalGate,
          notifAssignment,
          truckNumber,
          preReadings,
          postReadings,
        };
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn("Failed to save MS state", e);
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
  ]);

  // Compute effective assigned ids
  const assignedTripId = route?.params?.tripId || null;
  const assignedDriverId = route?.params?.driverId || null;
  const effectiveAssignedTripId =
    assignedTripId || notifAssignment.tripId;
  const effectiveAssignedDriverId =
    assignedDriverId || notifAssignment.driverId;

  // Just-in-time token retrieval from notification assignment
  useEffect(() => {
    // If we have a token from notification, use it directly
    if (notifAssignment.tripToken) {
      setTripToken(notifAssignment.tripToken);
      setTripId(effectiveAssignedTripId);
      setArrivalGate({
        allowed: true,
        forTrip: effectiveAssignedTripId,
      });
      setTokenLoading(false);
    } else {
      // If no token in notification, we cannot proceed.
      // User must wait for a valid notification.
      if (effectiveAssignedTripId && !tripToken) {
         console.log("Waiting for notification with token...");
      }
    }
  }, [notifAssignment, effectiveAssignedTripId]);

  // When opened from notification with type=ms_arrival
  useEffect(() => {
    const notifTripId =
      route?.params?.type === "ms_arrival" ? route?.params?.tripId : null;
    if (notifTripId) {
      setArrivalGate({ allowed: true, forTrip: notifTripId });
      if (!tripId) setTripId(notifTripId);
      Alert.alert(
        "Truck arrived",
        `Truck for trip ${notifTripId} reached your MS.`
      );
    }
    if (!notifTripId) {
      const last = NotificationService.getLastEvent("ms_arrival");
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
  }, [route?.params?.type, route?.params?.tripId, tripId]);

  // On focus
  useFocusEffect(
    React.useCallback(() => {
      try {
        try {
          NotificationService.flushPendingIntents?.();
        } catch (_error) {}
        const notifTripId =
          route?.params?.type === "ms_arrival" ? route?.params?.tripId : null;
        if (notifTripId && route?.params?.driverId) {
          setNotifAssignment({
            tripId: notifTripId,
            driverId: route.params.driverId,
            truckNumber: route.params.truckNumber,
            tripToken: route.params.tripToken,
          });
        }
      } catch (_error) {}
    }, [route?.params, tripId])
  );

  // Dev helper
  const simulateDevArrival = () => {
    const mockTripId = "TRIP-MS-001";
    const mockTruck = "KA-01-MS-999";
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
      `Simulated arrival for ${mockTripId}`
    );
  };

  // Mutations
  const signalArrival = useMutation({
    mutationFn: () => apiSignalArrival(tripToken),
    onSuccess: (data) => {
      if (notifAssignment.truckNumber) {
        setTruckNumber(notifAssignment.truckNumber);
      }
      setStep(2);
      setTripId(data.trip?.id || tripId);
      Alert.alert(
        "Arrival Confirmed",
        "Truck confirmed. Proceed to pre-fill readings."
      );
    },
  });

  const confirmPreReadings = useMutation({
    mutationFn: () => apiStartDecant(tripToken, preReadings),
    onSuccess: () => {
      Alert.alert(
        "Pre-readings Confirmed",
        "Filling process started. Proceed when ready to take post readings."
      );
      setStep(3);
    },
  });

  const confirmPostReadings = useMutation({
    mutationFn: () => apiEndDecant(tripToken, postReadings),
    onSuccess: () => {
      Alert.alert(
        "Post-readings Confirmed",
        "Filling process completed. Proceed to confirm."
      );
      setStep(4);
    },
  });

  const acknowledgeOperator = useMutation({
    mutationFn: () => apiOperatorAcknowledge(tripToken, qty),
    onSuccess: () => {
      setOpAck(true);
      Keyboard.dismiss();
      Alert.alert(
        "Operation Completed",
        "Filling confirmed successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset flow
              setQty("");
              setOpAck(false);
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
              setPreReadings({ pressure: "", mfm: "" });
              setPostReadings({ pressure: "", mfm: "" });
              signalArrival.reset();
              confirmPreReadings.reset();
              confirmPostReadings.reset();
              acknowledgeOperator.reset();
              
              AsyncStorage.removeItem(STORAGE_KEY).catch((e) =>
                console.warn("Failed to clear state", e)
              );
            }
          }
        ]
      );
    },
  });

  // Gating
  const canSimulate = (() => {
    if (step !== 0 || signalArrival.isPending) return false;
    if (!tripToken || !arrivalGate.allowed) return false;
    if (arrivalGate.forTrip && tripId) return arrivalGate.forTrip === tripId;
    return true;
  })();

  const canConfirmPre =
    step === 2 &&
    !confirmPreReadings.isPending &&
    preReadings.pressure.trim() !== "" &&
    preReadings.mfm.trim() !== "";

  const canConfirmPost =
    step === 3 &&
    !confirmPostReadings.isPending &&
    postReadings.pressure.trim() !== "" &&
    postReadings.mfm.trim() !== "";

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
        flex: 1,
      },
      stepDescription: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
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
      },
      statusMessage: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        fontStyle: "italic",
        marginVertical: theme.spacing(2),
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
        marginBottom: theme.spacing(3),
      },
    })
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              This step is enabled only after an MS-arrival notification for the
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
                  Awaiting backend push notification: type=ms_arrival with
                  tripId.
                </Text>
              </View>
            )}

            {/* Dev Helper */}
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
          </View>

          {/* Step 2: Pre-Fill Readings */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 2: Pre-Fill Readings</Text>
            </View>
            <Text style={styles.stepDescription}>
              Enter pre-fill meter readings before starting the filling process.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pressure</Text>
              <AppTextField
                placeholder="Enter pressure"
                value={preReadings.pressure}
                onChangeText={(val) =>
                  setPreReadings((p) => ({ ...p, pressure: val }))
                }
                keyboardType="numeric"
                editable={step === 2}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MFM Reading</Text>
              <AppTextField
                placeholder="Enter MFM reading"
                value={preReadings.mfm}
                onChangeText={(val) =>
                  setPreReadings((p) => ({ ...p, mfm: val }))
                }
                keyboardType="numeric"
                editable={step === 2}
              />
            </View>
            <AppButton
              title={step > 2 ? "Readings Saved" : "Start Filling"}
              onPress={() => confirmPreReadings.mutate()}
              disabled={!canConfirmPre}
              loading={confirmPreReadings.isPending}
              variant={step > 2 ? "success" : canConfirmPre ? "primary" : "neutral"}
            />
          </View>

          {/* Step 3: Post-Fill Readings */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 3: Post-Fill Readings</Text>
            </View>
            <Text style={styles.stepDescription}>
              Enter post-fill meter readings after completing the filling process.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pressure</Text>
              <AppTextField
                placeholder="Enter pressure"
                value={postReadings.pressure}
                onChangeText={(val) =>
                  setPostReadings((p) => ({ ...p, pressure: val }))
                }
                keyboardType="numeric"
                editable={step === 3}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MFM Reading</Text>
              <AppTextField
                placeholder="Enter MFM reading"
                value={postReadings.mfm}
                onChangeText={(val) =>
                  setPostReadings((p) => ({ ...p, mfm: val }))
                }
                keyboardType="numeric"
                editable={step === 3}
              />
            </View>
            <AppButton
              title={step > 3 ? "Readings Saved" : "End Filling"}
              onPress={() => confirmPostReadings.mutate()}
              disabled={!canConfirmPost}
              loading={confirmPostReadings.isPending}
              variant={step > 3 ? "success" : canConfirmPost ? "primary" : "neutral"}
            />
          </View>

          {/* Step 4: Final Confirm */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="check" size={16} color="#1e293b" />
              </View>
              <Text style={styles.stepTitle}>Step 4: Final Confirmation</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivered Quantity</Text>
              <AppTextField
                placeholder={
                  step === 4
                    ? "Enter delivered quantity"
                    : "Complete filling process first"
                }
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                editable={step === 4}
              />
            </View>
            <AppButton
              title="Confirm & Close"
              onPress={() => acknowledgeOperator.mutate()}
              disabled={step !== 4 || acknowledgeOperator.isPending || !qty}
              loading={acknowledgeOperator.isPending}
              variant={step === 4 ? "primary" : "neutral"}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
