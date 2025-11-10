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
    if (!this.navigationRef) return;
    try {
      // navigating into nested App stack
      // Preferred: navigate into the nested App stack specifying the tab screen
      this.navigationRef.navigate("App", {
        screen: tabName,
        params,
      });
    } catch (_error) {
      // Fallback: try direct navigation by screen name if registered at root
      try {
        // fallback to direct tab navigate
        this.navigationRef.navigate(tabName, params);
      } catch (e) {
        console.warn(`Navigation failed to ${tabName}:`, e?.message || e);
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
    // queue pending intent
    this._pendingIntent = intent;
  }

  _flushPendingIntent() {
    if (!this._pendingIntent) return;
    const { tabName, params, event, eventData } = this._pendingIntent;
    const user = this.getCurrentUser();
    // flush pending intent if ready
    if (!this.navigationRef || !user) return; // still not ready
    try {
      if (tabName) this.navigateToTab(tabName, params || {});
      if (event) this.emit(event, eventData || {});
      this._pendingIntent = null;
      // pending intent processed
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
          console.log("[ERROR] Android notification permission denied");
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

  // Whether notifications are limited (Expo Go or no FCM)
  areNotificationsLimited() {
    // In Expo Go, Constants.appOwnership === 'expo'; dev client may be 'guest'. Standalone is EAS build.
    const ownership = Constants?.appOwnership || "unknown";
    const isStandalone = ownership === "standalone";
    return this.limitedNotifications || !isStandalone || !messaging;
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
      console.log("[INFO] Device Token:", token);
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
      console.log("[SUCCESS] Device token registered with backend");
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
      console.log("[SUCCESS] Device token unregistered from backend");
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
      console.log("[SUCCESS] DBS device token registered with backend");
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
      console.log("[SUCCESS] DBS device token unregistered from backend");
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
      console.log("[SUCCESS] MS device token registered with backend");
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
      console.log("[SUCCESS] MS device token unregistered from backend");
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
      console.log("[SUCCESS] EIC device token registered with backend");
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
      console.log("[SUCCESS] EIC device token unregistered from backend");
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
        console.log("[INFO] Foreground notification received:", remoteMessage);

        Alert.alert(
          remoteMessage.notification?.title || "New Notification",
          remoteMessage.notification?.body || "You have a new message",
          [
            { text: "Dismiss", style: "cancel" },
            {
              text: "View",
              onPress: () => this.handleNotificationTap(remoteMessage.data),
            },
          ]
        );
      });
    } else {
      // Expo Notifications fallback
      return Notifications.addNotificationReceivedListener((notif) => {
        const data = notif?.request?.content?.data || {};
        console.log("[INFO] [Expo] Foreground notification received:", data);
      });
    }
  }

  // Setup Android notification channel
  async setupAndroidChannel() {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
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
        console.log("[INFO] Notification opened app:", remoteMessage);
        this.handleNotificationTap(remoteMessage.data);
      });
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log("[INFO] App opened from notification:", remoteMessage);
            this.handleNotificationTap(remoteMessage.data);
          }
        });
    } else {
      // Expo Notifications fallback
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || {};
        console.log("[INFO] [Expo] Notification response:", data);
        this.handleNotificationTap(data);
      });
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response?.notification?.request?.content?.data || {};
          console.log("[INFO] [Expo] App opened from notification:", data);
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
      console.log("FCM token refreshed:", newToken);
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
    const user = this.getCurrentUser();
    if (!data) return;
    // handle notification tap

    // Driver notifications
    if (data.type === "trip_assignment") {
      if (this.navigationRef) {
        this.navigateToTab("Dashboard", { fromNotification: true, ...data });
      }
      return;
    }

    // DBS arrival notifications
    if (data.type === "dbs_arrival") {
      // Only route if user is DBS operator and the tab exists
      const params = {
        fromNotification: true,
        type: "dbs_arrival",
        tripId: data.tripId,
        dbsId: data.dbsId,
        driverId: data.driverId,
      };
      const eventPayload = {
        tripId: data.tripId,
        dbsId: data.dbsId,
        driverId: data.driverId,
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
      };
      if (user?.role === "MS_OPERATOR" && this.navigationRef) {
        this.navigateToTab("Operations", params);
        this.emit("ms_arrival", {
          tripId: data.tripId,
          driverId: data.driverId,
          stationId: data.stationId,
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
  }

  // Initialize all notification handlers
  async initialize(userId = null) {
    try {
      // Detect limited environment early
      const ownership = Constants?.appOwnership || "unknown";
      const isStandalone = ownership === "standalone";
      this.limitedNotifications = !isStandalone || !messaging;

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
      const isStandalone = ownership === "standalone";
      this.limitedNotifications = !isStandalone || !messaging;

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
      const isStandalone = ownership === "standalone";
      this.limitedNotifications = !isStandalone || !messaging;

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
        Alert.alert(
          "Expo Go mode",
          "Push notifications are limited in Expo Go. You can still test the MS flow by opening the Operations tab; the app will enable a test path without push."
        );
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
      const isStandalone = ownership === "standalone";
      this.limitedNotifications = !isStandalone || !messaging;

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
