import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { CONFIG } from "../config";
import {
  apiRegisterDriverToken,
  apiUnregisterDriverToken,
  apiRegisterDBSToken,
  apiUnregisterDBSToken,
  apiRegisterMSToken,
  apiUnregisterMSToken,
  apiRegisterEICToken,
  apiUnregisterEICToken,
} from "../lib/api";

// Always try to import Firebase for real FCM tokens
let messaging = null;
try {
  messaging = require("@react-native-firebase/messaging").default;
  // Firebase messaging loaded successfully
} catch (error) {
  console.warn("[WARN] Firebase messaging not available:", error.message);
}

// Configure notification handler to suppress system alerts in foreground
// This ensures we only show our custom in-app alert (Accept/Reject)
Notifications.setNotificationHandler({
  handleNotification: async () => {

    return {
      shouldShowAlert: false, // Hides system notification when app is open
      shouldPlaySound: true,  // Still plays sound
      shouldSetBadge: false,
    };
  },
});

class NotificationService {
  constructor() {
    this.deviceToken = null;
    this.navigationRef = null;
    this.limitedNotifications = false; // true when running in Expo Go or without FCM
    this._listeners = new Map(); // event -> Set<callback>
    this._pendingIntent = null; // store a pending navigation intent if role/nav not ready
    this._authUnsub = null;
    this._lastEvents = {}; // remember last events for late subscribers
  }

  // Set navigation reference for deep linking
  setNavigationRef(navigationRef) {
    this.navigationRef = navigationRef;
    // navigation ref set
    // Try fulfill any pending navigation intent once navigation becomes available
    this._flushPendingIntent();
  }

  // Navigate to a tab nested under the root 'App' stack, passing params reliably
  navigateToTab(tabName, params = {}) {
    if (!this.navigationRef) {
      console.warn("[NotificationService] Navigation ref not set");
      return;
    }
    
    try {
      // Method 1: Try direct global navigation first
      // This works best if the screen name 'tabName' is unique in the navigator hierarchy
      this.navigationRef.navigate(tabName, params);
    } catch (error1) {
      console.warn("[NotificationService] Direct navigate failed, trying nested:", error1?.message);
      
      // Method 2: Try explicit nested navigation targeting 'App' root
      try {
        const { CommonActions } = require("@react-navigation/native");
        this.navigationRef.dispatch(
          CommonActions.navigate({
            name: "App",
            params: {
              screen: tabName,
              params: params,
            },
          })
        );
      } catch (error2) {
        console.warn("[NotificationService] Nested navigate failed:", error2?.message);
      }
    }
  }

  // Simple event emitter for JS-level notifications to screens
  addListener(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this.removeListener(event, callback);
  }

  removeListener(event, callback) {
    const set = this._listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this._listeners.delete(event);
    }
  }

  emit(event, data) {
    const set = this._listeners.get(event);
    if (set)
      for (const cb of Array.from(set)) {
        try {
          cb(data);
        } catch (e) {
          console.warn("Listener error", e);
        }
      }
    // store last event
    this._lastEvents[event] = data;
  }

  // Get last event payload (if any)
  getLastEvent(event) {
    return this._lastEvents[event];
  }

  // Clear last event (consume it)
  clearLastEvent(event) {
    delete this._lastEvents[event];
  }

  // Listen to auth changes so we can process pending intents once user is ready
  setupAuthSubscription() {
    if (this._authUnsub) return; // only once
    try {
      const { useAuth } = require("../store/auth");
      this._authUnsub = useAuth.subscribe((state, prev) => {
        // auth state change hook
        if (state?.user && !prev?.user) {
          // user just became available; try flushing pending intent
          this._flushPendingIntent();
        }
      });
    } catch (_error) {
      console.warn(
        "[NotificationService] Auth store not ready yet:",
        error.message
      );
    }
  }

  _queuePendingIntent(intent) {

    this._pendingIntent = intent;
  }

  _flushPendingIntent() {
    if (!this._pendingIntent) return;
    if (!this._pendingIntent) return;
    const { tabName, params, event, eventData } = this._pendingIntent;
    const user = this.getCurrentUser();
    
    // flush pending intent if ready
    if (!this.navigationRef || !user) return;

    try {

      if (tabName) this.navigateToTab(tabName, params || {});
      if (event) this.emit(event, eventData || {});
      this._pendingIntent = null;
      this._pendingIntent = null;
    } catch (e) {
      console.warn("Failed to flush pending intent:", e?.message || e);
    }
  }

  // Public method to manually flush pending intents
  flushPendingIntents() {
    this._flushPendingIntent();
  }

  // Request notification permissions
  async requestPermission() {
    try {
      // For Android 13+, request POST_NOTIFICATIONS permission first
      if (Platform.OS === "android") {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          return false;
        }
      }

      // Skip Firebase permission in development
      if (!messaging) {
        return true;
      }

      // Then request Firebase messaging permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  // Check current notification permissions without requesting
  async checkPermission() {
    try {
      // 1. Check Expo/System permissions (covers Android 13+ operational status)
      const settings = await Notifications.getPermissionsAsync();
      
      // If system permission is denied explicitly, return false
      if (
        settings.status !== "granted" &&
        settings.status !== "undetermined" // treating undetermined as 'not granted yet', but usually for check we want 'granted'
      ) {
         return false;
      }
       // If specifically undetermined, we might want to return false so we force a request,
       // but for a "blocking screen" logic, usually 'denied' is the trigger. 
       // However, user wants "if someone doesnot allow... dont show me anything".
       // So if strictly NOT granted, return false.
      if (settings.status !== 'granted') {
          return false;
      }

      // 2. Check Firebase permissions (optional but good for iOS/FCM alignment)
      if (messaging) {
        const authStatus = await messaging().hasPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
        if (!enabled) return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking notification permission:", error);
      // specific fallback: if error, assume false to be safe or true to not block?
      // creating a block is safer for logic "mandatory"
      return false;
    }
  }

  // Whether notifications are limited (Expo Go or no FCM)
  areNotificationsLimited() {
    // If Firebase messaging is available, we are definitely NATIVE and capable.
    if (messaging) return false;

    // Fallback: In Expo Go, Constants.appOwnership === 'expo'.
    // 'guest' (dev client) or 'standalone' (prod) or 'unknown' (sometimes EAS) might be native.
    const ownership = Constants?.appOwnership;
    const isNative = ownership === "standalone" || ownership === "guest";
    
    return this.limitedNotifications || !isNative;
  }

  // Get device token
  async getDeviceToken() {
    try {
      if (!messaging) {
        this.deviceToken = "DEV_TOKEN_" + Date.now();
        return this.deviceToken;
      }

      const token = await messaging().getToken();
      this.deviceToken = token;

      return token;
    } catch (error) {
      console.error("Error getting device token:", error);
      return null;
    }
  }

  // Register device token with backend:Driver
  async registerDriverDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiRegisterDriverToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error registering device token:", error);
      return false;
    }
  }

  // Unregister device token for: Driver
  async unregisterDriverDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiUnregisterDriverToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error unregistering device token:", error);
      return false;
    }
  }

  // Register DBS operator device token with backend
  async registerDBSDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiRegisterDBSToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error registering DBS device token:", error);
      return false;
    }
  }

  // Unregister DBS device token
  async unregisterDBSDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiUnregisterDBSToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error unregistering DBS device token:", error);
      return false;
    }
  }

  // Register MS operator device token with backend
  async registerMSDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiRegisterMSToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error registering MS device token:", error);
      return false;
    }
  }

  // Unregister MS device token
  async unregisterMSDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiUnregisterMSToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error unregistering MS device token:", error);
      return false;
    }
  }

  // Register EIC device token with backend
  async registerEICDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiRegisterEICToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error registering EIC device token:", error);
      return false;
    }
  }

  // Unregister EIC device token
  async unregisterEICDeviceToken(userId) {
    try {
      if (!this.deviceToken) {
        await this.getDeviceToken();
      }

      await apiUnregisterEICToken(userId, this.deviceToken);

      return true;
    } catch (error) {
      console.error("Error unregistering EIC device token:", error);
      return false;
    }
  }

  // Handle foreground notifications
  setupForegroundHandler() {
    if (messaging) {
      return messaging().onMessage(async (remoteMessage) => {

        
        // Don't show Alert.alert here. 
        // Instead, just pass the data to the app logic so it can show its own UI (e.g. DriverDashboard modal)
        if (remoteMessage.data) {
           this.handleNotificationTap(remoteMessage.data);
        }
      });
    } else {
      // Expo Notifications fallback
      return Notifications.addNotificationReceivedListener((notif) => {
        const data = notif?.request?.content?.data || {};

        
        // If it's a trip assignment, emit the event immediately so the dashboard shows the alert
        if (data.type === "trip_assignment" || data.type === "TRIP_OFFER") {
          this.handleNotificationTap(data); // Reuse the logic to emit event
        }
      });
    }
  }

  // Setup Android notification channel
  async setupAndroidChannel() {
    try {
      // Use a new channel ID to force update settings on device
      await Notifications.setNotificationChannelAsync("default_v2", {
        name: "Default Channel",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFFFFF",
      });
    } catch (error) {
      console.error("Error creating Android notification channel:", error);
    }
  }

  // Background handler is now in index.js (required for Android)
  // This method kept for compatibility but does nothing
  // ! IMP
  setupBackgroundHandler() {
    // Background handler moved to index.js for Android compatibility
  }

  // Handle notification tap (when app opens from notification)
  setupNotificationOpenHandler() {
    if (messaging) {
      // Firebase handlers
      messaging().onNotificationOpenedApp((remoteMessage) => {

        this.handleNotificationTap(remoteMessage.data);
      });
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {

            this.handleNotificationTap(remoteMessage.data);
          }
        });
    } else {
      // Expo Notifications fallback
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || {};

        this.handleNotificationTap(data);
      });
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response?.notification?.request?.content?.data || {};

          this.handleNotificationTap(data);
        }
      });
    }
  }

  // Handle FCM token refresh
  setupTokenRefreshHandler() {
    if (!messaging) {
      return;
    }

    return messaging().onTokenRefresh(async (newToken) => {

      this.deviceToken = newToken;

      // Re-register with backend if user is logged in
      const currentUser = this.getCurrentUser();
      if (currentUser?.id) {
        try {
          if (currentUser.role === "DBS_OPERATOR") {
            await this.registerDBSDeviceToken(currentUser.id);
          } else if (currentUser.role === "MS_OPERATOR") {
            await this.registerMSDeviceToken(currentUser.id);
          } else if (currentUser.role === "EIC") {
            await this.registerEICDeviceToken(currentUser.id);
          } else if (
            currentUser.role === "DRIVER" ||
            currentUser.role === "SGL_DRIVER"
          ) {
            await this.registerDriverDeviceToken(currentUser.id);
          }
        } catch (error) {
          console.error("Failed to register refreshed token:", error);
        }
      }
    });
  }

  // Get current user from auth store
  getCurrentUser() {
    try {
      // Import auth store dynamically to avoid circular dependencies
      const { useAuth } = require("../store/auth");
      const authState = useAuth.getState();
      return authState.user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  // Handle notification tap logic
  handleNotificationTap(data) {
    console.log("[NotificationService] handleNotificationTap CALL with data:", JSON.stringify(data));

    const user = this.getCurrentUser();
    if (!data) {
        console.log("[NotificationService] No data in notification, ignoring.");
        return;
    };
    
    console.log(`[NotificationService] Processing type: ${data.type} for Role: ${user?.role}`);
    

    
    // handle notification tap

    // Driver notifications - trip_assignment OR TRIP_OFFER (backend legacy)
    if (data.type === "trip_assignment" || data.type === "TRIP_OFFER") {

      const eventPayload = {
        tripId: data.stock_request_id || data.tripId,
        dbsId: data.to_dbs || data.dbs_name || data.dbsId, // Map to_dbs from backend
        dbsIdRaw: data.dbs_id, // Store raw ID for API calls
        quantity: data.quantity_kg || data.quantity,
        priority: data.priority,
        msId: data.from_ms || data.msId || "MS-001", // Map from_ms from backend
        vehicleId: data.vehicleId,
        ...data,
      };
      

      
      // Emit event for DriverDashboard to handle
      this.emit("trip_assignment", eventPayload);
      
      // Navigate to DriverDashboard tab
      // Note: RoleTabs.js defines the tab name as "DriverDashboard"
      // But RootNavigator usually nests RoleTabs under "App"
      if (this.navigationRef) {
        // Use navigateToTab which handles nested navigation robustly
        this.navigateToTab("DriverDashboard", { 
          fromNotification: true, 
          ...eventPayload 
        });
      } else {
        this._queuePendingIntent({
          tabName: "DriverDashboard",
          params: { fromNotification: true, ...eventPayload },
          event: "trip_assignment",
          eventData: eventPayload,
        });
      }
      return;
    }

    // DBS arrival notifications
    if (data.type === "dbs_arrival") {
      // Only route if user is DBS operator and the tab exists
      const params = {
        fromNotification: true,
        type: "dbs_arrival",
        tripId: data.tripId || data.trip_id,
        dbsId: data.dbsId || data.dbs_id,
        driverId: data.driverId || data.driver_id,
        token: data.tripToken || data.token || data.trip_token, // Map tripToken
        vehicleNo: data.truckNumber || data.vehicleNo || data.truck_number, 
      };
      const eventPayload = {
        tripId: data.tripId || data.trip_id,
        dbsId: data.dbsId || data.dbs_id,
        driverId: data.driverId || data.driver_id,
        token: data.tripToken || data.token || data.trip_token,
        vehicleNo: data.truckNumber || data.vehicleNo || data.truck_number,
      };
      if (user?.role === "DBS_OPERATOR" && this.navigationRef) {
        this.navigateToTab("Decanting", params);
        this.emit("dbs_arrival", eventPayload);
        // routed to Decanting and emitted dbs_arrival
      } else {
        // Queue intent to handle once user/nav is ready
        // Also store a last event now so late subscribers can pick up
        this.emit("dbs_arrival", eventPayload);
        // stored last event and queued pending intent
        this._queuePendingIntent({
          tabName: "Decanting",
          params,
          event: "dbs_arrival",
          eventData: eventPayload,
        });
      }
      return;
    }

    // MS arrival notifications
    if (data.type === "ms_arrival") {
      // Only route if user is MS operator and the tab exists
      const params = {
        fromNotification: true,
        type: "ms_arrival",
        tripId: data.tripId,
        driverId: data.driverId,
        stationId: data.stationId,
        token: data.tripToken || data.token, // Map tripToken to token
        vehicleNo: data.truckNumber, 
      };
      if (user?.role === "MS_OPERATOR" && this.navigationRef) {
        this.navigateToTab("Operations", params);
        this.emit("ms_arrival", {
          tripId: data.tripId,
          driverId: data.driverId,
          stationId: data.stationId,
          token: data.tripToken || data.token, // Map tripToken to token
          vehicleNo: data.truckNumber,
        });
      } else {
        this._queuePendingIntent({
          tabName: "Operations",
          params,
          event: "ms_arrival",
          eventData: {
            tripId: data.tripId,
            driverId: data.driverId,
            stationId: data.stationId,
          },
        });
      }
      return;
    }

    // Driver response notifications (ACCEPTED/REJECTED)
    // Backend sends type: "DRIVER_REJECTED" or "DRIVER_ACCEPTED"
    if (data.type === "driver_response" || data.type === "DRIVER_REJECTED" || data.type === "DRIVER_ACCEPTED") {

      
      // Determine action from type if not explicitly provided
      let action = data.action || data.status;
      if (!action) {
        if (data.type === "DRIVER_REJECTED") action = "REJECTED";
        if (data.type === "DRIVER_ACCEPTED") action = "ACCEPTED";
      }

      const eventPayload = {
        requestId: data.requestId || data.stock_request_id,
        driverId: data.driverId || data.driver_id,
        action: action,
        ...data
      };
      
      // Emit event for IncomingStockRequests to handle
      this.emit("driver_response", eventPayload);
      
      // Navigate if needed (optional, but good for background taps)
      if (user?.role === "EIC") {
         if (this.navigationRef) {
            this.navigateToTab("StockRequests", { fromNotification: true, ...eventPayload });
         } else {
            this._queuePendingIntent({
              tabName: "StockRequests",
              params: { fromNotification: true, ...eventPayload },
              event: "driver_response",
              eventData: eventPayload,
            });
         }
      }
      return;
    }

    // EIC route deviation notifications
    if (data.type === "route_deviation") {
      const params = {
        fromNotification: true,
        type: "route_deviation",
        tripId: data.tripId,
        driverId: data.driverId,
        currentLocation: data.currentLocation,
        deviationDistance: data.deviationDistance,
      };
      if (user?.role === "EIC" && this.navigationRef) {
        this.navigateToTab("StockRequests", params);
        this.emit("route_deviation", {
          tripId: data.tripId,
          driverId: data.driverId,
          currentLocation: data.currentLocation,
          deviationDistance: data.deviationDistance,
        });
      } else {
        this._queuePendingIntent({
          tabName: "StockRequests",
          params,
          event: "route_deviation",
          eventData: {
            tripId: data.tripId,
            driverId: data.driverId,
            currentLocation: data.currentLocation,
            deviationDistance: data.deviationDistance,
          },
        });
      }
      return;
    }

    // EIC gas variance notifications
    if (data.type === "gas_variance") {
      const params = {
        fromNotification: true,
        type: "gas_variance",
        tripId: data.tripId,
        msDispatchAmount: data.msDispatchAmount,
        dbsReceivedAmount: data.dbsReceivedAmount,
        variancePercentage: data.variancePercentage,
      };
      if (user?.role === "EIC" && this.navigationRef) {
        this.navigateToTab("StockRequests", params);
        this.emit("gas_variance", {
          tripId: data.tripId,
          msDispatchAmount: data.msDispatchAmount,
          dbsReceivedAmount: data.dbsReceivedAmount,
          variancePercentage: data.variancePercentage,
        });
      } else {
        this._queuePendingIntent({
          tabName: "StockRequests",
          params,
          event: "gas_variance",
          eventData: {
            tripId: data.tripId,
            msDispatchAmount: data.msDispatchAmount,
            dbsReceivedAmount: data.dbsReceivedAmount,
            variancePercentage: data.variancePercentage,
          },
        });
      }
      return;
    }

    // EIC driver response notifications (driver accepted/rejected trip)
    if (data.type === "driver_response") {
      const eventPayload = {
        requestId: data.requestId,
        driverId: data.driverId,
        driverName: data.driverName,
        action: data.action, // "ACCEPTED" or "REJECTED"
        driverAction: data.driverAction, // alternate key
      };
      
      // Emit event for EIC screen to handle
      this.emit("driver_response", eventPayload);
      
      // Navigate to StockRequests if EIC
      if (user?.role === "EIC" && this.navigationRef) {
        this.navigateToTab("StockRequests", {
          fromNotification: true,
          type: "driver_response",
          ...eventPayload,
        });
      } else {
        this._queuePendingIntent({
          tabName: "StockRequests",
          params: {
            fromNotification: true,
            type: "driver_response",
            ...eventPayload,
          },
          event: "driver_response",
          eventData: eventPayload,
        });
      }
      return;
    }

    // Assignment Expired notifications (Driver did not respond)
    if (data.type === "ASSIGNMENT_EXPIRED") {
      const eventPayload = {
        requestId: data.stock_request_id,
        driverId: data.driver_id,
        driverName: data.driver_name,
        dbsName: data.dbs_name,
        action: data.action, // REASSIGN_REQUIRED
        type: data.type,
      };

      // Emit generic driver_response so IncomingStockRequests picks it up
      this.emit("driver_response", eventPayload);

      // Navigate if needed
      if (user?.role === "EIC") {
        if (this.navigationRef) {
          this.navigateToTab("StockRequests", {
            fromNotification: true,
            ...eventPayload,
          });
        } else {
          this._queuePendingIntent({
            tabName: "StockRequests",
            params: { fromNotification: true, ...eventPayload },
            event: "driver_response",
            eventData: eventPayload,
          });
        }
      }
      return;
    }

      // EIC Stock Request notifications
    if (data.type === "STOCK_REQUEST" || data.notification_type === "stock_request") {
      console.log("[NotificationService] Handling STOCK_REQUEST:", JSON.stringify(data));
      const eventPayload = {
        requestId: data.stockRequestId,
        dbsId: data.dbsId,
        dbsName: data.dbsName,
        msId: data.msId,
        msName: data.msName,
        ...data,
      };

      // Emit event for EIC screen to handle
      console.log("[NotificationService] Emitting stock_request event");
      this.emit("stock_request", eventPayload);

      // Navigate to StockRequests if EIC
      // Note: We use "StockRequests" because that is the route name in EICNavigator.js
      // DO NOT CHANGE IT TO "IncomingStockRequests"
      if (user?.role === "EIC" && this.navigationRef) {
        console.log("[NotificationService] Executing direct navigation to StockRequests");
        this.navigateToTab("StockRequests", {
          fromNotification: true,
          type: "stock_request",
          ...eventPayload,
        });
      } else {
        console.log("[NotificationService] User not EIC or nav ref missing, queuing intent");
        this._queuePendingIntent({
          tabName: "StockRequests",
          params: {
            fromNotification: true,
            type: "stock_request",
            ...eventPayload,
          },
          event: "stock_request",
          eventData: eventPayload,
        });
      }
      return;
    }
  }

  // Initialize all notification handlers
  async initialize(userId = null) {
    try {
      // Detect limited environment early
      const ownership = Constants?.appOwnership || "unknown";
      // Trust messaging: if it exists, we are not limited.
      this.limitedNotifications = !messaging;

      // Configure notification handler to suppress system alerts in foreground
      // This ensures we only show our custom in-app alert (Accept/Reject)
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false, // Hides system notification when app is open
          shouldPlaySound: true,  // Still plays sound
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get device token
      await this.getDeviceToken();

      // Register device token only if user ID provided
      if (userId) {
        await this.registerDriverDeviceToken(userId);
      }

      // Setup Android notification channel
      if (Platform.OS === "android") {
        await this.setupAndroidChannel();
      }

      // Setup handlers
      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenHandler();
      this.setupTokenRefreshHandler();

      // Subscribe to auth changes once to process pending intents after login/rehydration
      this.setupAuthSubscription();

      return true;
    } catch (error) {
      console.error("Error initializing notification service:", error);
      return false;
    }
  }

  // Convenience initializer for DBS users; call after DBS login with user.id
  async initializeForDBS(userId) {
    try {
      const ownership = Constants?.appOwnership || "unknown";
      // Trust messaging: if it exists, we are not limited.
      this.limitedNotifications = !messaging;

      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      await this.getDeviceToken();
      await this.registerDBSDeviceToken(userId);

      if (Platform.OS === "android") {
        await this.setupAndroidChannel();
      }

      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenHandler();
      this.setupTokenRefreshHandler();
      this.setupAuthSubscription();

      return true;
    } catch (e) {
      console.error("Error initializing notifications for DBS:", e);
      return false;
    }
  }

  // Convenience initializer for MS operators; call after MS login with user.id
  async initializeForMS(userId) {
    try {
      const ownership = Constants?.appOwnership || "unknown";
      // Trust messaging: if it exists, we are not limited.
      this.limitedNotifications = !messaging;

      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      await this.getDeviceToken();
      await this.registerMSDeviceToken(userId);

      if (Platform.OS === "android") {
        await this.setupAndroidChannel();
      }

      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenHandler();
      this.setupTokenRefreshHandler();
      this.setupAuthSubscription();

      // Friendly notice for Expo Go/dev client to keep UX flow working
      if (this.areNotificationsLimited()) {
       console.log("[NotificationService] Notifications limited in MS role");
      }
      return true;
    } catch (e) {
      console.error("Error initializing notifications for MS:", e);
      return false;
    }
  }

  // Convenience initializer for EIC; call after EIC login with user.id
  async initializeForEIC(userId) {
    try {
      const ownership = Constants?.appOwnership || "unknown";
      // Trust messaging: if it exists, we are not limited.
      this.limitedNotifications = !messaging;

      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      await this.getDeviceToken();
      await this.registerEICDeviceToken(userId);

      if (Platform.OS === "android") {
        await this.setupAndroidChannel();
      }

      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenHandler();
      this.setupTokenRefreshHandler();
      this.setupAuthSubscription();

      return true;
    } catch (e) {
      console.error("Error initializing notifications for EIC:", e);
      return false;
    }
  }
}

export default new NotificationService();
