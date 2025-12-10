import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "../../theme";
// Removed mock import - will use real API or fallback data
import AppIcon from "../../components/AppIcon";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

const BayCard = ({ bay, onAssign, styles }) => {
  const getStatusColor = () => {
    switch (bay.status) {
      case "free":
        return "#10b981";
      case "occupied":
        return "#ef4444";
      case "maintenance":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = () => {
    switch (bay.status) {
      case "free":
        return "statusFree";
      case "occupied":
        return "statusOccupied";
      case "maintenance":
        return "statusMaintenance";
      default:
        return "statusFree";
    }
  };

  return (
    <TouchableOpacity
      style={[styles.bayCard, { borderColor: getStatusColor() }]}
      onPress={() => bay.status === "free" && onAssign(bay.bayId)}
    >
      <View style={styles.bayIcon}>
        <AppIcon icon={getStatusIcon()} size={20} color={getStatusColor()} />
      </View>
      <Text style={styles.bayId}>{bay.bayId}</Text>
      <Text style={[styles.bayStatus, { color: getStatusColor() }]}>
        {bay.status === "free"
          ? "Ready"
          : bay.status === "occupied"
          ? bay.currentVehicle
          : "Out of Service"}
      </Text>
    </TouchableOpacity>
  );
};

const VehicleCard = ({ vehicle, onAssign, styles }) => {
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.queuePosition}>#{vehicle.queuePosition}</Text>
          <Text style={styles.vehicleId}>Vehicle: {vehicle.vehicleId}</Text>
        </View>
        {!vehicle.bayAssigned && (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => onAssign(vehicle)}
          >
            <Text style={styles.assignButtonText}>Assign</Text>
          </TouchableOpacity>
        )}
        {vehicle.bayAssigned && (
          <View style={styles.assignedBay}>
            <Text style={styles.assignedBayText}>{vehicle.bayAssigned}</Text>
          </View>
        )}
      </View>

      <Text style={styles.driverName}>{vehicle.driverName}</Text>
      <Text style={styles.cargoInfo}>
        {vehicle.cargoType} - {vehicle.quantity}
      </Text>
      <Text style={styles.timeInfo}>
        Arrived: {formatTime(vehicle.arrivalTime)} | Wait:{" "}
        {vehicle.estimatedWaitTime}
      </Text>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                vehicle.status === "loading" ? "#3b82f6" : "#6b7280",
            },
          ]}
        >
          <Text style={styles.statusText}>
            {vehicle.status === "loading" ? "Loading" : "Waiting"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function VehicleQueue() {
  useScreenPermissionSync("VehicleQueue");
  const [vehicles, setVehicles] = useState([]);
  const [bays, setBays] = useState([]);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      baySection: {
        backgroundColor: theme.colors.surfaceElevated,
        paddingVertical: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        paddingHorizontal: theme.spacing(4),
        marginBottom: theme.spacing(3),
      },
      bayContainer: {
        flexDirection: "row",
        paddingHorizontal: theme.spacing(4),
      },
      bayCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.md,
        borderWidth: 2,
        padding: theme.spacing(3),
        marginRight: theme.spacing(3),
        alignItems: "center",
        minWidth: 80,
        ...theme.shadows.level1,
      },
      bayIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(2),
      },
      bayId: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      bayStatus: {
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightMedium,
        textAlign: "center",
      },
      queueSection: {
        flex: 1,
        paddingTop: theme.spacing(4),
      },
      vehicleCard: {
        backgroundColor: theme.colors.surfaceElevated,
        marginHorizontal: theme.spacing(4),
        marginBottom: theme.spacing(3),
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      vehicleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      vehicleInfo: {
        flexDirection: "row",
        alignItems: "center",
      },
      queuePosition: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.primary,
        marginRight: theme.spacing(2),
      },
      vehicleId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      assignButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.sm,
      },
      assignButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      assignedBay: {
        backgroundColor: "#10b981",
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radii.sm,
      },
      assignedBayText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
      },
      driverName: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
      },
      cargoInfo: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
      },
      timeInfo: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing(2),
      },
      statusContainer: {
        flexDirection: "row",
      },
      statusBadge: {
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.sm,
      },
      statusText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.caption,
        fontWeight: theme.typography.weightSemiBold,
        textTransform: "uppercase",
      },
    })
  );

  const handleBayAssign = (bayId) => {
    Alert.alert("Bay Selected", `Selected ${bayId} for assignment`);
  };

  const handleVehicleAssign = (vehicle) => {
    const freeBays = bays.filter((bay) => bay.status === "free");

    if (freeBays.length === 0) {
      Alert.alert(
        "No Free Bays",
        "All bays are currently occupied or under maintenance"
      );
      return;
    }

    Alert.alert(
      "Assign Bay",
      `Assign ${vehicle.vehicleId} to which bay?`,
      freeBays
        .map((bay) => ({
          text: bay.bayId,
          onPress: () => assignVehicleToBay(vehicle.vehicleId, bay.bayId),
        }))
        .concat([{ text: "Cancel", style: "cancel" }])
    );
  };

  const assignVehicleToBay = (vehicleId, bayId) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.vehicleId === vehicleId
          ? { ...v, bayAssigned: bayId, status: "loading" }
          : v
      )
    );

    setBays((prev) =>
      prev.map((b) =>
        b.bayId === bayId
          ? { ...b, status: "occupied", currentVehicle: vehicleId }
          : b
      )
    );

    Alert.alert("Success", `${vehicleId} assigned to ${bayId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.baySection}>
        <Text style={styles.sectionTitle}>Bay Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bayContainer}>
            {bays.map((bay) => (
              <BayCard
                key={bay.bayId}
                bay={bay}
                onAssign={handleBayAssign}
                styles={styles}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.queueSection}>
        <Text style={styles.sectionTitle}>
          Vehicle Queue ({vehicles.length})
        </Text>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.vehicleId}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onAssign={handleVehicleAssign}
              styles={styles}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
