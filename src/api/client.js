// src/api/client.js
import axios from "axios";
import { CONFIG } from "../config";

// Error handling helper
const handleApiError = (error, fallbackMessage) => {
  console.error("API Error:", error?.message || error);
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

export const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
});

export const GTS = {
  // AUTH
  async login(username, password, role) {
    try {
      const { data } = await api.post("/auth/login", {
        username,
        password,
        role,
      });
      return data;
    } catch (error) {
      handleApiError(error, "Login failed. Please check your credentials");
    }
  },

  // PROPOSALS
  async fetchProposals() {
    try {
      const { data } = await api.get("/proposals?sort=priority,score");
      return data;
    } catch (error) {
      console.warn("Proposals not available, returning empty list");
      return { proposals: [] };
    }
  },

  async approveProposal(id) {
    try {
      const { data } = await api.post(`/proposals/${id}/approve`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to approve proposal");
    }
  },

  // DRIVER
  async fetchMyTrip() {
    try {
      const { data } = await api.get("/driver/mytrip");
      return data;
    } catch (error) {
      console.warn("No trip assigned");
      return { trip: null };
    }
  },

  async driverAcceptTrip(id) {
    try {
      const { data } = await api.post(`/driver/trip/${id}/accept`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to accept trip");
    }
  },

  // MS OPERATIONS
  async msPrefill(tokenId) {
    try {
      const { data } = await api.get(`/ms/fill/${tokenId}/prefill`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to prefill data");
    }
  },

  async msStartFill(tokenId) {
    try {
      const { data } = await api.post(`/ms/fill/${tokenId}/start`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to start fill");
    }
  },

  async msEndFill(tokenId) {
    try {
      const { data } = await api.post(`/ms/fill/${tokenId}/end`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to end fill");
    }
  },

  async generateSTO(tripId) {
    try {
      const { data } = await api.post(`/sto/${tripId}/generate`);
      return data;
    } catch (error) {
      console.warn("STO generation not available");
      return { sto: null };
    }
  },

  // EIC OPERATIONS
  async getStockRequests(filters = {}) {
    try {
      const { data } = await api.get("/eic/stock-requests", {
        params: filters,
      });
      return data;
    } catch (error) {
      console.warn("Stock requests not available");
      return { requests: [] };
    }
  },

  async getStockRequest(requestId) {
    try {
      const { data } = await api.get(`/eic/stock-requests/${requestId}`);
      return data;
    } catch (error) {
      handleApiError(error, "Stock request not found");
    }
  },

  async approveStockRequest(requestId, approvalData) {
    try {
      const { data } = await api.post(
        `/eic/stock-requests/${requestId}/approve`,
        approvalData
      );
      return data;
    } catch (error) {
      handleApiError(error, "Failed to approve stock request");
    }
  },

  async rejectStockRequest(requestId, rejectionData) {
    try {
      const { data } = await api.post(
        `/eic/stock-requests/${requestId}/reject`,
        rejectionData
      );
      return data;
    } catch (error) {
      handleApiError(error, "Failed to reject stock request");
    }
  },

  async getEICDashboardStats() {
    try {
      const { data } = await api.get("/eic/dashboard");
      return data;
    } catch (error) {
      console.warn("EIC dashboard not available");
      return { stats: [], summary: {} };
    }
  },

  async getEICPermissions(userId) {
    try {
      const { data } = await api.get("/eic/permissions");
      return data;
    } catch (error) {
      console.warn("EIC permissions not available");
      return { permissions: {} };
    }
  },

  async getManualTokenAssignments() {
    try {
      const { data } = await api.get("/eic/manual-tokens");
      return data;
    } catch (error) {
      console.warn("Manual tokens not available");
      return { assignments: [] };
    }
  },

  async assignManualToken(payload = {}) {
    try {
      const { data } = await api.post("/eic/manual-tokens", payload);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to assign manual token");
    }
  },

  // NOTE: Driver approval APIs moved to lib/eicApi.js
  // - apiGetPendingDrivers
  // - apiApproveDriver
  // - apiRejectDriver

  async getClusters() {
    try {
      const { data } = await api.get("/eic/clusters");
      return data;
    } catch (error) {
      console.warn("Clusters not available");
      return { clusters: [] };
    }
  },

  async updateCluster(clusterId, payload = {}) {
    try {
      const { data } = await api.put(`/eic/clusters/${clusterId}`, payload);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to update cluster");
    }
  },

  async getReconciliationReports(filters = {}) {
    try {
      const { data } = await api.get("/eic/reconciliation/reports", {
        params: filters,
      });
      return data;
    } catch (error) {
      console.warn("Reconciliation reports not available");
      return { reports: [] };
    }
  },

  async triggerReconciliationAction(reportId, payload = {}) {
    try {
      const { data } = await api.post(
        `/eic/reconciliation/reports/${reportId}/actions`,
        payload
      );
      return data;
    } catch (error) {
      handleApiError(error, "Failed to trigger reconciliation action");
    }
  },

  // FDODO OPERATIONS
  async fdodoCredit(dbsId) {
    try {
      const endpoint = dbsId ? `/fdodo/${dbsId}/credit` : "/fdodo/credit";
      const { data } = await api.get(endpoint);
      return data;
    } catch (error) {
      console.warn("FDODO credit not available");
      return { credit: 0, status: "unknown" };
    }
  },

  async fdodoRequest(payload) {
    try {
      const { data } = await api.post("/fdodo/requests", payload);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to submit FDODO request");
    }
  },

  async getFdodoRequests(dbsId) {
    try {
      const endpoint = dbsId ? `/fdodo/${dbsId}/requests` : "/fdodo/requests";
      const { data } = await api.get(endpoint);
      return data;
    } catch (error) {
      console.warn("FDODO requests not available");
      return { requests: [] };
    }
  },

  async fdodoConfirmFill(requestId, payload) {
    try {
      const { data } = await api.post(
        `/fdodo/requests/${requestId}/confirm`,
        payload
      );
      return data;
    } catch (error) {
      handleApiError(error, "Failed to confirm FDODO fill");
    }
  },

  async getFdodoDashboard(dbsId) {
    try {
      const endpoint = dbsId ? `/fdodo/${dbsId}/dashboard` : "/fdodo/dashboard";
      const { data } = await api.get(endpoint);
      return data;
    } catch (error) {
      console.warn("FDODO dashboard not available");
      return { dashboard: {} };
    }
  },

  // DBS OPERATIONS
  async dbsPreDecant(tripId) {
    try {
      const { data } = await api.get(`/dbs/decant/${tripId}/pre`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to get pre-decant data");
    }
  },

  async dbsStartDecant(tripId) {
    try {
      const { data } = await api.post(`/dbs/decant/${tripId}/start`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to start decant");
    }
  },

  async dbsEndDecant(tripId) {
    try {
      const { data } = await api.post(`/dbs/decant/${tripId}/end`);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to end decant");
    }
  },

  async dbsConfirmDecant(tripId, { operatorSig, driverSig, deliveredQty }) {
    try {
      const { data } = await api.post(`/dbs/decant/${tripId}/confirm`, {
        operatorSig,
        driverSig,
        deliveredQty,
      });
      return data;
    } catch (error) {
      handleApiError(error, "Failed to confirm decant");
    }
  },

  async dbsDeliveries() {
    try {
      const { data } = await api.get(`/dbs/deliveries`);
      return data;
    } catch (error) {
      console.warn("Deliveries not available");
      return { deliveries: [] };
    }
  },

  async dbsHistory() {
    try {
      const { data } = await api.get(`/dbs/history`);
      return data;
    } catch (error) {
      console.warn("History not available");
      return { history: [] };
    }
  },

  async dbsReconcile() {
    try {
      const { data } = await api.get(`/dbs/reconcile`);
      return data;
    } catch (error) {
      console.warn("Reconcile data not available");
      return { reconcile: [] };
    }
  },

  async dbsPushReconcile(ids) {
    try {
      const { data } = await api.post(`/dbs/reconcile/push`, { ids });
      return data;
    } catch (error) {
      handleApiError(error, "Failed to push reconcile data");
    }
  },

  async dbsManualRequest(payload) {
    try {
      const { data } = await api.post(`/dbs/requests`, payload);
      return data;
    } catch (error) {
      handleApiError(error, "Failed to submit manual request");
    }
  },

  // CUSTOMER OPERATIONS
  async getCustomerDashboard(dbsId) {
    try {
      const { data } = await api.get(`/customer/${dbsId}/dashboard`);
      return data;
    } catch (error) {
      console.warn("Customer dashboard not available");
      return { dashboard: {} };
    }
  },

  async getCurrentStocks(dbsId) {
    try {
      const { data } = await api.get(`/customer/${dbsId}/stocks`);
      return data;
    } catch (error) {
      console.warn("Stock data not available");
      return { stocks: [] };
    }
  },

  async getTransportTracking(dbsId) {
    try {
      const { data } = await api.get(`/customer/${dbsId}/transport`);
      return data;
    } catch (error) {
      console.warn("Transport tracking not available");
      return { transports: [] };
    }
  },



  async getPendingTrips(dbsId) {
    try {
      const { data } = await api.get(`/customer/${dbsId}/pending-trips`);
      return data;
    } catch (error) {
      console.warn("Pending trips not available");
      return { trips: [] };
    }
  },





  async getMsCluster(msId) {
    try {
      const { data } = await api.get(`/ms/${msId}/cluster`);
      return data;
    } catch (error) {
      console.warn("MS cluster not available");
      return { cluster: {} };
    }
  },



  async getCustomerPermissions(userId) {
    try {
      const { data } = await api.get(`/customer/permissions/${userId}`);
      return data;
    } catch (error) {
      console.warn("Customer permissions not available");
      return { permissions: {} };
    }
  },

  async acceptTrip(tripId, userId) {
    try {
      const { data } = await api.post(`/customer/trips/${tripId}/accept`, {
        userId,
      });
      return data;
    } catch (error) {
      handleApiError(error, "Failed to accept trip");
    }
  },
};
