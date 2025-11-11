import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";
import { useRoute } from "@react-navigation/native";
import NotificationService from "../../services/NotificationService";
import { msApi } from "../../lib/msApi";
import AppIcon from "../../components/AppIcon";
import AppTextField from "../../components/AppTextField";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";

export default function MSOperations() {
  const { user } = useAuth();
  const route = useRoute();

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
      disabledCard: {
        opacity: 0.6,
        backgroundColor: theme.colors.surfaceMuted,
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
      disabledText: {
        color: theme.colors.textMuted,
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
      disabledMessage: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        fontStyle: "italic",
        marginTop: theme.spacing(2),
        lineHeight: theme.typography.lineHeights.body,
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
      sessionInfo: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginTop: theme.spacing(4),
        ...theme.shadows.level1,
      },
      sessionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      sessionIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.spacing(2),
      },
      sessionText: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textPrimary,
      },
      sessionSubtext: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(1),
      },
    })
  );
  const assignedTripId = route?.params?.tripId || null;
  const assignedDriverId = route?.params?.driverId || null;
  // !const fromNotification = route?.params?.fromNotification || false;

  // State for form inputs
  const [truckNumber, setTruckNumber] = useState("");
  const [preReading, setPreReading] = useState("");
  const [postReading, setPostReading] = useState("");

  // State for flow control
  const [step, setStep] = useState(1); // 1: arrival, 2: pre, 3: post, 4: confirm
  const [sessionId, setSessionId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [devAssignmentEnabled, setDevAssignmentEnabled] = useState(false);
  const [notifAssignment, setNotifAssignment] = useState({
    tripId: null,
    driverId: null,
  });

  // Loading states
  const [loading, setLoading] = useState({
    token: false,
    arrival: false,
    pre: false,
    post: false,
    confirm: false,
  });

  const setStepLoading = (stepName, isLoading) => {
    setLoading((prev) => ({ ...prev, [stepName]: isLoading }));
  };

  // Subscribe to ms_arrival emitter to set assignment when opened from notification
  useEffect(() => {
    const off = NotificationService.addListener("ms_arrival", (data) => {
      if (!data?.tripId || !data?.driverId) return;
      setNotifAssignment({ tripId: data.tripId, driverId: data.driverId });
    });
    return () => off && off();
  }, []);

  // Compute effective assignment early so hooks below can use them safely
  const effectiveAssignedTripId =
    assignedTripId ||
    notifAssignment.tripId ||
    (devAssignmentEnabled ? "DEV-TRIP" : null);
  const effectiveAssignedDriverId =
    assignedDriverId ||
    notifAssignment.driverId ||
    (devAssignmentEnabled ? "DEV-DRIVER" : null);

  // Just-in-time token retrieval when an assignment exists (from notification or queue)
  useEffect(() => {
    let cancelled = false;
    const getToken = async () => {
      if (user?.role !== "MS_OPERATOR") return;
      if (!effectiveAssignedDriverId || !effectiveAssignedTripId) return; // only when assigned (notification or dev)
      setStepLoading("token", true);
      // In Expo Go or when dev assignment is enabled, create a mock token immediately
      if (
        NotificationService.areNotificationsLimited() ||
        devAssignmentEnabled
      ) {
        if (cancelled) return;
        const mockToken = `MOCK-MS-${effectiveAssignedTripId}-${effectiveAssignedDriverId}-${Date.now()}`;
        setCurrentToken(mockToken);
        setTripId(effectiveAssignedTripId);
        setStepLoading("token", false);
        return;
      }
      try {
        // Verify that driver has an existing token (driver must have accepted trip first)
        const driverTokenResponse = await msApi.getDriverToken(
          effectiveAssignedDriverId
        );
        if (cancelled) return;
        setCurrentToken(driverTokenResponse.token);
        setTripId(driverTokenResponse.tripId || effectiveAssignedTripId);
        console.log("✅ Verified driver token for assigned trip");
      } catch (error) {
        // Token doesn't exist - driver hasn't accepted trip yet or there's an issue
        if (!cancelled) {
          console.warn("⚠️ No token found for driver - trip not accepted yet");
          Alert.alert(
            "Token Not Found",
            "Driver hasn't accepted this trip yet. Please ask the driver to accept the trip first, or wait for them to arrive at the MS station.",
            [{ text: "OK" }]
          );
          setCurrentToken(null);
          setTripId(null);
        }
      } finally {
        if (!cancelled) setStepLoading("token", false);
      }
    };
    getToken();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    effectiveAssignedDriverId,
    effectiveAssignedTripId,
    devAssignmentEnabled,
  ]);

  // ! CLEAR
  // API call for truck arrival confirmation
  const confirmTruckArrival = async () => {
    if (!truckNumber.trim()) {
      Alert.alert("Error", "Please enter truck number");
      return;
    }

    if (!effectiveAssignedTripId || !effectiveAssignedDriverId) {
      Alert.alert(
        "Waiting for assignment",
        "This action will be enabled after you receive an arrival notification."
      );
      return;
    }

    if (!currentToken) {
      Alert.alert(
        "Error",
        "No active token for assigned trip. Please wait for token setup."
      );
      return;
    }

    // If running with a mock token or limited notifications, simulate success locally
    if (
      currentToken?.startsWith("MOCK-") ||
      NotificationService.areNotificationsLimited()
    ) {
      setStepLoading("arrival", true);
      setTimeout(() => {
        const fakeSession = `DEV-${effectiveAssignedTripId}-${Date.now()}`;
        setSessionId(fakeSession);
        setStep(2);
        setStepLoading("arrival", false);
        Alert.alert(
          "Success",
          `Truck arrival confirmed for Trip ${
            tripId || effectiveAssignedTripId
          }!`
        );
      }, 300);
      return;
    }

    setStepLoading("arrival", true);
    try {
      const data = await msApi.confirmArrival({
        token: currentToken,
        truckNumber: truckNumber.trim(),
        operatorId: user?.id,
      });

      setSessionId(data.sessionId);
      setStep(2);
      Alert.alert(
        "Success",
        `Truck arrival confirmed for Trip ${data.tripId}!`
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Network error occurred");
    } finally {
      setStepLoading("arrival", false);
    }
  };

  // ! CLEAR
  // API call for pre meter reading
  const submitPreReading = async () => {
    if (!preReading.trim() || isNaN(preReading)) {
      Alert.alert("Error", "Please enter valid pre meter reading");
      return;
    }

    // Simulate in dev/mock mode
    if (sessionId?.startsWith("DEV-") || currentToken?.startsWith("MOCK-")) {
      setStepLoading("pre", true);
      setTimeout(() => {
        setStep(3);
        setStepLoading("pre", false);
        Alert.alert("Success", "Pre meter reading saved!");
      }, 200);
      return;
    }

    setStepLoading("pre", true);
    try {
      await msApi.submitPreReading({
        sessionId,
        reading: parseFloat(preReading),
      });

      setStep(3);
      Alert.alert("Success", "Pre meter reading saved!");
    } catch (error) {
      Alert.alert("Error", error.message || "Network error occurred");
    } finally {
      setStepLoading("pre", false);
    }
  };

  // ! CLEAR
  // API call for post meter reading
  const submitPostReading = async () => {
    if (!postReading.trim() || isNaN(postReading)) {
      Alert.alert("Error", "Please enter valid post meter reading");
      return;
    }

    // Simulate in dev/mock mode
    if (sessionId?.startsWith("DEV-") || currentToken?.startsWith("MOCK-")) {
      setStepLoading("post", true);
      setTimeout(() => {
        setStep(4);
        setStepLoading("post", false);
        Alert.alert("Success", "Post meter reading saved!");
      }, 200);
      return;
    }

    setStepLoading("post", true);
    try {
      await msApi.submitPostReading({
        sessionId,
        reading: parseFloat(postReading),
      });

      setStep(4);
      Alert.alert("Success", "Post meter reading saved!");
    } catch (error) {
      Alert.alert("Error", error.message || "Network error occurred");
    } finally {
      setStepLoading("post", false);
    }
  };

  // ! CLEAR
  // API call for final confirmation and SAP posting
  const confirmAndPostToSAP = async () => {
    // Simulate in dev/mock mode
    if (sessionId?.startsWith("DEV-") || currentToken?.startsWith("MOCK-")) {
      setStepLoading("confirm", true);
      setTimeout(() => {
        Alert.alert(
          "Success",
          `Data posted to SAP successfully! Document: DEV-${Date.now()}`
        );
        setStepLoading("confirm", false);
        resetForm();
      }, 300);
      return;
    }

    setStepLoading("confirm", true);
    try {
      const data = await msApi.confirmAndPostToSAP({ sessionId });

      Alert.alert(
        "Success",
        `Data posted to SAP successfully! Document: ${data.sapDocument}`
      );
      // Reset form
      resetForm();
    } catch (error) {
      Alert.alert("Error", error.message || "Network error occurred");
    } finally {
      setStepLoading("confirm", false);
    }
  };

  // ! CLEAR
  const resetForm = () => {
    setTruckNumber("");
    setPreReading("");
    setPostReading("");
    setStep(1);
    setSessionId(null);
    // Keep token for next operation
  };

  //! CLEAR
  // Render a step card with title, content, and disabled state
  const renderStepCard = (stepNumber, title, children, isEnabled) => (
    <View style={[styles.card, !isEnabled && styles.disabledCard]}>
      <Text style={[styles.stepTitle, !isEnabled && styles.disabledText]}>
        {stepNumber}. {title}
      </Text>
      {children}
      {!isEnabled && (
        <Text style={styles.disabledMessage}>
          Complete previous step to unlock
        </Text>
      )}
    </View>
  );

  // ! CLEAR
  const canActOnArrival = useMemo(() => {
    return Boolean(
      effectiveAssignedTripId &&
        effectiveAssignedDriverId &&
        currentToken &&
        !loading.token
    );
  }, [
    effectiveAssignedTripId,
    effectiveAssignedDriverId,
    currentToken,
    loading.token,
  ]);

  // ! CLEAR
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            {/* <Text style={styles.title}>MS Operations</Text>
            <Text style={styles.subtitle}>
              Manage truck arrivals and meter readings
            </Text> */}
          </View>

          {/* Token Status */}
          <View style={styles.tokenStatus}>
            <View style={styles.tokenHeader}>
              <View style={styles.tokenIcon}>
                {loading.token ? (
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
                {loading.token
                  ? "Setting up token..."
                  : currentToken
                  ? `${
                      currentToken.startsWith("MOCK-") ? "Mock" : "Real"
                    } Token - Trip: ${tripId || effectiveAssignedTripId}`
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
                {!effectiveAssignedTripId && (
                  <Text style={styles.tokenWarning}>
                    Waiting for arrival assignment...
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Expo Go quick-test helper: allow enabling a dev assignment when notifications are limited */}
          {NotificationService.areNotificationsLimited() &&
            !assignedTripId &&
            !notifAssignment.tripId && (
              <View style={[styles.tokenStatus, styles.mockTokenStatus]}>
                <Text style={styles.tokenText}>Expo Go testing mode</Text>
                <Text style={styles.mockWarning}>
                  Push notifications are limited here. Tap below to enable a
                  temporary test assignment so you can run the MS flow.
                </Text>
                <AppButton
                  title={
                    devAssignmentEnabled
                      ? "Test assignment enabled"
                      : "Enable test assignment"
                  }
                  onPress={() => setDevAssignmentEnabled(true)}
                  disabled={devAssignmentEnabled}
                  variant={devAssignmentEnabled ? "success" : "primary"}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}

          {/* Step 1: Confirm Truck Arrival */}
          <View style={[styles.card, step !== 1 && styles.disabledCard]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="vehicle" size={16} color="#1e293b" />
              </View>
              <Text
                style={[styles.stepTitle, step !== 1 && styles.disabledText]}
              >
                Step 1: Confirm Truck Arrival
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Truck Number</Text>
              <AppTextField
                placeholder="Enter truck number"
                value={truckNumber}
                onChangeText={setTruckNumber}
                editable={step === 1 && canActOnArrival}
              />
            </View>
            <AppButton
              title={step > 1 ? "Arrival Confirmed" : "Confirm Arrival"}
              onPress={confirmTruckArrival}
              disabled={step !== 1 || loading.arrival || !canActOnArrival}
              loading={loading.arrival}
              variant={
                step > 1
                  ? "success"
                  : step === 1 && canActOnArrival
                  ? "primary"
                  : "neutral"
              }
            />
            {!canActOnArrival && step === 1 && (
              <Text style={styles.disabledMessage}>
                Arrival action will be enabled after an MS arrival notification
                assigns a trip to you.
              </Text>
            )}
          </View>

          {/* Step 2: Pre Meter Reading */}
          <View style={[styles.card, step < 2 && styles.disabledCard]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={[styles.stepTitle, step < 2 && styles.disabledText]}>
                Step 2: Pre Meter Reading
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pre Reading (Litres)</Text>
              <AppTextField
                placeholder="Enter pre meter reading"
                value={preReading}
                onChangeText={setPreReading}
                keyboardType="numeric"
                editable={step === 2}
              />
            </View>
            <AppButton
              title={step > 2 ? "Reading Saved" : "Submit Pre Reading"}
              onPress={submitPreReading}
              disabled={step !== 2 || loading.pre}
              loading={loading.pre}
              variant={
                step > 2 ? "success" : step === 2 ? "primary" : "neutral"
              }
            />
            {step < 2 && (
              <Text style={styles.disabledMessage}>
                Complete truck arrival confirmation to unlock this step.
              </Text>
            )}
          </View>

          {/* Step 3: Post Meter Reading */}
          <View style={[styles.card, step < 3 && styles.disabledCard]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="analytics" size={16} color="#1e293b" />
              </View>
              <Text style={[styles.stepTitle, step < 3 && styles.disabledText]}>
                Step 3: Post Meter Reading
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Post Reading (Litres)</Text>
              <AppTextField
                placeholder="Enter post meter reading"
                value={postReading}
                onChangeText={setPostReading}
                keyboardType="numeric"
                editable={step === 3}
              />
            </View>
            <AppButton
              title={step > 3 ? "Reading Saved" : "Submit Post Reading"}
              onPress={submitPostReading}
              disabled={step !== 3 || loading.post}
              loading={loading.post}
              variant={
                step > 3 ? "success" : step === 3 ? "primary" : "neutral"
              }
            />
            {step < 3 && (
              <Text style={styles.disabledMessage}>
                Complete pre meter reading to unlock this step.
              </Text>
            )}
          </View>

          {/* Step 4: Confirm and Post to SAP */}
          <View style={[styles.card, step < 4 && styles.disabledCard]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <AppIcon icon="check" size={16} color="#1e293b" />
              </View>
              <Text style={[styles.stepTitle, step < 4 && styles.disabledText]}>
                Step 4: Confirm & Post to SAP
              </Text>
            </View>
            <AppButton
              title="Confirm & Post to SAP"
              onPress={confirmAndPostToSAP}
              disabled={step !== 4 || loading.confirm}
              loading={loading.confirm}
              variant={step === 4 ? "success" : "neutral"}
            />
            {step < 4 && (
              <Text style={styles.disabledMessage}>
                Complete post meter reading to unlock this step.
              </Text>
            )}
          </View>

          {sessionId && (
            <View style={styles.sessionInfo}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionIcon}>
                  <AppIcon icon="info" size={12} color="#1e293b" />
                </View>
                <Text style={styles.sessionText}>Active Session</Text>
              </View>
              <Text style={styles.sessionSubtext}>Session ID: {sessionId}</Text>
              <Text style={styles.sessionSubtext}>
                Trip ID: {tripId || effectiveAssignedTripId}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
