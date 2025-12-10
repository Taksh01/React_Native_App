import { CONFIG } from "../config";
import { useAuth } from "../store/auth";

/**
 * MS API functions for the new operations flow
 */

// Helper to create authenticated headers
const getAuthHeaders = () => {
  const { token } = useAuth.getState();
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  } else {
    console.warn(
      "[MS_API] No token available - request will be sent without authentication"
    );
  }

  return headers;
};

// Error handling helper
const handleApiError = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  if (error?.response?.status === 404) {
    throw new Error("Resource not found");
  }
  if (error?.response?.status >= 500) {
    throw new Error("Server error. Please try again later");
  }
  if (
    error?.message?.includes("Network Error") ||
    error?.code === "NETWORK_ERROR"
  ) {
    throw new Error("Network connection failed. Please check your connection");
  }
  throw new Error(fallbackMessage || "Operation failed. Please try again");
};

// MS - Token-based operations (Mirroring DBS structure)
export async function apiSignalArrival(tripToken) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/ms/arrival/confirm`;
    console.log("[msApi] apiSignalArrival URL:", url, "Token:", tripToken);
    
    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tripToken }),
    });
    
    const text = await response.text();
    console.log("[msApi] response:", response.status, text);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    try {
        return JSON.parse(text);
    } catch(e) { return text; }
  } catch (error) {
    handleApiError(error, "Failed to signal arrival");
  }
}

export async function apiGetPre(tripToken) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/ms/fill/${tripToken}/pre`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Pre-fill data not available");
    return { success: true, data: null };
  }
}

export async function apiStartDecant(tripToken, readings) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/ms/fill/start`;
    const payload = { tripToken, ...readings };
    console.log("[msApi] apiStartDecant URL:", url, JSON.stringify(payload));

    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[msApi] response:", response.status, text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "Failed to start fill");
  }
}

export async function apiEndDecant(tripToken, readings) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/ms/fill/end`;
    const payload = { tripToken, ...readings };
    console.log("[msApi] apiEndDecant URL:", url, JSON.stringify(payload));

    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[msApi] response:", response.status, text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "Failed to end fill");
  }
}

export async function apiOperatorAcknowledge(tripToken, deliveredQty) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/ms/fill/confirm`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tripToken, deliveredQty }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleApiError(error, "Failed to acknowledge fill");
  }
}

// Export object for backward compatibility if needed, but prefer named exports
export const msApi = {
  apiSignalArrival,
  apiGetPre,
  apiStartDecant,
  apiEndDecant,
  apiOperatorAcknowledge,
};

// Moved from client.js
export async function apiGetMsTripSchedule() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/ms/dashboard/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("MS schedule not available");
    return { trips: [] };
  }
}
// MS - Get Cluster (using EIC endpoint for now until MS specific one is ready)
export async function apiGetMsCluster(msId) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/ms/cluster`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { cluster: {} };
  }
}

// MS - Get Pending Arrivals
export async function apiGetPendingArrivals() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/ms/pending-arrivals`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      // gracefully fail if endpoint doesn't exist yet
      if (response.status === 404) return { arrivals: [] };
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Pending arrivals check failed:", error);
    return { arrivals: [] };
  }
}

// MS - Get Stock Transfers (using EIC endpoint for now)
export async function apiGetStockTransfers(dbsId, { startDate, endDate } = {}) {
  try {
    const params = new URLSearchParams();
    if (dbsId) params.append("dbs_id", dbsId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const queryString = params.toString();
    const url = `${CONFIG.API_BASE_URL}/api/ms/stock-transfers/by-dbs${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { transfers: [] };
  }
}
