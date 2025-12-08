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
  // Trip Management
  acceptTrip: async ({ tripId }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/driver-trips/accept/`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stock_request_id: tripId }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to accept trip");
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
    const response = await fetch(`${CONFIG.API_BASE_URL}/driver/arrival/ms`, {
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
    const response = await fetch(`${CONFIG.API_BASE_URL}/driver/arrival/dbs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
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
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/meter-reading/confirm`,
      {
        method: "POST",
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          token,
          stationType, // 'MS' or 'DBS'
          readingType, // 'pre' or 'post'
          reading,
          confirmed, // true or false
          // optional base64 photo (string)
          ...(photoBase64 ? { photoBase64 } : {}),
        }),
      }
    );

    const data = await response.json();
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
      `${CONFIG.API_BASE_URL}/driver/trip/complete`,
      {
        method: "POST",
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
    emergencyType,
    location,
    description,
    driverId,
  }) => {
    const safeLocation = location || {};
    const response = await fetch(`${CONFIG.API_BASE_URL}/driver/emergency`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        token,
        emergencyType,
        ...(driverId ? { driverId } : {}),
        location: {
          latitude: safeLocation.latitude ?? 0,
          longitude: safeLocation.longitude ?? 0,
        },
        description,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to report emergency");
    }
    return data;
  },

  // Trip Status
  getTripStatus: async ({ token }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/trip/status?token=${token}`,
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
  getTripHistory: async ({ driverId, page = 1, limit = 50 } = {}) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/${driverId}/trips?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch trip history");
    }
    return data;
  },
};
