/**
 * SGL Customer-specific API helpers
 */
import { CONFIG } from "../config";
import { useAuth } from "../store/auth";

// Default response for unimplemented features
const defaultResponse = {
  success: true,
  data: null,
  message: "Feature not implemented",
};

// Helper to create authenticated headers
const getAuthHeaders = () => {
  const { token } = useAuth.getState();

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  } else {
    console.warn(
      "[SGL_API] No token available - request will be sent without authentication"
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

export async function getCustomerDashboard() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/customer/dashboard`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Customer dashboard not available");
    return { dashboard: {} };
  }
}

export async function getPendingTrips() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/customer/pending-trips`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Pending trips not available");
    return { trips: [] };
  }
}

export async function acceptTrip(tripId) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/customer/trips/${tripId}/accept`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    handleApiError(error, "Failed to accept trip");
  }
}

export async function getCustomerPermissions() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/customer/permissions`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Customer permissions not available");
    return { permissions: {} };
  }
}

export async function getMsCluster(msId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ms/${msId}/cluster`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("MS cluster not available");
    return { cluster: {} };
  }
}

export async function getStockTransfers(ignoredDbsId, { startDate, endDate } = {}) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = `${CONFIG.API_BASE_URL}/api/customer/transfers${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("[API] Fetching stock transfers:", url);

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API_ERROR] Stock transfers failed:", response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[API] Stock Transfers Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.warn("Stock transfers not available:", error);
    return { transfers: [] };
  }
}
