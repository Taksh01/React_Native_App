import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AppIcon from "../AppIcon";

/**
 * MapView Component for Driver Navigation
 * 
 * For now, this is a placeholder that simulates map functionality.
 * In production, this would integrate with:
 * - react-native-maps
 * - Google Maps API
 * - Real-time GPS tracking
 */

export default function MapView({ 
  destination, 
  currentLocation, 
  onLocationUpdate,
  showRoute = true 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    // Simulate loading map and calculating route
    const timer = setTimeout(() => {
      setRouteInfo({
        distance: "15.2 km",
        duration: "25 mins",
        traffic: "Light traffic"
      });
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [destination]);

  // Simulate location updates
  useEffect(() => {
    if (!isLoading && onLocationUpdate) {
      const locationTimer = setInterval(() => {
        // Mock location update
        const mockLocation = {
          latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
          longitude: 77.5946 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now()
        };
        onLocationUpdate(mockLocation);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(locationTimer);
    }
  }, [isLoading, onLocationUpdate]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.titleRow}>
          <AppIcon icon="map" size={18} color="#007AFF" style={styles.titleIcon} />
          <Text style={styles.mapTitle}>Navigation</Text>
        </View>
        {/* Destination Info */}
        <View style={styles.destinationCard}>
          <Text style={styles.destinationTitle}>Destination: {destination?.name}</Text>
          <Text style={styles.destinationAddress}>{destination?.address}</Text>
        </View>

        {/* Route Info */}
        {showRoute && routeInfo && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Distance:</Text>
              <Text style={styles.routeValue}>{routeInfo.distance}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>ETA:</Text>
              <Text style={styles.routeValue}>{routeInfo.duration}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Traffic:</Text>
              <Text style={styles.routeValue}>{routeInfo.traffic}</Text>
            </View>
          </View>
        )}

        {/* Current Location */}
        {currentLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Your Location</Text>
            <Text style={styles.locationCoords}>
              {currentLocation.latitude?.toFixed(4)}, {currentLocation.longitude?.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Map Visual Placeholder */}
        <View style={styles.mapVisual}>
          <AppIcon icon="mapTruck" size={32} color="#007AFF" style={styles.mapVisualIcon} />
          <Text style={styles.mapVisualLabel}>You are here</Text>
          <View style={styles.routeLine} />
          <AppIcon icon="stationPin" size={24} color="#FF3B30" style={styles.destinationMarkerIcon} />
          <Text style={styles.destinationLabel}>{destination?.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
    minHeight: 300,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    marginRight: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  destinationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
  },
  routeCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routeLabel: {
    fontSize: 14,
    color: '#666',
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  mapVisual: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
  },
  mapVisualIcon: {
    marginBottom: 4,
  },
  mapVisualLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#007AFF',
    marginVertical: 8,
  },
  destinationMarkerIcon: {
    marginBottom: 4,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },
});


