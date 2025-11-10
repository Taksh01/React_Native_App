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

export default function StockTransfers() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-09";
  const themeRef = useRef(null);

  const {
    data: transfersData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["stockTransfers", dbsId],
    queryFn: () => GTS.getStockTransfers(dbsId),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'],
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getDisplayStatus = (status) => {
    return (status ?? "").toString().toUpperCase() === "COMPLETED"
      ? "COMPLETED"
      : "IN_PROGRESS";
  };

  const getStatusColor = (status) => {
    return getDisplayStatus(status) === "COMPLETED" ? "#10b981" : "#3b82f6";
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  summaryContainer: {
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
  transferCard: {
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
  transferInfo: {
    flex: 1,
  },
  transferTypeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transferIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  transferType: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  transferId: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  transferDetails: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 13,
    color: "#64748b",
    width: 40,
  },
  locationValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
    flex: 1,
  },
  productInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  timeInfo: {
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  timeValue: {
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "500",
  },
  notes: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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

  const renderTransferCard = ({ item }) => (
    <TouchableOpacity style={styles.transferCard} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.transferInfo}>
          <View style={styles.transferTypeRow}>
            <View style={styles.transferIcon}>
              <AppIcon icon="transferIncoming" size={14} color="#10b981" />
            </View>
            <Text style={[styles.transferType, { color: "#10b981" }]}>
              Incoming
            </Text>
          </View>
          <Text style={styles.transferId}>{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getDisplayStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.transferDetails}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>From:</Text>
          <Text style={styles.locationValue}>{item.fromLocation}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>To:</Text>
          <Text style={styles.locationValue}>{item.toLocation}</Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.quantity}>{item.quantity.toLocaleString()} L</Text>
      </View>

      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Initiated:</Text>
          <Text style={styles.timeValue}>{formatDate(item.initiatedAt)}</Text>
        </View>
        {item.completedAt && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Completed:</Text>
            <Text style={styles.timeValue}>{formatDate(item.completedAt)}</Text>
          </View>
        )}
        {item.estimatedCompletion && !item.completedAt && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Expected:</Text>
            <Text style={styles.timeValue}>{formatDate(item.estimatedCompletion)}</Text>
          </View>
        )}
      </View>

      {item.notes && (
        <Text style={styles.notes}>Note: {item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transfer data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const allTransfers = transfersData?.transfers || [];
  const transfers = allTransfers.filter(
    (transfer) => (transfer.type ?? "").toString().toUpperCase() === "INCOMING"
  );
  const summary = transfersData?.summary || {};

  const derivedSummary = transfers.reduce(
    (acc, transfer) => {
      acc.total += 1;
      if (getDisplayStatus(transfer.status) === "COMPLETED") {
        acc.completed += 1;
      } else {
        acc.inProgress += 1;
      }
      return acc;
    },
    { total: 0, inProgress: 0, completed: 0 }
  );

  const summaryData = {
    total: summary?.incomingTotal ?? summary?.totalTransfers ?? derivedSummary.total,
    inProgress:
      summary?.incomingInProgress ?? summary?.inProgress ?? derivedSummary.inProgress,
    completed:
      summary?.incomingCompleted ?? summary?.completed ?? derivedSummary.completed,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryTotal" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summaryData.total ?? 0}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryProgress" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summaryData.inProgress ?? 0}</Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryCompleted" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summaryData.completed ?? 0}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={transfers}
        renderItem={renderTransferCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeRef.current?.colors?.info || "#3b82f6"} />
              <Text style={styles.loadingText}>Loading transfer data...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stock transfers</Text>
              <Text style={styles.emptySubtext}>Transfer operations will appear here when initiated</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}


