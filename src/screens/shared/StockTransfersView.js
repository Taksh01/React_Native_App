import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";

export default function StockTransfersView({
  dbsId,
  headerComponent = null,
  requireSelectionTitle = "Select a DBS to view stock transfers",
  requireSelectionSubtitle = "Choose a depot to load transfer activity",
  direction = "incoming",
  transferTypeFilters = null,
  originLabelOverride = null,
  destinationLabelOverride = null,
}) {
  const themeRef = useRef(null);
  const normalizedDirection =
    direction?.toLowerCase() === "outgoing" ? "OUTGOING" : "INCOMING";
  const typeFilters = (
    transferTypeFilters?.length ? transferTypeFilters : [normalizedDirection]
  ).map((value) => value.toUpperCase());

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#f8fafc",
      },
      headerExtras: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
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
        marginBottom: 4,
      },
      transferType: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1e293b",
        marginRight: 6,
      },
      transferId: {
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: "500",
      },
      transferRoute: {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
        marginBottom: 4,
      },
      transferMeta: {
        fontSize: 12,
        color: "#94a3b8",
      },
      statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: "#dbeafe",
      },
      statusText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#1e3a8a",
      },
      productInfo: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f1f5f9",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      productName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
      },
      quantity: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
      },
      timeInfo: {
        marginTop: 12,
      },
      timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
      },
      timeLabel: {
        fontSize: 12,
        color: "#94a3b8",
      },
      timeValue: {
        fontSize: 12,
        color: "#1e293b",
        fontWeight: "600",
      },
      notes: {
        marginTop: 12,
        fontSize: 12,
        color: "#475569",
        backgroundColor: "#f8fafc",
        padding: 8,
        borderRadius: 8,
      },
      loadingContainer: {
        alignItems: "center",
        paddingVertical: 40,
      },
      loadingText: {
        marginTop: 12,
        color: "#475569",
      },
      emptyContainer: {
        alignItems: "center",
        paddingVertical: 80,
      },
      emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
      },
      emptySubtext: {
        marginTop: 6,
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "center",
      },
      errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      },
      errorText: {
        fontSize: 16,
        color: "#ef4444",
        marginBottom: 16,
        textAlign: "center",
      },
      retryButton: {
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      },
      retryButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
      },
      placeholderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      },
      placeholderTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        textAlign: "center",
        marginTop: 16,
      },
      placeholderSubtitle: {
        fontSize: 13,
        color: "#94a3b8",
        textAlign: "center",
        marginTop: 6,
      },
    });
  });

  const {
    data: transfersData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["stockTransfers", dbsId],
    queryFn: () => GTS.getStockTransfers(dbsId),
    enabled: Boolean(dbsId),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ["data", "error"],
  });

  const handleRefresh = useCallback(() => {
    if (dbsId) {
      refetch();
    }
  }, [dbsId, refetch]);

  const getDisplayStatus = (status) => {
    return (status ?? "").toString().toUpperCase() === "COMPLETED"
      ? "COMPLETED"
      : "IN_PROGRESS";
  };

  const getStatusColor = (status) => {
    return getDisplayStatus(status) === "COMPLETED" ? "#10b981" : "#3b82f6";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "--";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProductLabel = (item) => {
    const raw = (item?.productName || item?.product || "").toString();
    if (raw.toUpperCase().includes("CNG")) {
      return raw;
    }
    return "CNG";
  };

  const getRouteLabels = (item) => {
    const fallbackFrom = item.fromLocation || "MS";
    const fallbackTo = item.toLocation || "DBS";
    if (normalizedDirection === "OUTGOING" && originLabelOverride) {
      return {
        from: originLabelOverride,
        to: destinationLabelOverride || fallbackTo,
      };
    }
    return {
      from: originLabelOverride || fallbackFrom,
      to: destinationLabelOverride || fallbackTo,
    };
  };

  const renderTransferCard = ({ item }) => {
    const { from, to } = getRouteLabels(item);
    return (
      <TouchableOpacity style={styles.transferCard}>
        <View style={styles.cardHeader}>
          <View style={styles.transferInfo}>
            <View style={styles.transferTypeRow}>
              {/* <Text style={styles.transferType}>
                {normalizedDirection || item.type || "TRANSFER"}
              </Text> */}
              {/* <Text style={styles.transferId}>#{item.id}</Text> */}
            </View>
            <Text style={styles.transferRoute}>
              {from} → {to}
            </Text>
            {/* <Text style={styles.transferMeta}>
            Priority: {(item.priority || "standard").toUpperCase()}
          </Text> */}
          </View>
          {/* <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}1A` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getDisplayStatus(item.status)}
            </Text>
          </View> */}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{getProductLabel(item)}</Text>
          <Text style={styles.quantity}>
            {item.quantity?.toLocaleString?.() || item.quantity || 0}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Initiated:</Text>
            <Text style={styles.timeValue}>{formatDate(item.initiatedAt)}</Text>
          </View>
          {item.completedAt ? (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Completed:</Text>
              <Text style={styles.timeValue}>
                {formatDate(item.completedAt)}
              </Text>
            </View>
          ) : null}
          {item.estimatedCompletion && !item.completedAt ? (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Expected:</Text>
              <Text style={styles.timeValue}>
                {formatDate(item.estimatedCompletion)}
              </Text>
            </View>
          ) : null}
        </View>
        {/* 
        {item.notes ? (
          <Text style={styles.notes}>Note: {item.notes}</Text>
        ) : null} */}
      </TouchableOpacity>
    );
  };

  if (!dbsId) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {headerComponent ? (
          <View style={styles.headerExtras}>{headerComponent}</View>
        ) : null}
        <View style={styles.placeholderContainer}>
          <AppIcon icon="transfers" size={36} color="#94a3b8" />
          <Text style={styles.placeholderTitle}>{requireSelectionTitle}</Text>
          <Text style={styles.placeholderSubtitle}>
            {requireSelectionSubtitle}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {headerComponent ? (
          <View style={styles.headerExtras}>{headerComponent}</View>
        ) : null}
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
  const transfers = allTransfers.filter((transfer) =>
    typeFilters.includes((transfer.type ?? "").toString().toUpperCase())
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

  const summaryKey =
    normalizedDirection === "OUTGOING" ? "outgoing" : "incoming";
  const summaryData = {
    total:
      summary?.[`${summaryKey}Total`] ??
      summary?.totalTransfers ??
      derivedSummary.total,
    inProgress:
      summary?.[`${summaryKey}InProgress`] ??
      summary?.inProgress ??
      derivedSummary.inProgress,
    completed:
      summary?.[`${summaryKey}Completed`] ??
      summary?.completed ??
      derivedSummary.completed,
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {headerComponent ? (
        <View style={styles.headerExtras}>{headerComponent}</View>
      ) : null}
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
          <Text style={styles.summaryNumber}>
            {summaryData.inProgress ?? 0}
          </Text>
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
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeRef.current?.colors?.info || "#3b82f6"}
              />
              <Text style={styles.loadingText}>Loading transfer data...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stock transfers</Text>
              <Text style={styles.emptySubtext}>
                Transfer operations will appear here when initiated
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
