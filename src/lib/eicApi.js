/**
 * EIC-specific API helpers
 */
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

// Error handling helper
const handleApiError = (error, fallbackMessage) => {
  console.error("EIC API Error:", error?.message || error);
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

// EIC - Get Incoming Stock Requests
export async function apiGetIncomingStockRequests() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/eic/stock-requests/`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    handleApiError(error, "Failed to fetch incoming stock requests");
  }
}

// EIC - Approve/Reject Stock Request
export async function apiUpdateStockRequestStatus(
  requestId,
  status,
  notes = "",
  driverId = null
) {

  
  try {
    const payload = { status, notes };
    
    // Include driverId only if provided (for approval with driver assignment)
    if (driverId) {
      payload.driverId = driverId;
    }
    

    
    const url = `${CONFIG.API_BASE_URL}/api/eic/stock-requests/${requestId}/approve/`;

    
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });



    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {

    handleApiError(error, "Failed to update stock request status");
  }
}

// EIC - Get Network Overview
export async function apiGetNetworkOverview() {
  let response;
  try {
     response = await fetch(`${CONFIG.API_BASE_URL}/api/eic/network-overview`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleApiError(error, "Failed to fetch network overview");
    // Return empty structure on error to prevent UI crashes
    return { overview: {} };
  }
}

// EIC - Get MS Cluster (list of linked DBS for an MS)
export async function apiGetMsCluster(msId) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/eic/stock-transfers/ms-dbs`,
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
    console.warn("MS cluster not available");
    return { cluster: {} };
  }
}

// EIC - Get Stock Transfers for a DBS
export async function apiGetStockTransfers(dbsId, { startDate, endDate } = {}) {
  try {
    const params = new URLSearchParams();
    if (dbsId) params.append("dbs_id", dbsId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const queryString = params.toString();
    const url = `${CONFIG.API_BASE_URL}/api/eic/stock-transfers/by-dbs${
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

// EIC - Get Pending Drivers for Approval
export async function apiGetPendingDrivers() {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/eic/driver-approvals/pending`;

    
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

    return { pending: [] };
  }
}

// EIC - Approve Driver
export async function apiApproveDriver(driverId, payload = {}) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/shifts/${driverId}/approve/`;

    
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });



    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("apiApproveDriver response:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {

    handleApiError(error, "Failed to approve driver");
  }
}

// EIC - Reject Driver
export async function apiRejectDriver(driverId, payload = {}) {
  try {
    const url = `${CONFIG.API_BASE_URL}/api/shifts/${driverId}/reject/`;

    
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });



    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("apiRejectDriver response:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {

    handleApiError(error, "Failed to reject driver");
  }
}
// EIC - Get Clusters
export async function apiGetClusters() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/eic/clusters/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Clusters not available");
    return { clusters: [] };
  }
}

// EIC - Update Cluster
export async function apiUpdateCluster(clusterId, payload = {}) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/eic/clusters/${clusterId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleApiError(error, "Failed to update cluster");
  }
}

// EIC - Get Alerts
export async function apiGetEicAlerts() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/eic/alerts`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleApiError(error, "Failed to fetch alerts");
    return { alerts: [] };
  }
}
