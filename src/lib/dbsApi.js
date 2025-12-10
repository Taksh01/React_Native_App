/**
 * DBS-specific API helpers (moved out of api.js for clarity)
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
      "[DBS_API] No token available - request will be sent without authentication"
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

// DBS - Token-based operations
export async function apiSignalArrival(tripToken) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/dbs/stock-requests/arrival/confirm`;
    console.log("[dbsApi] apiSignalArrival URL:", url, "Token:", tripToken);

    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tripToken }),
    });
    
    const text = await response.text();
    console.log("[dbsApi] response:", response.status, text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    try {
        return JSON.parse(text);
    } catch(e) { return text; }
  } catch (error) {
    console.error("apiSignalArrival error:", error);
    handleApiError(error, "Failed to signal arrival");
  }
}

export async function apiGetPre(tripToken) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/dbs/decant/${tripToken}/pre`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Pre-decant data not available");
    return defaultResponse;
  }
}

export async function apiStartDecant(tripToken, readings) {
  try {
    console.log("apiStartDecant called with:", { tripToken, readings });
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/dbs/stock-requests/decant/start`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tripToken, ...readings }),
      }
    );

    console.log("apiStartDecant response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("apiStartDecant response data:", data);
    return data;
  } catch (error) {
    console.error("apiStartDecant error:", error);
    handleApiError(error, "Failed to start decant");
  }
}

export async function apiEndDecant(tripToken, readings) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/dbs/stock-requests/decant/end`;
    const payload = { tripToken, ...readings };
    console.log("[dbsApi] apiEndDecant URL:", url, JSON.stringify(payload));
    
    const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[dbsApi] response:", response.status, text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("apiEndDecant error:", error);
    handleApiError(error, "Failed to end decant");
  }
}

export async function apiGetEnd(tripToken) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/dbs/decant/${tripToken}/end`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Post-decant data not available");
    return defaultResponse;
  }
}

export async function apiOperatorAcknowledge(tripToken, deliveredQty) {
  try {
    console.log("apiOperatorAcknowledge called with:", {
      tripToken,
      deliveredQty,
    });
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/dbs/stock-requests/decant/confirm`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tripToken, deliveredQty }),
      }
    );

    console.log("apiOperatorAcknowledge response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("apiOperatorAcknowledge response data:", data);
    return data;
  } catch (error) {
    console.error("apiOperatorAcknowledge error:", error);
    handleApiError(error, "Failed to acknowledge decant");
  }
}

// DBS - Manual Request
export async function apiSubmitManualRequest(requestData) {

  let response;
  try {
    const headers = getAuthHeaders();


    response = await fetch(`${CONFIG.API_BASE_URL}/api/stock-requests/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestData),
    });



    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    handleApiError(error, "Failed to submit manual request");
  }
}

// DBS - Get Trip Schedule
export async function apiGetDbsTripSchedule() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/dbs/dashboard/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    return { trips: [] };
  }
}

export async function getStockTransfers(dbsId, { startDate, endDate } = {}) {
  let response;
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = `${CONFIG.API_BASE_URL}/api/dbs/transfers${
      queryString ? `?${queryString}` : ""
    }`;

    response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.warn("Stock transfers not available");
    return { transfers: [] };
  }
}

export async function apiGetManualRequests() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/dbs/stock-requests`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("apiGetManualRequests response:", data);
    return data;
  } catch (error) {
    handleApiError(error, "Failed to fetch manual requests");
  }
}

// DBS - Get Pending Arrivals
export async function apiGetPendingArrivals() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/dbs/pending-arrivals`,
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
