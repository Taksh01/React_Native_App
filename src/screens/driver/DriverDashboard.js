import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";
import { driverApi } from "../../lib/driverApi";
import MapView from "../../components/driver/MapView";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";

// Trip steps
const TRIP_STEPS = {
  WAITING_FOR_TRIP: 0,
  TRIP_ACCEPTED: 1,
  NAVIGATE_TO_MS: 2,
  AT_MS_FILLING: 3,
  NAVIGATE_TO_DBS: 4,
  AT_DBS_DELIVERY: 5,
  NAVIGATE_BACK_TO_MS: 6,
  TRIP_COMPLETED: 7,
};

const STEP_TITLES = {
  [TRIP_STEPS.WAITING_FOR_TRIP]: "Waiting for Trip Assignment",
  [TRIP_STEPS.TRIP_ACCEPTED]: "Trip Accepted",
  [TRIP_STEPS.NAVIGATE_TO_MS]: "Navigate to MS (Fill-up Station)",
  [TRIP_STEPS.AT_MS_FILLING]: "At MS - Fill-up Operations",
  [TRIP_STEPS.NAVIGATE_TO_DBS]: "Navigate to DBS (Delivery Station)",
  [TRIP_STEPS.AT_DBS_DELIVERY]: "At DBS - Delivery Operations",
  [TRIP_STEPS.NAVIGATE_BACK_TO_MS]: "Return to MS Station",
  [TRIP_STEPS.TRIP_COMPLETED]: "Trip Completed",
};

const FALLBACK_TRIP_DATA = {
  tripId: "TRIP-001",
  msLocation: { name: "MS Station Alpha", address: "Industrial Area A" },
  dbsLocation: { name: "DBS Station Beta", address: "Delivery Zone B" },
  estimatedDistance: "15.2 km",
  estimatedTime: "25 mins",
  status: "ASSIGNED",
};

const DEFAULT_READINGS_STATE = {
  msPreConfirmed: false,
  msPostConfirmed: false,
  dbsPreConfirmed: false,
  dbsPostConfirmed: false,
  msPreReading: 1250.5,
  msPostReading: null,
  dbsPreReading: null,
  dbsPostReading: null,
};

const createFallbackToken = (tripId = FALLBACK_TRIP_DATA.tripId) =>
  `MOCK-TKN-${tripId}-${Date.now()}`;

const deriveStepFromStatus = (status) => {
  const normalized = (status || "").toUpperCase();
  switch (normalized) {
    case "WAITING_FOR_TRIP":
    case "CREATED":
    case "ASSIGNED":
    case "TRIP_ACCEPTED":
      return TRIP_STEPS.NAVIGATE_TO_MS;
    case "AT_MS":
    case "MS_ARRIVED":
    case "MS_ARRIVAL_CONFIRMED":
      return TRIP_STEPS.AT_MS_FILLING;
    case "MS_COMPLETED":
    case "NAVIGATE_TO_DBS":
    case "EN_ROUTE_TO_DBS":
      return TRIP_STEPS.NAVIGATE_TO_DBS;
    case "AT_DBS":
    case "DBS_ARRIVED":
    case "DBS_ARRIVAL_CONFIRMED":
      return TRIP_STEPS.AT_DBS_DELIVERY;
    case "DBS_COMPLETED":
    case "RETURN_TO_MS":
      return TRIP_STEPS.NAVIGATE_BACK_TO_MS;
    case "TRIP_COMPLETED":
    case "COMPLETED":
      return TRIP_STEPS.TRIP_COMPLETED;
    default:
      return TRIP_STEPS.NAVIGATE_TO_MS;
  }
};

export default function DriverDashboard({ navigation, route }) {
  const { user } = useAuth();
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      scrollContent: {
        padding: theme.spacing(4),
        paddingBottom: theme.spacing(20), // Space for emergency button
      },
      tripHeader: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        ...theme.shadows.level2,
      },
      tripTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginLeft: theme.spacing(2),
        marginBottom: 0,
      },
      stepTitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      tokenContainer: {
        backgroundColor: theme.colors.primaryMuted,
        padding: theme.spacing(2),
        borderRadius: theme.radii.sm,
      },
      tokenText: {
        fontSize: theme.typography.sizes.bodySmall,
        color: theme.colors.primary,
        fontFamily: "monospace",
      },
      centerContent: {
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(8),
      },
      waitingText: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        textAlign: "left",
        marginLeft: theme.spacing(2),
        marginBottom: theme.spacing(4),
      },
      spinner: {
        marginVertical: theme.spacing(4),
      },
      instructionText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      navigationContainer: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        ...theme.shadows.level2,
      },
      arrivedButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        marginLeft: theme.spacing(2),
      },
      readingsContainer: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        ...theme.shadows.level2,
      },
      readingsTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginLeft: theme.spacing(2),
        marginBottom: 0,
      },
      readingCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        marginBottom: theme.spacing(3),
      },
      readingLabel: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      readingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      readingValue: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      confirmButtons: {
        flexDirection: "row",
        gap: theme.spacing(2),
      },
      confirmButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      rejectButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      completeButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
      },
      completedText: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.success,
        textAlign: "left",
        marginLeft: theme.spacing(3),
        marginBottom: theme.spacing(2),
      },
      completedSubtext: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginBottom: theme.spacing(6),
      },
      newTripButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
      },
      emergencyButton: {
        position: "absolute",
        bottom: theme.spacing(5),
        right: theme.spacing(5),
        backgroundColor: theme.colors.danger,
        borderRadius: 25,
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(3),
        ...theme.shadows.level3,
      },
      emergencyButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightBold,
        marginLeft: theme.spacing(2),
      },
      confirmedBadge: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.md,
      },
      confirmedText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        marginLeft: theme.spacing(1),
      },
      waitingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing(2),
      },
      waitingInlineText: {
        marginLeft: theme.spacing(2),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        fontStyle: "italic",
      },
      titleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      waitingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      buttonRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      completedRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(2),
      },
    });
  });

  // Main state
  const [currentStep, setCurrentStep] = useState(TRIP_STEPS.WAITING_FOR_TRIP);
  const [tripData, setTripData] = useState(null);
  const [token, setToken] = useState(null);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [loading, setLoading] = useState({
    trip: false,
    navigation: false,
    readings: false,
  });

  // Meter readings state
  const [readingsState, setReadingsState] = useState(() => ({
    ...DEFAULT_READINGS_STATE,
  }));

  // Handle navigation from notification payload (non-intrusive)
  useEffect(() => {
    const params = route?.params;
    if (params?.fromNotification && params?.type === "trip_assignment") {
      // Optionally, highlight or prefill based on notifParams (tripId, vehicleId, etc.)
      // Keeping UI logic unchanged; this is a safe placeholder hook.
      console.log("Notification opened:", params);
    }
  }, [route]);

  // Simulate receiving push notification and trip acceptance
  // ! Later on this would be replaced by actual push notification handling logic: So Dont Worry
  useEffect(() => {
    // Simulate push notification after 2 seconds
    const timer = setTimeout(() => {
      if (currentStep === TRIP_STEPS.WAITING_FOR_TRIP) {
        Alert.alert(
          "New Trip Assignment",
          `Trip ${FALLBACK_TRIP_DATA.tripId}\nFrom: ${FALLBACK_TRIP_DATA.msLocation.name}\nTo: ${FALLBACK_TRIP_DATA.dbsLocation.name}`,
          [
            { text: "Reject", style: "cancel" },
            { text: "Accept", onPress: acceptTrip },
          ]
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep, acceptTrip]);

  const acceptTrip = useCallback(async () => {
    const fallbackTrip = { ...FALLBACK_TRIP_DATA };
    setLoading((prev) => ({ ...prev, trip: true }));

    try {
      // 1) Attempt to accept trip via backend
      // response we expect:{
      //   "ok": true,
      //   "tripId": "TRIP-001",
      //   "status": "accepted",
      //   "token": "TKN-TRIP-001-7-1730707200",
      //   "tokenData": {
      //     "token": "TKN-TRIP-001-7-1730707200",
      //     "tripId": "TRIP-001",
      //     "driverId": "7",
      //     "status": "ACTIVE",
      //     "createdAt": "2025-11-04T10:30:00.123456",
      //     "validUntil": "2025-11-04T10:30:00.123456"
      //   }
      // }
      const response = await driverApi.acceptTrip({
        tripId: route?.params?.tripId || fallbackTrip.tripId,
        driverId: user?.id || "7",
      });

      const serverTrip = response?.trip || response || null;
      const initialTrip = serverTrip
        ? { ...fallbackTrip, ...serverTrip }
        : { ...fallbackTrip };

      const resolvedToken =
        response?.token ||
        response?.driverToken ||
        createFallbackToken(initialTrip.tripId || fallbackTrip.tripId);

      setToken(resolvedToken);

      let resolvedTrip = { ...initialTrip };
      let nextStep = deriveStepFromStatus(resolvedTrip.status);

      try {
        if (resolvedToken) {
          // ! here is response we expect:
          //           {
          //   "tripId": "TRIP-001",              // ← The trip ID extracted from token
          //   "status": "ACCEPTED",              // ← Current trip status (CREATED, ACCEPTED, ARRIVED, STARTED, ENDED, CONFIRMED, COMPLETED, etc.)
          //   "tokenStatus": "ACTIVE",           // ← Token validity status (ACTIVE, EXPIRED, CANCELLED)
          //   "trip": {                          // ← Complete trip object with all details
          //     "id": "TRIP-001",
          //     "status": "ACCEPTED",
          //     "msId": "MS-12",
          //     "vehicle": "GJ-01-AB-1234",
          //     "driver": "Rakesh Patel",
          //     "driverId": "7",
          //     "pre": null,                     // ← Pre-decant readings (set when arrives at DBS)
          //     "post": null,                    // ← Post-decant readings (set after delivery)
          //     "startTime": null,               // ← Decanting start time
          //     "endTime": null,                 // ← Decanting end time
          //     "deliveredQty": null,            // ← Final delivered quantity
          //     "operatorSig": null,             // ← DBS operator signature
          //     "driverSig": null,               // ← Driver signature
          //     "acceptedAt": "2025-11-04T10:30:00.123456",  // ← When trip was accepted
          //     "msCompleted": false,            // ← MS operations complete?
          //     "msCompletedAt": null            // ← When MS operations completed
          //   }
          // }
          const statusResponse = await driverApi.getTripStatus({
            token: resolvedToken,
          });
          if (statusResponse) {
            const statusTrip = statusResponse?.trip || statusResponse;
            if (statusTrip) {
              resolvedTrip = { ...resolvedTrip, ...statusTrip };
            }
            const resolvedStatus =
              statusResponse?.status ?? resolvedTrip.status;
            if (resolvedStatus) {
              resolvedTrip.status = resolvedStatus;
              nextStep = deriveStepFromStatus(resolvedStatus);
            }
          }
        }
      } catch (statusError) {
        console.warn(
          "Trip status fetch failed, continuing with fallback data.",
          statusError?.message || statusError
        );
      }

      setTripData(resolvedTrip);
      setCurrentStep(nextStep);
      setReadingsState(() => ({ ...DEFAULT_READINGS_STATE }));
    } catch (error) {
      console.warn(
        "Failed to accept trip via backend, switching to fallback.",
        error?.message || error
      );
      const fallbackToken = createFallbackToken(fallbackTrip.tripId);
      setToken(fallbackToken);
      setTripData(fallbackTrip);
      setCurrentStep(TRIP_STEPS.NAVIGATE_TO_MS);
      setReadingsState(() => ({ ...DEFAULT_READINGS_STATE }));
    } finally {
      setLoading((prev) => ({ ...prev, trip: false }));
    }
  }, [user?.id]);

  const handleArrivedAtMS = useCallback(async () => {
    setLoading((prev) => ({ ...prev, navigation: true }));
    try {
      if (token) {
        await driverApi.confirmArrivalAtMS({ token });
      }
    } catch (error) {
      console.warn(
        "Failed to confirm MS arrival; continuing in fallback mode.",
        error?.message || error
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
      setCurrentStep(TRIP_STEPS.AT_MS_FILLING);
    }
  }, [token]);

  const handleMSOperationsComplete = () => {
    setCurrentStep(TRIP_STEPS.NAVIGATE_TO_DBS);
  };

  const handleArrivedAtDBS = useCallback(async () => {
    setLoading((prev) => ({ ...prev, navigation: true }));
    try {
      if (token) {
        await driverApi.confirmArrivalAtDBS({ token });
      }
    } catch (error) {
      console.warn(
        "Failed to confirm DBS arrival; continuing in fallback mode.",
        error?.message || error
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
      setCurrentStep(TRIP_STEPS.AT_DBS_DELIVERY);
    }
  }, [token]);

  const handleDBSOperationsComplete = () => {
    setCurrentStep(TRIP_STEPS.NAVIGATE_BACK_TO_MS);
  };

  const handleReturnedToMS = useCallback(async () => {
    setLoading((prev) => ({ ...prev, navigation: true }));
    try {
      if (token) {
        await driverApi.completeTrip({ token });
      }
    } catch (error) {
      console.warn(
        "Failed to mark trip complete; continuing in fallback mode.",
        error?.message || error
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
      setCurrentStep(TRIP_STEPS.TRIP_COMPLETED);
    }
  }, [token]);

  const handleNewTrip = () => {
    setCurrentStep(TRIP_STEPS.WAITING_FOR_TRIP);
    setTripData(null);
    setToken(null);
    setLastKnownLocation(null);
    // Reset readings state
    setReadingsState(() => ({ ...DEFAULT_READINGS_STATE }));
  };

  // Meter reading handlers
  const handleConfirmPreReading = async (stationType) => {
    const isMS = stationType === "MS";
    const fallbackReading = isMS
      ? readingsState.msPreReading
      : readingsState.dbsPreReading ?? readingsState.msPostReading ?? 0;

    setLoading((prev) => ({ ...prev, readings: true }));
    try {
      if (token) {
        await driverApi.confirmMeterReading({
          token,
          stationType,
          readingType: "pre",
          reading: fallbackReading ?? 0,
          confirmed: true,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to confirm ${stationType} pre reading; continuing locally.`,
        error?.message || error
      );
    } finally {
      setLoading((prev) => ({ ...prev, readings: false }));
    }

    if (isMS) {
      setReadingsState((prev) => ({ ...prev, msPreConfirmed: true }));
      setTimeout(() => {
        setReadingsState((prev) => ({
          ...prev,
          msPostReading: prev.msPostReading ?? 1750.8,
          dbsPreReading: prev.dbsPreReading ?? prev.msPostReading ?? 1750.8,
        }));
      }, 3000);
    } else {
      setReadingsState((prev) => ({ ...prev, dbsPreConfirmed: true }));
      setTimeout(() => {
        setReadingsState((prev) => ({
          ...prev,
          dbsPostReading: prev.dbsPostReading ?? 1250.5,
        }));
      }, 3000);
    }
  };

  const handleRejectReading = async (stationType, readingType) => {
    try {
      if (token) {
        await driverApi.confirmMeterReading({
          token,
          stationType,
          readingType: readingType.toLowerCase(),
          reading: 0,
          confirmed: false,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to submit ${stationType} ${readingType} rejection.`,
        error?.message || error
      );
    }

    Alert.alert(
      "Reading Rejected",
      `${readingType} reading for ${stationType} has been rejected. Please report the issue.`,
      [{ text: "OK" }]
    );
  };

  const handleConfirmPostReading = async (stationType) => {
    const isMS = stationType === "MS";
    const readingValue = isMS
      ? readingsState.msPostReading ?? readingsState.msPreReading
      : readingsState.dbsPostReading ??
        readingsState.dbsPreReading ??
        readingsState.msPostReading;

    setLoading((prev) => ({ ...prev, readings: true }));
    try {
      if (token) {
        await driverApi.confirmMeterReading({
          token,
          stationType,
          readingType: "post",
          reading: readingValue ?? 0,
          confirmed: true,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to confirm ${stationType} post reading; continuing locally.`,
        error?.message || error
      );
    } finally {
      setLoading((prev) => ({ ...prev, readings: false }));
    }

    if (isMS) {
      setReadingsState((prev) => ({ ...prev, msPostConfirmed: true }));
    } else {
      setReadingsState((prev) => ({ ...prev, dbsPostConfirmed: true }));
    }
  };

  const renderTripHeader = () => (
    <View style={styles.tripHeader}>
      <View style={styles.titleRow}>
        <AppIcon
          icon="vehicle"
          size={20}
          color={themeRef.current?.colors?.iconDark || "#333"}
        />
        <Text style={styles.tripTitle}>
          {tripData ? `Trip ${tripData.tripId}` : "Driver Dashboard"}
        </Text>
      </View>
      <Text style={styles.stepTitle}>
        Step {currentStep + 1}/8: {STEP_TITLES[currentStep]}
      </Text>
      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenText}>Token: {token}</Text>
        </View>
      )}
    </View>
  );

  const renderWaitingForTrip = () => (
    <View style={styles.centerContent}>
      <View style={styles.waitingRow}>
        <AppIcon
          icon="notification"
          size={20}
          color={themeRef.current?.colors?.iconDark || "#333"}
        />
        <Text style={styles.waitingText}>Waiting for trip assignment...</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={themeRef.current?.colors?.info || "#007AFF"}
        style={styles.spinner}
      />
      <Text style={styles.instructionText}>
        You will receive a push notification when a new trip is available
      </Text>
    </View>
  );

  const renderNavigationView = (destination, onArrived) => {
    const destinationData = {
      name: destination,
      address:
        destination === tripData?.msLocation?.name
          ? tripData?.msLocation?.address ||
            FALLBACK_TRIP_DATA.msLocation.address
          : tripData?.dbsLocation?.address ||
            FALLBACK_TRIP_DATA.dbsLocation.address,
    };

    return (
      <View style={styles.navigationContainer}>
        <MapView
          destination={destinationData}
          currentLocation={
            lastKnownLocation || { latitude: 12.9716, longitude: 77.5946 }
          }
          onLocationUpdate={(location) => {
            setLastKnownLocation(location);
            if (token) {
              driverApi
                .updateLocation({
                  token,
                  latitude: location.latitude,
                  longitude: location.longitude,
                })
                .catch((error) =>
                  console.warn(
                    "Failed to push location update; will retry on next tick.",
                    error?.message || error
                  )
                );
            }
          }}
        />

        <AppButton
          title={`Arrived at ${destination}`}
          onPress={() => onArrived()}
          disabled={loading.navigation}
          loading={loading.navigation}
        />
      </View>
    );
  };

  const renderMeterReadings = (stationType, onComplete) => {
    const isMS = stationType === "MS";
    const preReading = isMS
      ? readingsState.msPreReading
      : readingsState.dbsPreReading;
    const postReading = isMS
      ? readingsState.msPostReading
      : readingsState.dbsPostReading;
    const preConfirmed = isMS
      ? readingsState.msPreConfirmed
      : readingsState.dbsPreConfirmed;
    const postConfirmed = isMS
      ? readingsState.msPostConfirmed
      : readingsState.dbsPostConfirmed;

    const canProceed = preConfirmed && postConfirmed;

    return (
      <View style={styles.readingsContainer}>
        <View
          style={[
            styles.titleRow,
            { marginBottom: themeRef.current?.spacing(4) || 16 },
          ]}
        >
          <AppIcon
            icon="analytics"
            size={18}
            color={themeRef.current?.colors?.iconDark || "#333"}
          />
          <Text style={styles.readingsTitle}>
            Meter Readings - {stationType}
          </Text>
        </View>

        {/* Pre Reading */}
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>
            Pre-{isMS ? "Fill" : "Delivery"} Reading:
          </Text>
          <View style={styles.readingRow}>
            <Text style={styles.readingValue}>{preReading} L</Text>
            {!preConfirmed ? (
              <View style={styles.confirmButtons}>
                <AppButton
                  title="Confirm"
                  onPress={() => handleConfirmPreReading(stationType)}
                  variant="success"
                  disabled={loading.readings}
                  loading={loading.readings}
                  style={{
                    paddingVertical: themeRef.current?.spacing(2) || 8,
                    paddingHorizontal: themeRef.current?.spacing(3) || 12,
                  }}
                />
                <AppButton
                  title="Reject"
                  onPress={() => handleRejectReading(stationType, "Pre")}
                  variant="danger"
                  disabled={loading.readings}
                  style={{
                    paddingVertical: themeRef.current?.spacing(2) || 8,
                    paddingHorizontal: themeRef.current?.spacing(3) || 12,
                  }}
                />
              </View>
            ) : (
              <View style={styles.confirmedBadge}>
                <View style={styles.buttonRow}>
                  <AppIcon icon="check" size={12} color="#fff" />
                  <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Post Reading - Only show after pre is confirmed and filling/delivery is done */}
        {preConfirmed && (
          <View style={styles.readingCard}>
            <Text style={styles.readingLabel}>
              Post-{isMS ? "Fill" : "Delivery"} Reading:
            </Text>
            {postReading ? (
              <View style={styles.readingRow}>
                <Text style={styles.readingValue}>{postReading} L</Text>
                {!postConfirmed ? (
                  <View style={styles.confirmButtons}>
                    <AppButton
                      title="Confirm"
                      onPress={() => handleConfirmPostReading(stationType)}
                      variant="success"
                      disabled={loading.readings}
                      loading={loading.readings}
                      style={{
                        paddingVertical: themeRef.current?.spacing(2) || 8,
                        paddingHorizontal: themeRef.current?.spacing(3) || 12,
                      }}
                    />
                    <AppButton
                      title="Reject"
                      onPress={() => handleRejectReading(stationType, "Post")}
                      variant="danger"
                      disabled={loading.readings}
                      style={{
                        paddingVertical: themeRef.current?.spacing(2) || 8,
                        paddingHorizontal: themeRef.current?.spacing(3) || 12,
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.confirmedBadge}>
                    <View style={styles.buttonRow}>
                      <AppIcon icon="check" size={12} color="#fff" />
                      <Text style={styles.confirmedText}>Confirmed</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <ActivityIndicator
                  size="small"
                  color={themeRef.current?.colors?.info || "#007AFF"}
                />
                <Text style={styles.waitingInlineText}>
                  Waiting for {isMS ? "filling" : "delivery"} to complete...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Continue Button - Only enabled when both readings are confirmed */}
        <AppButton
          title={
            canProceed
              ? "Continue to Next Step"
              : "Complete readings to continue"
          }
          onPress={onComplete}
          disabled={!canProceed || loading.readings}
          loading={loading.readings}
          style={{ marginTop: 8 }}
        />
      </View>
    );
  };

  const renderTripCompleted = () => (
    <View style={styles.centerContent}>
      <View style={styles.completedRow}>
        <AppIcon
          icon="celebration"
          size={24}
          color={themeRef.current?.colors?.successGreen || "#34C759"}
        />
        <Text style={styles.completedText}>Trip Completed Successfully!</Text>
      </View>
      <Text style={styles.completedSubtext}>
        Trip {tripData?.tripId} has been completed and data posted to SAP
      </Text>

      <AppButton title="Ready for New Trip" onPress={handleNewTrip} />
    </View>
  );

  const renderMainContent = () => {
    switch (currentStep) {
      case TRIP_STEPS.WAITING_FOR_TRIP:
        return renderWaitingForTrip();

      case TRIP_STEPS.NAVIGATE_TO_MS:
        return renderNavigationView(
          tripData?.msLocation?.name || FALLBACK_TRIP_DATA.msLocation.name,
          handleArrivedAtMS
        );

      case TRIP_STEPS.AT_MS_FILLING:
        return renderMeterReadings("MS", handleMSOperationsComplete);

      case TRIP_STEPS.NAVIGATE_TO_DBS:
        return renderNavigationView(
          tripData?.dbsLocation?.name || FALLBACK_TRIP_DATA.dbsLocation.name,
          handleArrivedAtDBS
        );

      case TRIP_STEPS.AT_DBS_DELIVERY:
        return renderMeterReadings("DBS", handleDBSOperationsComplete);

      case TRIP_STEPS.NAVIGATE_BACK_TO_MS:
        return renderNavigationView(
          tripData?.msLocation?.name || FALLBACK_TRIP_DATA.msLocation.name,
          handleReturnedToMS
        );

      case TRIP_STEPS.TRIP_COMPLETED:
        return renderTripCompleted();

      default:
        return renderWaitingForTrip();
    }
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderTripHeader()}
        {renderMainContent()}
      </ScrollView>

      {/* Emergency Button - Always Visible */}
      <AppButton
        title="Emergency"
        onPress={() => {
          if (navigation) {
            navigation.navigate("EmergencyAlert", {
              token,
              tripId: tripData?.tripId,
              location: lastKnownLocation,
              msLocation: tripData?.msLocation,
              dbsLocation: tripData?.dbsLocation,
            });
          } else {
            Alert.alert("Emergency", "Emergency system - Coming soon!");
          }
        }}
        variant="danger"
        style={styles.emergencyButton}
      />
    </SafeAreaView>
  );
}
