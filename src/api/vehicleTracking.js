// Use constant to avoid scope issues
import { CONFIG } from "../config";
const BASE_URL = CONFIG.API_BASE_URL;

/**
 * Vehicle Tracking API Service
 * Production-ready service that can easily switch between mock and real data
 */

class VehicleTrackingAPI {
  constructor() {
    this.initialized = false;
  }

  _ensureInitialized() {
    if (!this.initialized) {

      this.initialized = true;
    }
  }

  /**
   * Test network connectivity to the backend
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    this._ensureInitialized();
    try {

      const response = await fetch(`${BASE_URL}/health`, {
        method: "GET",
        timeout: 5000,
      });
      const isConnected = response.ok;

      return isConnected;
    } catch (error) {
      console.error("[ERROR] Connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Get all active vehicles with real-time location data
   * @returns {Promise<Object>} Active vehicles data
   */
  async getActiveVehicles() {
    this._ensureInitialized();
    const url = `${BASE_URL}/eic/vehicles/active`;


    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ERROR] Response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("[ERROR] Network error details:", {
        message: error.message,
        name: error.name,
        url: url,
        baseURL: BASE_URL,
      });
      throw error;
    }
  }

  /**
   * Get location history for a specific vehicle
   * @param {string} vehicleId - Vehicle identifier
   * @returns {Promise<Object>} Location history data
   */
  async getVehicleLocationHistory(vehicleId) {
    try {
      const response = await fetch(
        `${BASE_URL}/eic/vehicles/${vehicleId}/location-history`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(
        `Failed to fetch location history for ${vehicleId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get planned route for a vehicle
   * @param {string} vehicleId - Vehicle identifier
   * @returns {Promise<Object>} Planned route data
   */
  async getVehiclePlannedRoute(vehicleId) {
    try {
      const response = await fetch(
        `${BASE_URL}/eic/vehicles/${vehicleId}/route`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch planned route for ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time vehicle updates (WebSocket)
   * This will be implemented when real-time backend is ready
   * @param {Function} onUpdate - Callback for vehicle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToVehicleUpdates(onUpdate) {
    // TODO: Implement WebSocket connection when backend supports it
    // For now, use polling as fallback
    const interval = setInterval(async () => {
      try {
        const data = await this.getActiveVehicles();
        onUpdate(data);
      } catch (error) {
        console.error("Real-time update failed:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }
}

export default new VehicleTrackingAPI();
