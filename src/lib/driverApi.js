import { CONFIG } from "../config";

/**
 * Driver API functions for trip management and operations
 */

export const driverApi = {
  // Trip Management
  acceptTrip: async ({ tripId, driverId }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/trip/${tripId}/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to accept trip");
    }
    return data;
  },

  // ! Not used in DriverDashboard (Planned)
  rejectTrip: async ({ tripId, driverId, reason }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/trip/${tripId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, reason }),
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
  }) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/driver/meter-reading/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          stationType, // 'MS' or 'DBS'
          readingType, // 'pre' or 'post'
          reading,
          confirmed, // true or false
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
      `${CONFIG.API_BASE_URL}/driver/meter-readings/${stationType}?token=${token}`
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
        headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      `${CONFIG.API_BASE_URL}/driver/trip/status?token=${token}`
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
      `${CONFIG.API_BASE_URL}/driver/${driverId}/token`
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get driver token");
    }
    return data;
  },
};
