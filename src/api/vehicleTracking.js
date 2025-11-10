// Use constant to avoid scope issues
const BASE_URL = 'http://192.168.1.167:5000';

/**
 * Vehicle Tracking API Service
 * Production-ready service that can easily switch between mock and real data
 */

class VehicleTrackingAPI {
  constructor() {
    console.log('[INFO] VehicleTrackingAPI initialized with baseURL:', BASE_URL);
  }

  /**
   * Test network connectivity to the backend
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('[INFO] Testing connection to:', `${BASE_URL}/health`);
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      const isConnected = response.ok;
      console.log(isConnected ? '[OK] Backend connection successful' : '[WARN] Backend connection failed');
      return isConnected;
    } catch (error) {
      console.error('[ERROR] Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get all active vehicles with real-time location data
   * @returns {Promise<Object>} Active vehicles data
   */
  async getActiveVehicles() {
    const url = `${BASE_URL}/eic/vehicles/active`;
    console.log('[INFO] Fetching vehicles from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      console.log('[INFO] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ERROR] Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[OK] Vehicles fetched successfully:', data.totalActive, 'vehicles');
      return data;
    } catch (error) {
      console.error('[ERROR] Network error details:', {
        message: error.message,
        name: error.name,
        url: url,
        baseURL: BASE_URL
      });
      
      // Fallback to mock data for development
      console.log('[WARN] Using fallback mock data');
      return this.getMockVehicleData();
    }
  }

  /**
   * Fallback mock data when network fails
   * @returns {Object} Mock vehicle data
   */
  getMockVehicleData() {
    return {
      vehicles: [
        {
          vehicleId: "GJ-01-AB-1234",
          tripId: "TRIP_2025_001",
          driverId: "DRV_123",
          driverName: "Rakesh Patel",
          currentLocation: {
            latitude: 23.0225,
            longitude: 72.5714,
            address: "Near Sarkhej Circle, Ahmedabad"
          },
          destination: {
            latitude: 23.0896,
            longitude: 72.6136,
            address: "DBS Station Bopal, Ahmedabad"
          },
          speed: 45,
          eta: new Date(Date.now() + 30 * 60000).toISOString(),
          routeAdherence: "ON_ROUTE",
          deviationDistance: 0,
          fuelLevel: 85,
          lastUpdated: new Date().toISOString(),
          status: "IN_TRANSIT"
        },
        {
          vehicleId: "GJ-02-CD-5678",
          tripId: "TRIP_2025_002",
          driverId: "DRV_456",
          driverName: "Suresh Kumar",
          currentLocation: {
            latitude: 22.9734,
            longitude: 72.6046,
            address: "Paldi Cross Roads, Ahmedabad"
          },
          destination: {
            latitude: 23.1685,
            longitude: 72.6386,
            address: "MS Station Gandhinagar"
          },
          speed: 35,
          eta: new Date(Date.now() + 45 * 60000).toISOString(),
          routeAdherence: "MINOR_DEVIATION",
          deviationDistance: 200,
          fuelLevel: 70,
          lastUpdated: new Date().toISOString(),
          status: "IN_TRANSIT"
        }
      ],
      totalActive: 2,
      timestamp: new Date().toISOString(),
      source: "FALLBACK_MOCK"
    };
  }

  /**
   * Get location history for a specific vehicle
   * @param {string} vehicleId - Vehicle identifier
   * @returns {Promise<Object>} Location history data
   */
  async getVehicleLocationHistory(vehicleId) {
    try {
      const response = await fetch(`${BASE_URL}/eic/vehicles/${vehicleId}/location-history`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch location history for ${vehicleId}:`, error);
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
      const response = await fetch(`${BASE_URL}/eic/vehicles/${vehicleId}/route`);
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
        console.error('Real-time update failed:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }
}

export default new VehicleTrackingAPI();
