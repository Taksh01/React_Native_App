import React, { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";
import { driverApi } from "../../lib/driverApi";
import MapView from "../../components/driver/MapView";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import logBase64 from "../../utils/logBase64";
import { useThemedStyles } from "../../theme";
import * as ImagePicker from "expo-image-picker";
import { TRIP_STATUS } from "../../config/tripStatus";

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

// Fallback data removed

const DEFAULT_READINGS_STATE = {
  msPreConfirmed: false,
  msPostConfirmed: false,
  dbsPreConfirmed: false,
  dbsPostConfirmed: false,
  msPreReading: 1250.5,
  msPostReading: null,
  dbsPreReading: null,
  dbsPostReading: null,
  // store base64 photos for each reading
  msPrePhotoBase64: null,
  msPostPhotoBase64: null,
  dbsPrePhotoBase64: null,
  dbsPostPhotoBase64: null,
};

// Mock token generation removed

const deriveStepFromStatus = (status) => {
  const normalized = (status || "").toUpperCase();
  switch (normalized) {
    case TRIP_STATUS.PENDING:
    case "WAITING_FOR_TRIP":
    case "CREATED":
    case "ASSIGNED":
    case "TRIP_ACCEPTED":
      return TRIP_STEPS.NAVIGATE_TO_MS;
    case TRIP_STATUS.AT_MS:
    case "MS_ARRIVED":
    case "MS_ARRIVAL_CONFIRMED":
      return TRIP_STEPS.AT_MS_FILLING;
    case TRIP_STATUS.IN_TRANSIT:
    case "MS_COMPLETED":
    case "NAVIGATE_TO_DBS":
    case "EN_ROUTE_TO_DBS":
      return TRIP_STEPS.NAVIGATE_TO_DBS;
    case TRIP_STATUS.AT_DBS:
    case "DBS_ARRIVED":
    case "DBS_ARRIVAL_CONFIRMED":
      return TRIP_STEPS.AT_DBS_DELIVERY;
    case TRIP_STATUS.DECANTING_CONFIRMED:
    case "DBS_COMPLETED":
    case "RETURN_TO_MS":
      return TRIP_STEPS.NAVIGATE_BACK_TO_MS;
    case TRIP_STATUS.COMPLETED:
    case "TRIP_COMPLETED":
      return TRIP_STEPS.TRIP_COMPLETED;
    case TRIP_STATUS.CANCELLED:
      return TRIP_STEPS.WAITING_FOR_TRIP; // Reset if cancelled
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

  // Camera state
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraContext, setCameraContext] = useState({
    stationType: null,
    readingType: null,
  });

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Load persisted token on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("current_trip_token");
        if (storedToken && mounted) {

          setToken(storedToken);
        }
      } catch (e) {
        console.warn("Failed to load persisted token", e);
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (mounted) setHasCameraPermission(status === "granted");
      } catch (e) {
        if (mounted) setHasCameraPermission(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleOpenCamera = async (stationType, readingType) => {
    setCameraContext({ stationType, readingType });
    // prevent retake if already captured
    const existingKey = `${stationType.toLowerCase()}${
      readingType.charAt(0).toUpperCase() + readingType.slice(1)
    }PhotoBase64`;
    if (readingsState[existingKey]) {
      Alert.alert(
        "Photo already captured",
        "You have already taken a photo for this reading."
      );
      return;
    }
    // Permission guard
    if (hasCameraPermission === false) {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access in your device settings."
      );
      return;
    }

    try {
      setLoading((p) => ({ ...p, readings: true }));
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.6,
      });

      // Newer ImagePicker API: `canceled` boolean and `assets` array
      if (result.canceled) {
        // user cancelled
        return;
      }

      const asset = result.assets && result.assets[0];
      if (!asset) {
        console.warn("ImagePicker returned no assets");
        Alert.alert("Camera", "No image returned from camera.");
        return;
      }

      if (asset.base64) {
        const b64 = asset.base64;
        setReadingsState((prev) => {
          const key = `${stationType.toLowerCase()}${
            readingType.charAt(0).toUpperCase() + readingType.slice(1)
          }PhotoBase64`;
          // Log a short preview to Metro terminal via helper
          try {
            logBase64(key, b64, 200);
          } catch (logErr) {
            console.warn(
              "Failed to run base64 logger",
              logErr?.message || logErr
            );
          }
          return { ...prev, [key]: b64 };
        });
      } else {
        console.warn("ImagePicker returned asset without base64.");
        Alert.alert(
          "Camera",
          "Photo captured but base64 not available on this device."
        );
      }
    } catch (e) {
      console.warn("Camera launch failed", e?.message || e);
      Alert.alert("Camera", "Failed to open camera.");
    } finally {
      setLoading((p) => ({ ...p, readings: false }));
    }
  };




  // Handle navigation from notification payload (non-intrusive)
  // We use useFocusEffect to ensure this checks every time the screen becomes active
  useFocusEffect(
    useCallback(() => {

      
      // 1. Check route params
      const params = route?.params;
      if (params?.fromNotification && params?.tripId) {

        
        // If explicitly opened from notification, we should show it even if step is loading
        // But we should still check if we are already in a trip (step > 0) to avoid conflict
        // If currentStep is undefined (loading), we allow it.
        if (currentStep === undefined || currentStep === TRIP_STEPS.WAITING_FOR_TRIP) {
          const tripInfo = {
            tripId: params.tripId,
            msId: params.msId,
            dbsId: params.dbsId,
            vehicleId: params.vehicleId,
            ...params,
          };
          // Clear params to prevent loop
          navigation.setParams({ fromNotification: undefined, tripId: undefined });
          showTripAssignmentAlert(tripInfo);
          return;
        } else {
           console.warn("[DriverDashboard] Notification ignored because driver is busy. Step:", currentStep);
        }
      }

      // 2. Check NotificationService last event
      const NotificationService = require("../../services/NotificationService").default;
      const lastEvent = NotificationService.getLastEvent("trip_assignment");
      
      if (lastEvent?.tripId) {

        if (currentStep === undefined || currentStep === TRIP_STEPS.WAITING_FOR_TRIP) {
          showTripAssignmentAlert(lastEvent);
          NotificationService.clearLastEvent("trip_assignment");
        }
      }
    }, [route?.params, currentStep, showTripAssignmentAlert, navigation])
  );

  // State to hold pending trip data from notification
  const [pendingTripData, setPendingTripData] = useState(null);

  // Track locally rejected trips to prevent zombie notifications
  // Map of tripId -> timestamp
  const rejectedTripIds = useRef(new Map());

  // Show trip assignment alert
  const showTripAssignmentAlert = useCallback((tripInfo) => {

    // Check if we are already processing this trip (Alert shown or Modal open)
    if (pendingTripData && pendingTripData.tripId === tripInfo.tripId) {

      return;
    }

    setPendingTripData(tripInfo);
    
    const fromText = tripInfo.msId ? `From: ${tripInfo.msId}\n` : "";
    const quantityText = tripInfo.quantity ? `\nQty: ${tripInfo.quantity}` : "";
    const priorityText = tripInfo.priority ? `\nPriority: ${tripInfo.priority}` : "";
    
    Alert.alert(
      "New Trip Assignment",
      `Stock Request Id: ${tripInfo.tripId}\n${fromText}To: ${tripInfo.dbsId || "N/A"}${quantityText}${priorityText}`,
      [
        { 
          text: "Reject", 
          style: "cancel",
          onPress: () => {
            // Close alert and open modal
            setShowRejectModal(true);
          },
        },
        { 
          text: "Accept", 
          onPress: () => acceptTrip(tripInfo)
        },
      ],
      { cancelable: false }
    );
  }, [acceptTrip, pendingTripData]); // Added pendingTripData dependency

  const handleRejectSubmit = async () => {

    if (!pendingTripData) {
      console.warn("[DriverDashboard] No pending trip data to reject");
      setShowRejectModal(false); // Ensure modal closes even if no data
      return;
    }
    
    const tripIdToReject = pendingTripData.tripId;
    setLoading((prev) => ({ ...prev, trip: true }));
    
    try {

      
      // Add to rejected set immediately to prevent re-alerts
      // rejectedTripIds.current.set(tripIdToReject, Date.now());
      
      await driverApi.rejectTrip({
        tripId: tripIdToReject,
        reason: rejectReason || "Driver declined",
      });

      
      setPendingTripData(null);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject trip:", error);
      // If failed, remove from rejected set so they can try again
      // rejectedTripIds.current.delete(tripIdToReject);
      Alert.alert("Error", "Failed to reject trip. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, trip: false }));
    }
  };

  // Listen for trip_assignment notifications from NotificationService (Foreground)
  useEffect(() => {
    const NotificationService = require("../../services/NotificationService").default;
    
    const handleTripAssignment = (data) => {

      if (currentStep === TRIP_STEPS.WAITING_FOR_TRIP && data?.tripId) {
        
        // Clear the event from service so useFocusEffect doesn't pick it up again
        NotificationService.clearLastEvent("trip_assignment");
        
        showTripAssignmentAlert(data);
      } else {

      }
    };

    const unsubscribe = NotificationService.addListener(
      "trip_assignment",
      handleTripAssignment
    );

    return () => unsubscribe();
  }, [currentStep, showTripAssignmentAlert]);


  const acceptTrip = useCallback(async (tripInfo = null) => {
    // Use tripInfo from notification or fallback to route params
    const tripData = tripInfo || pendingTripData || route?.params || {};
    const tripId = tripData.tripId;
    

    
    setLoading((prev) => ({ ...prev, trip: true }));
    setPendingTripData(null); // Clear pending data

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
        tripId: tripId,
      });

      const serverTrip = response?.trip || response || null;
      
      // Build trip data from notification + server response
      const initialTrip = {
        tripId: tripId,
        msLocation: { name: tripData.msId || "MS Station", address: "Loading..." },
        dbsLocation: { name: tripData.dbsId || "DBS Station", address: "Loading..." },
        estimatedDistance: "Calculating...",
        estimatedTime: "Calculating...",
        status: "ASSIGNED",
        ...tripData,
        ...serverTrip,
      };

      const resolvedToken =
        response?.driverToken;

      setToken(resolvedToken);
      
      // Persist token
      if (resolvedToken) {
        AsyncStorage.setItem("current_trip_token", resolvedToken).catch(e => 
          console.warn("Failed to persist token", e)
        );
      }

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
      console.error(
        "[DriverDashboard] Failed to accept trip:",
        error?.message || error
      );
      Alert.alert(
        "Failed to Accept Trip",
        "Could not connect to server. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, trip: false }));
    }
  }, [user?.id, pendingTripData, route?.params]);

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
    
    // Clear persisted token
    AsyncStorage.removeItem("current_trip_token").catch(e =>
      console.warn("Failed to clear persisted token", e)
    );
  };

  // Meter reading handlers
  const handleConfirmPreReading = async (stationType) => {
    const isMS = stationType === "MS";
    const fallbackReading = isMS
      ? readingsState.msPreReading
      : readingsState.dbsPreReading ?? readingsState.msPostReading ?? 0;

    // Require photo before allowing confirmation
    const photoKey = isMS ? "msPrePhotoBase64" : "dbsPrePhotoBase64";
    if (!readingsState[photoKey]) {
      Alert.alert(
        "Photo Required",
        "Please take a photo before confirming the pre reading.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading((prev) => ({ ...prev, readings: true }));
    try {
      if (token) {
        await driverApi.confirmMeterReading({
          token,
          stationType,
          readingType: "pre",
          reading: fallbackReading ?? 0,
          confirmed: true,
          photoBase64: isMS
            ? readingsState.msPrePhotoBase64
            : readingsState.dbsPrePhotoBase64,
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

    // Require photo before allowing confirmation
    const photoKey = isMS ? "msPostPhotoBase64" : "dbsPostPhotoBase64";
    if (!readingsState[photoKey]) {
      Alert.alert(
        "Photo Required",
        "Please take a photo before confirming the post reading.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading((prev) => ({ ...prev, readings: true }));
    try {
      if (token) {
        await driverApi.confirmMeterReading({
          token,
          stationType,
          readingType: "post",
          reading: readingValue ?? 0,
          confirmed: true,
          photoBase64: isMS
            ? readingsState.msPostPhotoBase64
            : readingsState.dbsPostPhotoBase64,
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
          ? tripData?.msLocation?.address
          : tripData?.dbsLocation?.address,
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
            <Text style={styles.readingValue}>{preReading} </Text>
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
                {/* Camera button: disabled after capture */}
                {(() => {
                  const preKey = isMS
                    ? "msPrePhotoBase64"
                    : "dbsPrePhotoBase64";
                  const hasPhoto = !!readingsState[preKey];
                  if (hasPhoto) {
                    return (
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          marginLeft: themeRef.current?.spacing(2) || 8,
                          width: 44,
                        }}
                      >
                        <AppIcon
                          icon="camera"
                          size={20}
                          color={themeRef.current?.colors?.iconDark || "#333"}
                          style={{ opacity: 0.35 }}
                        />
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      onPress={() => handleOpenCamera(stationType, "pre")}
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: themeRef.current?.spacing(2) || 8,
                        width: 44,
                      }}
                    >
                      <AppIcon
                        icon="camera"
                        size={20}
                        color={themeRef.current?.colors?.iconDark || "#333"}
                      />
                    </TouchableOpacity>
                  );
                })()}
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
                <Text style={styles.readingValue}>{postReading} </Text>
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
                    {(() => {
                      const postKey = isMS
                        ? "msPostPhotoBase64"
                        : "dbsPostPhotoBase64";
                      const hasPostPhoto = !!readingsState[postKey];
                      if (hasPostPhoto) {
                        return (
                          <View
                            style={{
                              justifyContent: "center",
                              alignItems: "center",
                              marginLeft: themeRef.current?.spacing(2) || 8,
                              width: 44,
                            }}
                          >
                            <AppIcon
                              icon="camera"
                              size={20}
                              color={
                                themeRef.current?.colors?.iconDark || "#333"
                              }
                              style={{ opacity: 0.35 }}
                            />
                          </View>
                        );
                      }
                      return (
                        <TouchableOpacity
                          onPress={() => handleOpenCamera(stationType, "post")}
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            marginLeft: themeRef.current?.spacing(2) || 8,
                            width: 44,
                          }}
                        >
                          <AppIcon
                            icon="camera"
                            size={20}
                            color={themeRef.current?.colors?.iconDark || "#333"}
                          />
                        </TouchableOpacity>
                      );
                    })()}
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
          tripData?.msLocation?.name,
          handleArrivedAtMS
        );

      case TRIP_STEPS.AT_MS_FILLING:
        return renderMeterReadings("MS", handleMSOperationsComplete);

      case TRIP_STEPS.NAVIGATE_TO_DBS:
        return renderNavigationView(
          tripData?.dbsLocation?.name,
          handleArrivedAtDBS
        );

      case TRIP_STEPS.AT_DBS_DELIVERY:
        return renderMeterReadings("DBS", handleDBSOperationsComplete);

      case TRIP_STEPS.NAVIGATE_BACK_TO_MS:
        return renderNavigationView(
          tripData?.msLocation?.name,
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

      {/* Camera now uses expo-image-picker via `handleOpenCamera` */}

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

      {/* Rejection Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: themeRef.current?.colors?.surfaceElevated || "#fff",
              borderRadius: 12,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 12,
                color: themeRef.current?.colors?.textPrimary || "#000",
              }}
            >
              Reject Trip
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: themeRef.current?.colors?.textSecondary || "#666",
                marginBottom: 16,
              }}
            >
              Please provide a reason for rejecting this trip assignment.
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: themeRef.current?.colors?.borderSubtle || "#ccc",
                borderRadius: 8,
                padding: 12,
                minHeight: 100,
                textAlignVertical: "top",
                marginBottom: 20,
                fontSize: 16,
                color: themeRef.current?.colors?.textPrimary || "#000",
              }}
              placeholder="Enter reason (e.g., Vehicle breakdown, Unwell)..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  // Keep pendingTripData so they can decide again
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: themeRef.current?.colors?.borderSubtle || "#ccc",
                }}
              >
                <Text style={{ fontWeight: "600", color: themeRef.current?.colors?.textSecondary || "#666" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleRejectSubmit}
                disabled={!rejectReason.trim() || loading.trip}
                style={{
                  backgroundColor: themeRef.current?.colors?.danger || "#dc2626",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  opacity: (!rejectReason.trim() || loading.trip) ? 0.5 : 1,
                }}
              >
                {loading.trip ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontWeight: "600", color: "#fff" }}>Reject Trip</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
