import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

export default function TransportTracking() {
  useScreenPermissionSync("TransportTracking");
  const { user } = useAuth();
  const dbsId = user?.dbsId;
  const themeRef = useRef(null);

  const {
    data: transportData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["transportTracking", dbsId],
    queryFn: () => GTS.getTransportTracking(dbsId),
    refetchInterval: 30000,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getDisplayStatus = (status) => {
    const normalizedStatus = (status ?? "").toString().toUpperCase();
    if (normalizedStatus === "FILLING" || normalizedStatus === "LOADING") {
      return "FILLING";
    }
    return "ACTIVE";
  };

  const getStatusColor = (status) => {
    return getDisplayStatus(status) === "FILLING" ? "#f59e0b" : "#3b82f6";
  };

  const getStatusIconName = (status) => {
    return getDisplayStatus(status) === "FILLING"
      ? "statusLoading"
      : "statusEnRoute";
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ! Later on remove this logic and bring it from backend
  const calculateETA = (estimatedArrival) => {
    const now = new Date();
    const eta = new Date(estimatedArrival);
    const diffMinutes = Math.floor((eta - now) / (1000 * 60));

    if (diffMinutes < 0) return "Overdue";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#f1f5f9",
      },
      summaryGrid: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
      },
      summaryCard: {
        backgroundColor: "#ffffff",
        padding: 8,
        borderRadius: 8,
        flex: 1,
        minWidth: 80,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
      },
      summaryNumber: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
      },
      summaryLabel: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 1,
        fontWeight: "500",
        textAlign: "center",
      },
      listContainer: {
        padding: 16,
      },
      transportCard: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
      },
      vehicleInfo: {
        flex: 1,
      },
      vehicleNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
      },
      driverName: {
        fontSize: 14,
        color: "#64748b",
      },
      statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
      },
      statusIcon: {
        marginRight: 4,
      },
      statusText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#ffffff",
        textTransform: "uppercase",
      },
      routeInfo: {
        marginBottom: 12,
      },
      routeText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1e293b",
      },
      cargoInfo: {
        fontSize: 13,
        color: "#64748b",
        marginTop: 2,
      },
      progressContainer: {
        marginBottom: 12,
      },
      progressBar: {
        height: 6,
        backgroundColor: "#e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 6,
      },
      progressFill: {
        height: "100%",
        borderRadius: 3,
      },
      progressText: {
        fontSize: 12,
        color: "#64748b",
        textAlign: "center",
      },
      timeInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
      },
      timeRow: {
        flex: 1,
      },
      timeLabel: {
        fontSize: 12,
        color: "#64748b",
      },
      timeValue: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1e293b",
        marginTop: 2,
      },
      locationText: {
        fontSize: 12,
        color: "#64748b",
        fontStyle: "italic",
      },
      loadingContainer: {
        alignItems: "center",
        paddingVertical: 40,
      },
      loadingText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 12,
      },
      emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
      },
      emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
      },
      emptySubtext: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 4,
        textAlign: "center",
      },
      errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      },
      errorText: {
        fontSize: 16,
        color: "#ef4444",
        marginBottom: 16,
        textAlign: "center",
      },
      retryButton: {
        backgroundColor: "#3b82f6",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
      },
      retryButtonText: {
        color: "#ffffff",
        fontWeight: "600",
      },
    });
  });

  const renderTransportCard = ({ item }) => (
    <TouchableOpacity style={styles.transportCard} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
          <Text style={styles.driverName}>Driver: {item.driverName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <AppIcon
            icon={getStatusIconName(item.status)}
            size={14}
            color="#ffffff"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{getDisplayStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <Text style={styles.routeText}>
          {item.origin} to {item.destination}
        </Text>
        {/* <Text style={styles.cargoInfo}>
          {item.cargoType} - {item.quantity.toLocaleString()}
        </Text> */}
      </View>
      {/* 
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progressPercentage}%`,
                backgroundColor: getStatusColor(item.status),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {item.progressPercentage}% Complete
        </Text>
      </View> */}

      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Departed:</Text>
          <Text style={styles.timeValue}>{formatTime(item.departureTime)}</Text>
        </View>
        <View style={styles.timeRow}>
          {/* <Text style={styles.timeLabel}>ETA:</Text>
          <Text style={styles.timeValue}>
            {calculateETA(item.estimatedArrival)}
          </Text> */}
        </View>
      </View>

      {/* <Text style={styles.locationText}>Location: {item.currentLocation}</Text> */}
    </TouchableOpacity>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transport data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const transports = transportData?.transports || [];
  const summary = transportData?.summary || {};

  const derivedSummary = transports.reduce(
    (acc, transport) => {
      if (getDisplayStatus(transport.status) === "FILLING") {
        acc.filling += 1;
      } else {
        acc.active += 1;
      }
      return acc;
    },
    { active: 0, filling: 0 }
  );

  const summaryData = {
    active: summary?.active ?? derivedSummary.active,
    filling: summary?.filling ?? summary?.loading ?? derivedSummary.filling,
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryTransportActive" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summaryData.active ?? 0}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryTransportRoute" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summaryData.filling ?? 0}</Text>
          <Text style={styles.summaryLabel}>Filling</Text>
        </View>
      </View>

      <FlatList
        data={transports}
        renderItem={renderTransportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeRef.current?.colors?.info || "#3b82f6"}
              />
              <Text style={styles.loadingText}>Loading transport data...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active transports</Text>
              <Text style={styles.emptySubtext}>
                Transport vehicles will appear here when active
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
