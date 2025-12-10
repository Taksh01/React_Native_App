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
import WebSocketService from "../../services/WebSocketService";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

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
  msPreReading: null,
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

  // Helper to map backend integer steps (0-7) to frontend TRIP_STEPS
const mapBackendStepToFrontend = (backendStep) => {
  switch (backendStep) {
    case 0: return TRIP_STEPS.WAITING_FOR_TRIP; // 0
    case 1: return TRIP_STEPS.NAVIGATE_TO_MS;   // 2 (Skip 1, go straight to nav)
    case 2: return TRIP_STEPS.AT_MS_FILLING;    // 3 (Arrived = Start Filling UI)
    case 3: return TRIP_STEPS.AT_MS_FILLING;    // 3
    case 4: return TRIP_STEPS.NAVIGATE_TO_DBS;  // 4
    case 5: return TRIP_STEPS.AT_DBS_DELIVERY;  // 5
    case 6: return TRIP_STEPS.NAVIGATE_BACK_TO_MS; // 6
    case 7: return TRIP_STEPS.TRIP_COMPLETED;   // 7
    default: return TRIP_STEPS.WAITING_FOR_TRIP;
  }
};

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
  useScreenPermissionSync("DriverDashboard");
  const { user, token: authToken } = useAuth();
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
        console.log("[DriverDashboard] Loaded stored token:", storedToken);
        
        if (storedToken && mounted) {
          setToken(storedToken);
          // Note: Socket connection is handled by the auth token effect below
        } else {
            console.log("[DriverDashboard] No stored token found");
        }
      } catch (e) {
        console.warn("Failed to load persisted token", e);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Sync socket with Auth Token changes (Login/Logout)
  useEffect(() => {
    if (authToken) {
      WebSocketService.connect(authToken);
    } else {
      WebSocketService.disconnect();
    }
  }, [authToken]);

  // WebSocket Event Listeners
  useEffect(() => {
    if (!authToken) return;

    // 1. MS START
    const onMsStart = (e) => {
      // Just notify driver that filling is in progress (optional Toast or visual)
      console.log("WS: Filling Started", e);
      console.log("WS PAYLOAD [MS_FILL_START]:", JSON.stringify(e, null, 2));
      
      // Validate Trip ID if present
      const currentTripId = tripData?.tripId || pendingTripData?.tripId;
      console.log(`[WS DEBUG] Checking MS_FILL_START: Event Trip=${e.trip_id}, App Trip=${currentTripId}`);
      
      if (e.trip_id && currentTripId && String(e.trip_id) !== String(currentTripId)) {
        console.warn(`[WS] Ignored MS_FILL_START for different trip: ${e.trip_id} vs ${currentTripId}`);
        return;
      }

      // Ensure we are in correct step
      if (currentStep === TRIP_STEPS.AT_MS_FILLING) {
         // Auto-fill available pre-readings if sent
         if (e.prefill_reading) {
             setReadingsState(prev => ({
                 ...prev,
                 msPreReading: e.prefill_reading
             }));
         }
      }
    };

    // 2. MS END
    const onMsEnd = (e) => {
       console.log("WS: Filling Ended", e);
       console.log("WS PAYLOAD [MS_FILL_END]:", JSON.stringify(e, null, 2));

       // Validate Trip ID
       const currentTripId = tripData?.tripId || pendingTripData?.tripId;
       console.log(`[WS DEBUG] Checking MS_FILL_END: Event Trip=${e.trip_id}, App Trip=${currentTripId}`);

       if (e.trip_id && currentTripId && String(e.trip_id) !== String(currentTripId)) {
         console.warn(`[WS] Ignored MS_FILL_END for different trip: ${e.trip_id} vs ${currentTripId}`);
         return;
       }

       if (currentStep === TRIP_STEPS.AT_MS_FILLING) {
           // Auto-fill post readings
           setReadingsState(prev => ({
               ...prev,
               msPostReading: e.postfill_reading,
               // We might also want to show the Qty filled if we had a UI for it
           }));
          //  Alert.alert("Available Stock", `Operator finished filling.\nQty: ${e.filled_qty}\nFinal Reading: ${e.postfill_reading}`);
       }
    };

    // 3. DBS START
    const onDbsStart = (e) => {
        console.log("WS: Decanting Started", e);
        console.log("WS PAYLOAD [DBS_DECANT_START]:", JSON.stringify(e, null, 2));
        console.log("WS Payload pre_decant_reading:", e.pre_decant_reading);

        // Validate Trip ID
        const currentTripId = tripData?.tripId || pendingTripData?.tripId;
        console.log(`[WS DEBUG] Checking DBS_DECANT_START: Event Trip=${e.trip_id}, App Trip=${currentTripId}`);

        if (e.trip_id && currentTripId && String(e.trip_id) !== String(currentTripId)) {
          console.warn(`[WS] Ignored DBS_DECANT_START for different trip: ${e.trip_id} vs ${currentTripId}`);
          return;
        }

        // Always update state if trip matches, regardless of step
        // This ensures if driver is slightly behind (Navigating), the data is ready when they arrive
        if (e.pre_decant_reading) {
             setReadingsState(prev => ({
                 ...prev,
                 dbsPreReading: e.pre_decant_reading,
             }));
        }
    };

    // 4. DBS END
    const onDbsEnd = (e) => {
        console.log("WS: Decanting Ended", e);
        console.log("WS PAYLOAD [DBS_DECANT_END]:", JSON.stringify(e, null, 2));

        // Validate Trip ID
        const currentTripId = tripData?.tripId || pendingTripData?.tripId;
        console.log(`[WS DEBUG] Checking DBS_DECANT_END: Event Trip=${e.trip_id}, App Trip=${currentTripId}`);

        if (e.trip_id && currentTripId && String(e.trip_id) !== String(currentTripId)) {
          console.warn(`[WS] Ignored DBS_DECANT_END for different trip: ${e.trip_id} vs ${currentTripId}`);
          return;
        }

        // Always update state if trip matches
        if (e.post_decant_reading) {
             setReadingsState(prev => ({
                 ...prev,
                 dbsPostReading: e.post_decant_reading
             }));
             
             // Only alert if we are actually at the DBS step or completed
             if (currentStep === TRIP_STEPS.AT_DBS_DELIVERY || currentStep === TRIP_STEPS.TRIP_COMPLETED) {
                //  Alert.alert("Decanting Finished", `Operator finished decanting.\nFinal Reading: ${e.post_decant_reading}`);
             }
        }
    };

    // Subscribe
    const unsubMsStart = WebSocketService.on("MS_FILL_START", onMsStart);
    const unsubMsEnd = WebSocketService.on("MS_FILL_END", onMsEnd);
    const unsubDbsStart = WebSocketService.on("DBS_DECANT_START", onDbsStart);
    const unsubDbsEnd = WebSocketService.on("DBS_DECANT_END", onDbsEnd);

    return () => {
        unsubMsStart();
        unsubMsEnd();
        unsubDbsStart();
        unsubDbsEnd();
    };

  }, [authToken, currentStep, tripData, pendingTripData]);

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

      const checkPendingOffers = async () => {
        // Only check if we are waiting for a trip and have a token (user is logged in)
        // Note: 'token' here refers to trip token, 'authToken' is the user session. 
        // We need 'authToken' to call the API.
        if (currentStep !== TRIP_STEPS.WAITING_FOR_TRIP) {
            // Even if we are in a trip, we might want to refresh data in background?
            // For now, let's allow re-checking if we think we are waiting, 
            // OR if we want to ensure persistence matches.
            // But the 'checkPendingOffers' name implies looking for NEW ones.
            // We need a separate check for "Current Trip Restoration".
             return;
        }

        try {
            console.log("[DriverDashboard] checkPendingOffers: Calling driverApi.getPendingOffers()...");
            const data = await driverApi.getPendingOffers();
            console.log("[DriverDashboard] checkPendingOffers response data:", JSON.stringify(data, null, 2));
            
            if (data?.pending_offers?.length > 0) {
                const offer = data.pending_offers[0];
                console.log("[DriverDashboard] Found pending offer:", offer);
                
                // Format directly for showTripAssignmentAlert
                // We map backend response fields to what our alert expects
                const tripInfo = {
                    tripId: offer.stock_request_id, // Important: Use stock_request_id as tripId for acceptance
                    stock_request_id: offer.stock_request_id,
                    dbsId: offer.dbs?.name || "Unknown DBS",
                    msId: offer.ms?.name || "Unknown MS",
                    quantity: offer.quantity_kg ? `${offer.quantity_kg}` : null,
                    priority: offer.priority,
                    ...offer
                };
                
                showTripAssignmentAlert(tripInfo);
            } else {
                console.log("[DriverDashboard] No pending offers found in response.");
            }
        } catch (error) {
            console.warn("[DriverDashboard] Error checking pending offers:", error);
        }
      };

      // 1. Restore State from Backend (Persistence)
      const restoreTripState = async () => {
          console.log("[DriverDashboard] restoreTripState() execution started.");
          
          if (!authToken) {
             console.log("[DriverDashboard] restoreTripState aborted: No authToken available.");
             return false;
          }

          try {
              let currentTripToken = token;
              if (!currentTripToken) {
                  currentTripToken = await AsyncStorage.getItem("current_trip_token");
              }
              console.log("[DriverDashboard] Calling driverApi.resumeTrip() with token:", currentTripToken);
              const response = await driverApi.resumeTrip({ token: currentTripToken });
              
              console.log("[DriverDashboard] resumeTrip response:", JSON.stringify(response, null, 2));

              if (response && response.hasActiveTrip && response.trip) {
                  const trip = response.trip;
                  console.log(`[DriverDashboard] Active trip found! Trip ID: ${trip.id}, Status: ${trip.status}`);
                  
                  // Restore Token
                  if (trip.token) {
                      console.log("[DriverDashboard] Restoring token:", trip.token);
                      setToken(trip.token);
                      AsyncStorage.setItem("current_trip_token", trip.token).catch(console.warn);
                  } else {
                      console.warn("[DriverDashboard] Active trip found but NO TOKEN in response!");
                  }

                  // Restore Trip Data
                  const restoredTripData = {
                      tripId: trip.id,
                      stockRequestId: trip.tripDetails?.stockRequestId,
                      status: trip.status,
                      msLocation: trip.tripDetails?.ms,
                      dbsLocation: trip.tripDetails?.dbs,
                      vehicle: trip.tripDetails?.vehicle,
                      ...trip.tripDetails 
                  };
                  console.log("[DriverDashboard] Setting tripData:", JSON.stringify(restoredTripData, null, 2));
                  setTripData(restoredTripData);

                  // Restore Readings Step Data
                  // Check confirmation flags from 'stepData' if available, or infer from data
                  const stepData = trip.stepData || {};

                  if (trip.msFillingData) {
                      console.log("[DriverDashboard] Restoring msFillingData:", trip.msFillingData);
                      
                      setReadingsState(prev => ({
                          ...prev,
                          // MS Pre
                          msPreReading: trip.msFillingData.prefill_mfm, 
                          msPreConfirmed: stepData.ms_pre_reading_done && stepData.ms_pre_photo_uploaded,
                          
                          // MS Post
                          msPostReading: trip.msFillingData.postfill_mfm,
                          msPostConfirmed: stepData.ms_filling_complete && stepData.ms_post_photo_uploaded,

                          // If photos are present in response (URLs), we might want to flag them as done?
                          // For now, if confirmed is true, UI usually hides the photo button or shows checking state.
                          // But if we need to show the image, we'd need to fetch it (not implemented yet).
                          // Just ensuring 'Confirmed' state is restored prevents the "Confirm" button from showing again.
                      }));
                      
                  }

                  // Also handle DBS data if present
                  // Also handle DBS data if present
                  if (trip.dbsDecantingData) {
                       console.log("DEBUG: DBS DATA CHECK entered", trip.dbsDecantingData);
                           setReadingsState(prev => ({
                              ...prev,
                              dbsPreReading: trip.dbsDecantingData.pre_dec_reading,
                              dbsPreConfirmed: stepData.dbs_pre_reading_done && stepData.dbs_pre_photo_uploaded,
                              
                              dbsPostReading: trip.dbsDecantingData.post_dec_reading,
                              dbsPostConfirmed: stepData.dbs_decanting_complete && stepData.dbs_post_photo_uploaded,
                           }));
                      }


                  // Restore UI Step
                  let restoredStep = TRIP_STEPS.WAITING_FOR_TRIP;
                  
                  if (trip.currentStep !== undefined && trip.currentStep !== null) {
                      restoredStep = mapBackendStepToFrontend(trip.currentStep);
                      console.log(`[DriverDashboard] Mapped Backend Step ${trip.currentStep} -> Frontend Step ${restoredStep}`);
                  } else {
                      restoredStep = deriveStepFromStatus(trip.status);
                      console.log(`[DriverDashboard] Derived Frontend Step ${restoredStep} from Status ${trip.status}`);
                  }
                  
                  console.log("[DriverDashboard] Setting currentStep to:", restoredStep);
                  setCurrentStep(restoredStep);
                  return true; // Found and restored trip

              } else {
                  console.log("[DriverDashboard] resumeTrip result: No active trip logic triggered (hasActiveTrip is false or trip is null).");
                  return false;
              }
          } catch (e) {
              console.warn("[DriverDashboard] restoreTripState failed/error:", e);
              return false;
          }
      };

      // Execute restoration logic only if we are in initial waiting state or undefined (first load)
      console.log(`[DriverDashboard] Focus Effect Triggered. AuthToken: ${!!authToken}, CurrentStep: ${currentStep}`);
      
      if (authToken && (currentStep === TRIP_STEPS.WAITING_FOR_TRIP || currentStep === undefined)) {
          // Check active trip first.
          restoreTripState().then((restored) => {
              if (!restored) {
                  console.log("[DriverDashboard] Persistence check returned false. Checking for NEW pending offers...");
                  checkPendingOffers();
              } else {
                  console.log("[DriverDashboard] Trip successfully restored from persistence. Skipping pending offers check.");
              }
          });
      } else {
          console.log("[DriverDashboard] Skipping persistence/offers check. Logic: ", {
             hasAuth: !!authToken,
             isWaiting: currentStep === TRIP_STEPS.WAITING_FOR_TRIP,
             isUndefined: currentStep === undefined
          });
      }
      
      // 2. Check pending offers via API (Legacy/New Invite)
      // Moved inside the promise chain above or executed efficiently
      // We keep this here for invalidations or simple updates
      // if (authToken && currentStep === TRIP_STEPS.WAITING_FOR_TRIP) {
      //     checkPendingOffers();
      // }
      
      // 2. Check route params (Legacy/Notification click)
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

      // 3. Check NotificationService last event (Legacy/Background to Foreground)
      const NotificationService = require("../../services/NotificationService").default;
      const lastEvent = NotificationService.getLastEvent("trip_assignment");
      
      if (lastEvent?.tripId) {

        if (currentStep === undefined || currentStep === TRIP_STEPS.WAITING_FOR_TRIP) {
          showTripAssignmentAlert(lastEvent);
          NotificationService.clearLastEvent("trip_assignment");
        }
      }
    }, [route?.params, currentStep, showTripAssignmentAlert, navigation, authToken])
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
        reason: rejectReason,
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
    // This is the STOCK REQUEST ID from the notification (e.g. 108)
    const stockRequestId = tripData.tripId || tripData.stock_request_id;
    
    console.log("[DriverDashboard] acceptTrip triggered.");
    console.log("[DriverDashboard] stockRequestId (notification ID):", stockRequestId);
    
    setLoading((prev) => ({ ...prev, trip: true }));
    setPendingTripData(null); 

    try {
      // 1) Submit Stock Request ID to backend
      const response = await driverApi.acceptTrip({
        stock_request_id: stockRequestId,
      });

      const serverTrip = response?.trip || response || null;
      
      // CRITICAL FIX: The notification sends 'stock_request_id' (e.g. 108), but the server
      // returns the actual 'trip_id' (e.g. 36). We must use the SERVER'S ID.
      
      const realTripId = serverTrip?.tripId || serverTrip?.id || serverTrip?.trip_id; 
      
      console.log(`[DriverDashboard] ID CHECK: StockReqId=${stockRequestId} vs RealTripId=${realTripId}`);

      const initialTrip = {
        tripId: realTripId || stockRequestId, // Prefer real ID, fallback if missing
        stockRequestId: stockRequestId,       // Keep original for reference
        msLocation: { name: tripData.msId, address: "Loading..." },
        dbsLocation: { name: tripData.dbsId, address: "Loading..." },
        estimatedDistance: "Calculating...",
        estimatedTime: "Calculating...",
        status: serverTrip?.status || "ASSIGNED",
        ...tripData,
        ...serverTrip,
        tripId: realTripId || stockRequestId, // Ensure this wins
      };

      const resolvedToken = response?.token_number || response?.driverToken || tripData.token_number;

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
           console.log("[DriverDashboard] Fetching full status for realTripId:", realTripId);
           const statusResponse = await driverApi.getTripStatus({
             token: resolvedToken,
           });
           
           if (statusResponse) {
             const statusTrip = statusResponse?.trip || statusResponse;
             if (statusTrip) {
               resolvedTrip = { ...resolvedTrip, ...statusTrip };
             }
             const resolvedStatus = statusResponse?.status ?? resolvedTrip.status;
             if (resolvedStatus) {
                resolvedTrip.status = resolvedStatus;
                nextStep = deriveStepFromStatus(resolvedStatus);
             }
           }
        }
      } catch (statusError) {
         console.warn("Trip status fetch failed", statusError);
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
        console.log("[DriverDashboard] handleArrivedAtMS called with token:", token);
        await driverApi.confirmArrivalAtMS({ token });
        console.log("[DriverDashboard] confirmArrivalAtMS success.");
        // Only update step if API success
        setCurrentStep(TRIP_STEPS.AT_MS_FILLING);
      } else {
        Alert.alert("Error", "No active trip token found. Cannot confirm arrival.");
      }
    } catch (error) {
      console.warn("Failed to confirm MS arrival.", error?.message || error);
      Alert.alert(
        "Error", 
        "Failed to confirm arrival. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
    }
  }, [token]);

  const handleMSOperationsComplete = () => {
    setCurrentStep(TRIP_STEPS.NAVIGATE_TO_DBS);
  };

  const handleArrivedAtDBS = useCallback(async () => {
    setLoading((prev) => ({ ...prev, navigation: true }));
    try {
      if (token) {
        console.log("[DriverDashboard] handleArrivedAtDBS called with token:", token);
        await driverApi.confirmArrivalAtDBS({ token });
        console.log("[DriverDashboard] confirmArrivalAtDBS success.");
        // Only update step if API success
        setCurrentStep(TRIP_STEPS.AT_DBS_DELIVERY);
      } else {
        Alert.alert("Error", "Token missing. Cannot confirm arrival.");
      }
    } catch (error) {
      console.warn("Failed to confirm DBS arrival.", error?.message || error);
      Alert.alert(
        "Error", 
        "Failed to confirm arrival at DBS. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
    }
  }, [token]);

  const handleDBSOperationsComplete = () => {
    setCurrentStep(TRIP_STEPS.NAVIGATE_BACK_TO_MS);
  };

  const finalArrival = useCallback(async () => {
    setLoading((prev) => ({ ...prev, navigation: true }));
    try {
      if (token) {
        console.log("[DriverDashboard] finalArrival called with token:", token);
        await driverApi.completeTrip({ token });
        console.log("[DriverDashboard] finalArrival (Returned to MS) success.");
        // Only update step if API success
        setCurrentStep(TRIP_STEPS.TRIP_COMPLETED);
      } else {
         Alert.alert("Error", "Token missing. Cannot complete trip.");
      }
    } catch (error) {
      console.warn("Failed to mark trip complete.", error?.message || error);
      Alert.alert(
        "Error", 
        "Failed to complete trip. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, navigation: false }));
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
    console.log(`[DriverDashboard] handleConfirmPreReading TRIGGERED for ${stationType}`);
    
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
        console.log("[DriverDashboard] Calling confirmMeterReading with token:", token);
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

        // Only update state if API call succeeds
        if (isMS) {
          setReadingsState((prev) => ({ ...prev, msPreConfirmed: true }));
        } else {
          setReadingsState((prev) => ({ ...prev, dbsPreConfirmed: true }));
        }
      } else {
        console.error("[DriverDashboard] Token is missing! Cannot confirm reading.");
        Alert.alert("Error", "Trip token is missing. Please try refreshing or re-opening the app.");
      }
    } catch (error) {
      console.warn(
        `Failed to confirm ${stationType} pre reading.`,
        error?.message || error
      );
      Alert.alert(
        "Error",
        `Failed to confirm reading. Please try again.\n\n${error?.message || "Check connection"}`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, readings: false }));
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
        console.log("[DriverDashboard] Calling confirmMeterReading (POST) with token:", token);
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

        // Only update state if API call succeeds
        if (isMS) {
          setReadingsState((prev) => ({ ...prev, msPostConfirmed: true }));
        } else {
          setReadingsState((prev) => ({ ...prev, dbsPostConfirmed: true }));
        }
      } else {
        console.error("[DriverDashboard] Token is missing! Cannot confirm post reading.");
        Alert.alert("Error", "Trip token is missing. Please refresh.");
      }
    } catch (error) {
      console.warn(
        `Failed to confirm ${stationType} post reading.`,
        error?.message || error
      );
      Alert.alert(
        "Error",
        `Failed to confirm reading. Please try again.\n\n${error?.message || "Check connection"}`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, readings: false }));
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
          currentLocation={lastKnownLocation}
          onLocationUpdate={(location) => {
            const now = Date.now();
            const lastUpdate = themeRef.current?.lastLocationUpdate || 0;
            
            // Throttle updates to every 3 seconds to prevent UI unresponsiveness
            if (now - lastUpdate > 3000) {
              if(themeRef.current) themeRef.current.lastLocationUpdate = now;
              
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
                  disabled={loading.readings || !preReading}
                  loading={loading.readings}
                  style={{
                    paddingVertical: themeRef.current?.spacing(2) || 8,
                    paddingHorizontal: themeRef.current?.spacing(3) || 12,
                    opacity: !preReading ? 0.5 : 1, 
                  }}
                />
                {/* <AppButton
                  title="Reject"
                  onPress={() => handleRejectReading(stationType, "Pre")}
                  variant="danger"
                  disabled={loading.readings}
                  style={{
                    paddingVertical: themeRef.current?.spacing(2) || 8,
                    paddingHorizontal: themeRef.current?.spacing(3) || 12,
                  }}
                /> */}
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
                    {/* <AppButton
                      title="Reject"
                      onPress={() => handleRejectReading(stationType, "Post")}
                      variant="danger"
                      disabled={loading.readings}
                      style={{
                        paddingVertical: themeRef.current?.spacing(2) || 8,
                        paddingHorizontal: themeRef.current?.spacing(3) || 12,
                      }}
                    /> */}
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
          finalArrival
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
