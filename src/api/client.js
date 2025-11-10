// src/api/client.js
import axios from "axios";
import { CONFIG } from "../config";
import * as mock from "./mock";
import * as eicMock from "./eicMock";

export const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
});

export const GTS = {
  // ⬇️ add role as an optional 3rd argument
  async login(username, password, role) {
    if (CONFIG.MOCK_MODE) return mock.mockLogin(username, password, role);
    // send role too (backend can ignore it if not needed)
    // amazonq-ignore-next-line
    const { data } = await api.post("/auth/login", {
      username,
      password,
      role,
    });
    return data;
  },

  // amazonq-ignore-next-line
  async fetchProposals() {
    if (CONFIG.MOCK_MODE) return mock.fetchProposals();
    const { data } = await api.get("/proposals?sort=priority,score");
    return data;
  },

  async approveProposal(id) {
    if (CONFIG.MOCK_MODE) return mock.approveProposal(id);
    const { data } = await api.post(`/proposals/${id}/approve`);
    return data;
  },

  async fetchMyTrip() {
    if (CONFIG.MOCK_MODE) return mock.fetchMyTrip();
    const { data } = await api.get("/driver/mytrip");
    return data;
  },

  async driverAcceptTrip(id) {
    if (CONFIG.MOCK_MODE) return mock.driverAcceptTrip(id);
    const { data } = await api.post(`/driver/trip/${id}/accept`);
    return data;
  },

  async msPrefill(tokenId) {
    if (CONFIG.MOCK_MODE) return mock.msPrefill(tokenId);
    const { data } = await api.get(`/ms/fill/${tokenId}/prefill`);
    return data;
  },

  async msStartFill(tokenId) {
    if (CONFIG.MOCK_MODE) return mock.msStartFill(tokenId);
    const { data } = await api.post(`/ms/fill/${tokenId}/start`);
    return data;
  },

  async msEndFill(tokenId) {
    if (CONFIG.MOCK_MODE) return mock.msEndFill(tokenId);
    const { data } = await api.post(`/ms/fill/${tokenId}/end`);
    return data;
  },

  async generateSTO(tripId) {
    if (CONFIG.MOCK_MODE) return mock.generateSTO?.(tripId) || {};
    const { data } = await api.post(`/sto/${tripId}/generate`);
    return data;
  },

  // EIC Stock Requests API
  async getStockRequests(filters = {}) {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetStockRequests(filters);
    try {
      const { data } = await api.get("/eic/stock-requests", { params: filters });
      return data;
    } catch (error) {
      console.warn(
        "Falling back to mock stock requests:",
        error?.message || error
      );
      return eicMock.mockGetStockRequests(filters);
    }
  },

  async getStockRequest(requestId) {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetStockRequest(requestId);
    try {
      const { data } = await api.get(`/eic/stock-requests/${requestId}`);
      return data;
    } catch (error) {
      console.warn(
        `Falling back to mock stock request ${requestId}:`,
        error?.message || error
      );
      return eicMock.mockGetStockRequest(requestId);
    }
  },

  async approveStockRequest(requestId, approvalData) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockApproveStockRequest(requestId, approvalData);
    try {
      const { data } = await api.post(
        `/eic/stock-requests/${requestId}/approve`,
        approvalData
      );
      return data;
    } catch (error) {
      console.warn(
        `Approve stock request fallback to mock (${requestId}):`,
        error?.message || error
      );
      return eicMock.mockApproveStockRequest(requestId, approvalData);
    }
  },

  async rejectStockRequest(requestId, rejectionData) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockRejectStockRequest(requestId, rejectionData);
    try {
      const { data } = await api.post(
        `/eic/stock-requests/${requestId}/reject`,
        rejectionData
      );
      return data;
    } catch (error) {
      console.warn(
        `Reject stock request fallback to mock (${requestId}):`,
        error?.message || error
      );
      return eicMock.mockRejectStockRequest(requestId, rejectionData);
    }
  },

  async getEICDashboardStats() {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetEICDashboardStats();
    try {
      const { data } = await api.get("/eic/dashboard");
      return data;
    } catch (error) {
      console.warn(
        "Falling back to mock EIC dashboard stats:",
        error?.message || error
      );
      return eicMock.mockGetEICDashboardStats();
    }
  },

  async getEICPermissions(userId) {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetEICPermissions(userId);
    try {
      const { data } = await api.get("/eic/permissions");
      return data;
    } catch (error) {
      console.warn(
        "Falling back to mock EIC permissions:",
        error?.message || error
      );
      return eicMock.mockGetEICPermissions(userId);
    }
  },

  async getManualTokenAssignments() {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetManualTokens();
    const { data } = await api.get("/eic/manual-tokens");
    return data;
  },

  async assignManualToken(payload = {}) {
    if (CONFIG.MOCK_MODE) return eicMock.mockAssignManualToken(payload);
    const { data } = await api.post("/eic/manual-tokens", payload);
    return data;
  },

  async getPendingDrivers() {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetPendingDrivers();
    try {
      const { data } = await api.get("/eic/driver-approvals/pending");
      return data;
    } catch (error) {
      console.warn(
        "Falling back to mock pending drivers:",
        error?.message || error
      );
      return eicMock.mockGetPendingDrivers();
    }
  },

  async approveDriver(driverId, payload = {}) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockApproveDriver(driverId, payload);
    const { data } = await api.post(
      `/eic/driver-approvals/${driverId}/approve`,
      payload
    );
    return data;
  },

  async rejectDriver(driverId, payload = {}) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockRejectDriver(driverId, payload);
    const { data } = await api.post(
      `/eic/driver-approvals/${driverId}/reject`,
      payload
    );
    return data;
  },

  async getClusters() {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetClusters();
    try {
      const { data } = await api.get("/eic/clusters");
      return data;
    } catch (error) {
      console.warn(
        "Falling back to mock clusters:",
        error?.message || error
      );
      return eicMock.mockGetClusters();
    }
  },

  async updateCluster(clusterId, payload = {}) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockUpdateCluster(clusterId, payload);
    const { data } = await api.put(`/eic/clusters/${clusterId}`, payload);
    return data;
  },

  async getReconciliationReports(filters = {}) {
    if (CONFIG.MOCK_MODE) return eicMock.mockGetReconciliationReports(filters);
    const { data } = await api.get("/eic/reconciliation/reports", {
      params: filters,
    });
    return data;
  },

  async triggerReconciliationAction(reportId, payload = {}) {
    if (CONFIG.MOCK_MODE)
      return eicMock.mockTriggerReconciliationAction(reportId, payload);
    const { data } = await api.post(
      `/eic/reconciliation/reports/${reportId}/actions`,
      payload
    );
    return data;
  },

  async fdodoCredit(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.fdodoCredit?.(dbsId) || {};
    const endpoint = dbsId ? `/fdodo/${dbsId}/credit` : "/fdodo/credit";
    const { data } = await api.get(endpoint);
    return data;
  },

  async fdodoRequest(payload) {
    if (CONFIG.MOCK_MODE) return mock.fdodoRequest?.(payload) || {};
    const { data } = await api.post("/fdodo/requests", payload);
    return data;
  },

  async getFdodoRequests(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getFdodoRequests?.(dbsId) || {};
    const endpoint = dbsId ? `/fdodo/${dbsId}/requests` : "/fdodo/requests";
    const { data } = await api.get(endpoint);
    return data;
  },

  async fdodoConfirmFill(requestId, payload) {
    if (CONFIG.MOCK_MODE)
      return mock.fdodoConfirmFill?.(requestId, payload) || {};
    const { data } = await api.post(
      `/fdodo/requests/${requestId}/confirm`,
      payload
    );
    return data;
  },

  async getFdodoDashboard(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getFdodoDashboard?.(dbsId) || {};
    const endpoint = dbsId ? `/fdodo/${dbsId}/dashboard` : "/fdodo/dashboard";
    const { data } = await api.get(endpoint);
    return data;
  },

  // ---- DBS Operator endpoints ----
  async dbsPreDecant(tripId) {
    if (CONFIG.MOCK_MODE) return mock.dbsPreDecant?.(tripId) || {};
    const { data } = await api.get(`/dbs/decant/${tripId}/pre`);
    return data;
  },
  async dbsStartDecant(tripId) {
    if (CONFIG.MOCK_MODE) return mock.dbsStartDecant?.(tripId) || {};
    const { data } = await api.post(`/dbs/decant/${tripId}/start`);
    return data;
  },
  async dbsEndDecant(tripId) {
    if (CONFIG.MOCK_MODE) return mock.dbsEndDecant?.(tripId) || {};
    const { data } = await api.post(`/dbs/decant/${tripId}/end`);
    return data;
  },
  async dbsConfirmDecant(tripId, { operatorSig, driverSig, deliveredQty }) {
    if (CONFIG.MOCK_MODE)
      return (
        mock.dbsConfirmDecant?.(tripId, {
          operatorSig,
          driverSig,
          deliveredQty,
        }) || {}
      );
    // amazonq-ignore-next-line
    const { data } = await api.post(`/dbs/decant/${tripId}/confirm`, {
      operatorSig,
      driverSig,
      deliveredQty,
    });
    return data;
  },

  // Lists
  async dbsDeliveries() {
    if (CONFIG.MOCK_MODE) return mock.dbsDeliveries?.() || {};
    const { data } = await api.get(`/dbs/deliveries`);
    return data;
  },
  async dbsHistory() {
    if (CONFIG.MOCK_MODE) return mock.dbsHistory?.() || {};
    const { data } = await api.get(`/dbs/history`);
    return data;
  },

  // Reconcile
  async dbsReconcile() {
    if (CONFIG.MOCK_MODE) return mock.dbsReconcile?.() || {};
    const { data } = await api.get(`/dbs/reconcile`);
    return data;
  },
  async dbsPushReconcile(ids) {
    if (CONFIG.MOCK_MODE) return mock.dbsPushReconcile?.(ids) || {};
    const { data } = await api.post(`/dbs/reconcile/push`, { ids });
    return data;
  },

  // Manual Request (simple demo payload; adjust to your backend later)
  async dbsManualRequest(payload) {
    if (CONFIG.MOCK_MODE) return mock.dbsManualRequest?.(payload) || {};
    const { data } = await api.post(`/dbs/requests`, payload);
    return data;
  },

  // Customer API endpoints
  async getCustomerDashboard(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getCustomerDashboard(dbsId);
    const { data } = await api.get(`/customer/${dbsId}/dashboard`);
    return data;
  },

  async getCurrentStocks(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getCurrentStocks(dbsId);
    const { data } = await api.get(`/customer/${dbsId}/stocks`);
    return data;
  },

  async getTransportTracking(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getTransportTracking(dbsId);
    const { data } = await api.get(`/customer/${dbsId}/transport`);
    return data;
  },

  async getStockTransfers(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getStockTransfers(dbsId);
    const { data } = await api.get(`/customer/${dbsId}/transfers`);
    return data;
  },

  async getPendingTrips(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getPendingTrips(dbsId);
    const { data } = await api.get(`/customer/${dbsId}/pending-trips`);
    return data;
  },

  async getDbsTripSchedule(dbsId) {
    if (CONFIG.MOCK_MODE) return mock.getDbsTripSchedule(dbsId);
    const { data } = await api.get(`/dbs/${dbsId}/schedule`);
    return data;
  },

  async getMsTripSchedule(msId) {
    if (CONFIG.MOCK_MODE) return mock.getMsTripSchedule(msId);
    const { data } = await api.get(`/ms/${msId}/schedule`);
    return data;
  },

  async getNetworkOverview() {
    if (CONFIG.MOCK_MODE) return mock.getNetworkOverview();
    const { data } = await api.get(`/network/overview`);
    return data;
  },

  async getCustomerPermissions(userId) {
    if (CONFIG.MOCK_MODE) return mock.getCustomerPermissions(userId);
    const { data } = await api.get(`/customer/permissions/${userId}`);
    return data;
  },

  async acceptTrip(tripId, userId) {
    if (CONFIG.MOCK_MODE) return mock.acceptTrip(tripId, userId);
    const { data } = await api.post(`/customer/trips/${tripId}/accept`, { userId });
    return data;
  },
};
