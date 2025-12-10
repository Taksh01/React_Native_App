import { CONFIG } from "../config";
import { useAuth } from "../store/auth";

// Helper to create authenticated headers
const getAuthHeaders = () => {
  const { token } = useAuth.getState();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
};

/**
 * Driver API functions for trip management and operations
 */

export const driverApi = {
  acceptTrip: async ({ stock_request_id }) => {
    const url = `${CONFIG.API_BASE_URL}/api/driver-trips/accept/`;
    console.log("[driverApi] acceptTrip URL:", url);
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ stock_request_id }),
    });

    const text = await response.text();
    console.log("[driverApi] acceptTrip response:", text.substring(0, 500)); 

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[driverApi] JSON Parse Error in acceptTrip. Raw text:", text);
      throw new Error("Invalid server response (not JSON)");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to accept trip");
    }
    return data;
  },

  getPendingOffers: async () => {
    const url = `${CONFIG.API_BASE_URL}/api/driver/pending-offers`;
    console.log("[driverApi] getPendingOffers URL:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const text = await response.text();
    // console.log("[driverApi] getPendingOffers response:", text); 

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[driverApi] JSON Parse Error in getPendingOffers:", e);
      // Return empty structure on parse error to avoid crashing UI loop
      return { pending_offers: [], count: 0 };
    }

    if (!response.ok) {
      // Just log warning and return empty, so we don't block the UI with alerts
      console.warn("Failed to get pending offers:", data.error);
      return { pending_offers: [], count: 0 };
    }
    return data;
  },

  rejectTrip: async ({ tripId, reason }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/driver-trips/reject/`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stock_request_id: tripId, reason }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to reject trip");
    }
    return data;
  },

  // Location Updates
  updateLocation: async ({ token, latitude, longitude }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/driver/location`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, latitude, longitude }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update location");
    }
    return data;
  },

  // Station Arrivals
  confirmArrivalAtMS: async ({ token }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/driver/arrival/ms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to confirm MS arrival");
    }
    return data;
  },

  confirmArrivalAtDBS: async ({ token }) => {
    const url = `${CONFIG.API_BASE_URL}/api/driver/arrival/dbs`;
    console.log("[driverApi] confirmArrivalAtDBS URL:", url);
    console.log("[driverApi] Payload token:", token);

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    console.log("[driverApi] confirmArrivalAtDBS Status:", response.status);
    const text = await response.text();
    console.log("[driverApi] confirmArrivalAtDBS Raw Response:", text);

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON response for DBS arrival");
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to confirm DBS arrival");
    }
    return data;
  },

  // Meter Reading Confirmations
  confirmMeterReading: async ({
    token,
    stationType,
    readingType,
    reading,
    confirmed,
    photoBase64,
  }) => {
    const url = `${CONFIG.API_BASE_URL}/api/driver/meter-reading/confirm`;

    // Ensure we have the prefix if the backend expects to split by comma
    let finalPhotoString = photoBase64;
    if (photoBase64 && !photoBase64.startsWith("data:image")) {
        finalPhotoString = `data:image/jpeg;base64,${photoBase64}`;
    }

    const payload = {
      token,
      stationType,
      readingType,
      reading,
      confirmed,
      ...(finalPhotoString ? { photoBase64: finalPhotoString.substring(0, 50) + "..." } : {}),
    };
    
    console.log("[driverApi] Confirming Meter Reading...");
    console.log("[driverApi] URL:", url);
    console.log("[driverApi] Payload:", JSON.stringify(payload));

    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          token,
          stationType,
          readingType,
          reading,
          confirmed,
          ...(finalPhotoString ? { photoBase64: finalPhotoString } : {}),
        }),
    });

    console.log("[driverApi] Response Status:", response.status);
    const text = await response.text();
    console.log("[driverApi] Response Body:", text);

    let data;
    try {
        data = JSON.parse(text);
    } catch(e) {
        throw new Error("Invalid JSON response from server");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to confirm meter reading");
    }
    return data;
  },

  // ! Not used in DriverDashboard (Planned)
  getMeterReadings: async ({ token, stationType }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/meter-readings/${stationType}?token=${token}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get meter readings");
    }
    return data;
  },

  // Trip Completion
  completeTrip: async ({ token }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/driver/trip/complete`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ token }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to complete trip");
    }
    return data;
  },

  // Emergency Reporting
  reportEmergency: async ({
    token,
    type,
    message,
    severity,
  }) => {
    const url = `${CONFIG.API_BASE_URL}/api/driver/emergency`;
    console.log("[driverApi] reportEmergency URL:", url);
    
    const payload = {
      token,
      type,
      message,
      severity,
    };

    console.log("[driverApi] reportEmergency Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[driverApi] reportEmergency Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[driverApi] JSON Parse Error in reportEmergency:", e);
      throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to report emergency");
    }
    return data;
  },

  // Trip Status
  getTripStatus: async ({ token }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/driver/trip/status?token=${token}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get trip status");
    }
    return data;
  },

  // Resume Active Trip (Persistence)
  resumeTrip: async ({ token } = {}) => {
    const url = `${CONFIG.API_BASE_URL}/api/driver-trips/resume/`;
    console.log("[driverApi] resumeTrip URL:", url);
    
    const body = token ? JSON.stringify({ token }) : undefined;

    // Resume usually implies a check. 
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body,
    });

    const text = await response.text();
    // console.log("[driverApi] resumeTrip response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[driverApi] JSON Parse Error in resumeTrip:", e);
      // Return null or throw? Throwing is safer for the caller to handle as "not found" or "error"
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      // 404/400 might mean no trip, but let caller decide.
      throw new Error(data.error || "Failed to resume trip");
    }
    return data;
  },

  // Driver Token Management
  // ! Not used in DriverDashboard as it comes from Notification
  // ! But used my ms operator so keep it here
  getDriverToken: async (driverId) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/${driverId}/token`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get driver token");
    }
    return data;
  },
  // Fetch trip history for a driver (past trips)
  getTripHistory: async () => {
    console.log("[driverApi] getTripHistory URL:", `${CONFIG.API_BASE_URL}/api/driver/trips`);
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/driver/trips`, {
      headers: getAuthHeaders(),
    });

    console.log("[driverApi] getTripHistory Status:", response.status);
    const text = await response.text();
    console.log("[driverApi] getTripHistory Response:", text);

    if (!text) {
        console.warn("[driverApi] Received empty response body");
        return { trips: [] }; // Fallback to empty list or throw error if undefined behavior
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[driverApi] JSON Parse Error in getTripHistory:", e);
      throw new Error(`Invalid server response (${response.status}): ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch trip history");
    }
    return data;
  },
};
