import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useThemedStyles } from "../theme";
import AppIcon from "./AppIcon";

const formatTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TripDetailsModal({ visible, trip, onClose }) {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing(2),
      },
      modalContainer: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: 12,
        overflow: "hidden",
        width: "100%",
        maxWidth: 500,
        height: "80%",
        flexDirection: "column",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      header: {
        backgroundColor: theme.colors.info,
        paddingHorizontal: theme.spacing(3),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      },
      headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
        flex: 1,
      },
      closeButton: {
        padding: 20,
        marginLeft: 15,
      },
      scrollView: {
        flex: 1,
        backgroundColor: theme.colors.surfaceElevated,
      },
      scrollContent: {
        padding: theme.spacing(3),
        paddingBottom: theme.spacing(4),
      },
      section: {
        marginBottom: theme.spacing(5),
        borderColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 1,
        borderRadius: 8,
        overflow: "hidden",
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.textPrimary,
        marginTop: 10,
        marginBottom: 10,
        textTransform: "uppercase",
        textAlign: "center",
        letterSpacing: 0.8,
      },
      statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        paddingHorizontal: theme.spacing(1),
      },
      statusLabel: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        fontWeight: "500",
      },
      statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 15,
      },
      statusText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        fontWeight: "500",
        textTransform: "capitalize",
        letterSpacing: 0.5,
      },
      routeCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: 8,
        paddingVertical: theme.spacing(1),
        paddingHorizontal: theme.spacing(1),
      },
      routeText: {
        fontSize: 15,
        color: theme.colors.textPrimary,
        fontWeight: "600",
        textAlign: "center",
      },
      detailsContainer: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: 8,
      },
      detailRow: {
        flexDirection: "row",
        paddingVertical: theme.spacing(2),
        paddingHorizontal: theme.spacing(2.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
        alignItems: "center",
      },
      detailRowLast: {
        borderBottomWidth: 0,
      },
      detailLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        flex: 1,
        fontWeight: "500",
      },
      detailValue: {
        fontSize: 13,
        color: theme.colors.textPrimary,
        flex: 1.5,
        fontWeight: "600",
        textAlign: "right",
      },
      infoCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: 8,
        padding: theme.spacing(2.5),
      },
      infoText: {
        fontSize: 13,
        color: theme.colors.textPrimary,
        lineHeight: 20,
        fontWeight: "500",
      },
      warningCard: {
        backgroundColor: "#fef2f2",
        borderRadius: 8,
        padding: theme.spacing(2.5),
        marginTop: theme.spacing(1.5),
        borderLeftWidth: 3,
        borderLeftColor: "#dc2626",
      },
      warningText: {
        fontSize: 13,
        color: "#dc2626",
        fontWeight: "600",
        lineHeight: 20,
      },
    })
  );

  if (!trip) return null;

  const getNormalizedStatus = () => {
    const status = String(trip.status || "").toUpperCase();

    if (
      status.includes("COMPLETED") ||
      status.includes("DELIVERED") ||
      status.includes("CONFIRMED")
    ) {
      return "COMPLETED";
    }

    if (status.includes("DISPATCHED") || status.includes("EN_ROUTE")) {
      return "DISPATCHED";
    }

    return "FILLING";
  };

  const status = getNormalizedStatus();

  const quantityText =
    typeof trip.quantity === "number"
      ? trip.quantity.toLocaleString("en-IN") + " L"
      : trip.quantity || "N/A";

  const DetailRow = ({ label, value, isLast = false }) => {
    if (
      !value ||
      value === "N/A" ||
      value === "Not specified" ||
      value === "Not assigned"
    ) {
      return null;
    }
    return (
      <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{trip.id || "Trip Details"}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <AppIcon icon="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={8}
            removeClippedSubviews={false}
            bounces={true}
            alwaysBounceVertical={true}
            decelerationRate="fast"
            nestedScrollEnabled={true}
            overScrollMode="always"
          >
            {/* Status Section */}

            {/* Route Section */}
            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route</Text>
              <View style={styles.routeCard}>
                <Text style={styles.routeText}>
                  {trip.route ||
                    `${trip.msName || trip.origin || "MS"} → ${
                      trip.dbsName || trip.destination || "DBS"
                    }`}
                </Text>
              </View>
            </View> */}

            {/* Trip Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Information</Text>
              <View style={styles.detailsContainer}>
                <DetailRow label="Trip ID" value={trip.id} />
                <View style={styles.detailsContainer}>
                  <DetailRow label="Status" value={status} />
                </View>
                <DetailRow
                  label="Product"
                  value={trip.product || trip.cargoType}
                />
                <DetailRow label="Quantity" value={quantityText} />
                <DetailRow label="Vehicle Number" value={trip.vehicleNumber} />
                <DetailRow label="Driver Name" value={trip.driverName} />
                <DetailRow label="Driver ID" value={trip.driverId} isLast />
              </View>
            </View>

            {/* Locations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Locations</Text>
              <View style={styles.detailsContainer}>
                <DetailRow
                  label="Source (MS)"
                  value={trip.msName || trip.origin}
                />
                <DetailRow label="MS ID" value={trip.msId} />
                <DetailRow
                  label="Destination (DBS)"
                  value={trip.dbsName || trip.destination}
                />
                <DetailRow label="DBS ID" value={trip.dbsId} />
                <DetailRow
                  label="Current Location"
                  value={trip.currentLocation}
                  isLast
                />
              </View>
            </View>

            {/* Schedule & Timing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.detailsContainer}>
                <DetailRow
                  label="Scheduled Day"
                  value={formatDay(trip.scheduledTime)}
                />
                <DetailRow
                  label="Scheduled Date"
                  value={formatDate(trip.scheduledTime)}
                />
                <DetailRow
                  label="Scheduled Time"
                  value={formatTime(trip.scheduledTime)}
                />
                <DetailRow
                  label="Departure Time"
                  value={
                    trip.departureTime
                      ? formatDateTime(trip.departureTime)
                      : null
                  }
                />
                <DetailRow
                  label="Actual Departure"
                  value={
                    trip.actualDepartureTime
                      ? formatDateTime(trip.actualDepartureTime)
                      : null
                  }
                />
                <DetailRow
                  label="Estimated Arrival"
                  value={
                    trip.estimatedArrival
                      ? formatDateTime(trip.estimatedArrival)
                      : null
                  }
                />
                <DetailRow
                  label="Actual Arrival"
                  value={
                    trip.actualArrivalTime
                      ? formatDateTime(trip.actualArrivalTime)
                      : null
                  }
                />
                <DetailRow
                  label="Created At"
                  value={trip.createdAt ? formatDateTime(trip.createdAt) : null}
                  isLast
                />
              </View>
            </View>

            {/* Progress */}
            {(trip.progressPercentage !== undefined ||
              trip.deliveredQuantity !== undefined ||
              trip.deliveredQty !== undefined) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <View style={styles.detailsContainer}>
                  {trip.progressPercentage !== undefined && (
                    <DetailRow
                      label="Progress"
                      value={`${trip.progressPercentage}%`}
                    />
                  )}
                  {(trip.deliveredQuantity !== undefined ||
                    trip.deliveredQty !== undefined) && (
                    <DetailRow
                      label="Delivered Quantity"
                      value={`${(
                        trip.deliveredQuantity ||
                        trip.deliveredQty ||
                        0
                      ).toLocaleString()} L`}
                      isLast
                    />
                  )}
                </View>
              </View>
            )}

            {/* Additional Information */}
            {/* {(trip.remarks || trip.notes || trip.blockReason) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {(trip.remarks || trip.notes) && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                      {trip.remarks || trip.notes}
                    </Text>
                  </View>
                )}
                {trip.blockReason && (
                  <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                      ⚠️ {trip.blockReason}
                    </Text>
                  </View>
                )}
              </View>
            )} */}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
