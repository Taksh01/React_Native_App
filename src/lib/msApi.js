import { CONFIG } from "../config";

/**
 * MS API functions for the new operations flow
 */

export const msApi = {
  // Confirm truck arrival with token
  confirmArrival: async ({ token, truckNumber, operatorId }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/confirm-arrival`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, truckNumber, operatorId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to confirm arrival");
    }
    return data;
  },

  // Submit pre meter reading
  submitPreReading: async ({ sessionId, reading }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/pre-reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, reading }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit pre reading");
    }
    return data;
  },

  // Submit post meter reading
  submitPostReading: async ({ sessionId, reading }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/post-reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, reading }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit post reading");
    }
    return data;
  },

  // Confirm and post to SAP
  confirmAndPostToSAP: async ({ sessionId }) => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/confirm-sap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to post to SAP");
    }
    return data;
  },

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

  // Get session details (optional, for debugging)
  // ! Remove later if not needed
  getSession: async (sessionId) => {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/ms/session/${sessionId}`
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get session");
    }
    return data;
  },

  // Get all sessions (optional, for admin)
  // ! Remove later if not needed
  getAllSessions: async () => {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/sessions`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get sessions");
    }
    return data;
  },

  // Token management functions
  // ! Remove later if not needed
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
};
