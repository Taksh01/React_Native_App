import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import {
  getStockStatusColor,
  getStockStatusLabel,
} from "../../config/stockStatus";

export default function StockTransfersView({
  dbsId,
  fetchApi, // New prop for dependency injection
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

  // Date filtering state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [appliedStartDate, setAppliedStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [appliedEndDate, setAppliedEndDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState(null); // "start" | "end" | null
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [currentDateType, setCurrentDateType] = useState(null); // "start" | "end"

  const isIOS = Platform.OS === "ios";

  const formatDateDisplay = (d) =>
    d?.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) ?? "";

  const applyDateSelection = (selected, type) => {
    if (type === "start") {
      setStartDate(selected);
    } else {
      setEndDate(selected);
    }
  };

  const openDatePicker = (type) => {
    const baseDate = type === "start" ? startDate : endDate;

    if (!isIOS) {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        onChange: (event, date) => {
          if (event.type === "dismissed" || !date) return;
          applyDateSelection(date, type);
        },
      });
      return;
    }

    setPickerMode("date");
    setCurrentDateType(type);
    setTempDate(baseDate);
    setPickerVisible(true);
  };

  const onTempDateChange = (_event, date) => {
    if (date) setTempDate(date);
  };

  const onPickerDone = () => {
    if (currentDateType) {
      applyDateSelection(tempDate, currentDateType);
    }
    setPickerVisible(false);
    setPickerMode(null);
    setCurrentDateType(null);
  };

  const onPickerCancel = () => {
    setPickerVisible(false);
    setPickerMode(null);
    setCurrentDateType(null);
  };

  const applyDateFilter = () => {

    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const hasDateChanges = () => {
    return (
      startDate.toDateString() !== appliedStartDate.toDateString() ||
      endDate.toDateString() !== appliedEndDate.toDateString()
    );
  };

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
      dateFilterContainer: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
      },
      dateFilterTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 12,
      },
      dateRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        justifyContent: "flex-start",
        alignItems: "center",
      },
      filterActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
      },
      applyButton: {
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 90,
        alignItems: "center",
        justifyContent: "center",
        height: 40,
      },
      applyButtonDisabled: {
        backgroundColor: "#94a3b8",
      },
      applyButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "600",
      },
      applyButtonTextDisabled: {
        color: "#e2e8f0",
      },
      dateField: {
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        alignSelf: "flex-start",
        minWidth: 130,
        maxWidth: 150,
      },
      dateFieldInner: {
        height: 40,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: "center",
        alignItems: "flex-start",
        minWidth: 0,
      },
      dateFieldLabel: {
        fontSize: 12,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      },
      dateFieldText: {
        fontSize: 16,
        color: "#1e293b",
        fontWeight: "500",
      },
      dateFieldPlaceholder: {
        fontSize: 16,
        color: "#94a3b8",
        fontWeight: "500",
      },
      modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
      },
      modalSheet: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
      },
      modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      },
      modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
      },
      modalActions: {
        flexDirection: "row",
        gap: 8,
      },
      actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      },
      actionPrimary: {
        backgroundColor: "#1d4ed8",
        borderColor: "#1d4ed8",
      },
      actionText: {
        color: "#1e293b",
        fontWeight: "500",
      },
      actionTextPrimary: {
        color: "#ffffff",
        fontWeight: "600",
      },
      pickerWrap: {
        paddingVertical: 8,
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
    queryKey: [
      "stockTransfers",
      dbsId,
      appliedStartDate.toDateString(),
      appliedEndDate.toDateString(),
    ],
    queryFn: () => {
      if (!fetchApi) {
        throw new Error("fetchApi prop is required");
      }
      return fetchApi(dbsId, {
        startDate: appliedStartDate.toISOString(),
        endDate: appliedEndDate.toISOString(),
      });
    },
    enabled: Boolean(dbsId && fetchApi),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ["data", "error"],
  });

  const handleRefresh = useCallback(() => {
    if (dbsId) {
      refetch();
    }
  }, [dbsId, refetch]);



  const formatDate = (timestamp) => {
    if (!timestamp) return "--";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  const getRouteLabels = (item) => {
    const fallbackFrom = item.fromLocation;
    const fallbackTo = item.toLocation;
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
                {normalizedDirection || item.type}
              </Text> */}
              {item.id ? <Text style={styles.transferRoute}>Stock Trasnsfer Id: {item.id}</Text> : null}
            </View>
            <Text style={styles.transferRoute}>
              {from} to {to}
            </Text>
            {/* <Text style={styles.transferMeta}>
            Priority: {(item.priority || "standard").toUpperCase()}
          </Text> */}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStockStatusColor(item.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: '#ffffff' },
              ]}
            >
              {getStockStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>Qty</Text>
          <Text style={styles.quantity}>
            {item.quantity?.toLocaleString?.() || item.quantity || 0}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Initiated:</Text>
            <Text style={styles.timeValue}>
              {item.initiatedAt ? formatDate(item.initiatedAt) : "Not Initiated"}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Completed:</Text>
            <Text style={styles.timeValue}>
              {item.completedAt ? formatDate(item.completedAt) : "Not Completed"}
            </Text>
          </View>
          {/* {item.estimatedCompletion && !item.completedAt ? (
          {/* {item.estimatedCompletion && !item.completedAt ? (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Expected:</Text>
              <Text style={styles.timeValue}>
                {formatDate(item.estimatedCompletion)}
              </Text>
            </View>
          ) : null} */}
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

  const transfers = transfersData?.transfers || [];

  const renderDateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <Text style={styles.dateFilterTitle}>Filter by Date Range</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => openDatePicker("start")}
          activeOpacity={0.7}
        >
          <View style={styles.dateFieldInner}>
            {startDate.toDateString() === new Date().toDateString() &&
            appliedStartDate.toDateString() === new Date().toDateString() ? (
              <Text style={styles.dateFieldPlaceholder}>Start Date</Text>
            ) : (
              <Text style={styles.dateFieldText}>
                {formatDateDisplay(startDate)}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateField}
          onPress={() => openDatePicker("end")}
          activeOpacity={0.7}
        >
          <View style={styles.dateFieldInner}>
            {endDate.toDateString() === new Date().toDateString() &&
            appliedEndDate.toDateString() === new Date().toDateString() ? (
              <Text style={styles.dateFieldPlaceholder}>End Date</Text>
            ) : (
              <Text style={styles.dateFieldText}>
                {formatDateDisplay(endDate)}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.applyButton,
            !hasDateChanges() && styles.applyButtonDisabled,
          ]}
          onPress={applyDateFilter}
          disabled={!hasDateChanges()}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.applyButtonText,
              !hasDateChanges() && styles.applyButtonTextDisabled,
            ]}
          >
            Apply
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  const summary = transfersData?.summary || {};

  const derivedSummary = transfers.reduce(
    (acc, transfer) => {
      acc.total += 1;
      if (transfer.status === "COMPLETED") {
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
      {dbsId && renderDateFilter()}
      {/* <View style={styles.summaryContainer}>
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
      </View> */}

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

      {isIOS && (
        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={onPickerCancel}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {currentDateType === "start" ? "Start" : "End"} Date
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={onPickerCancel}
                  >
                    <Text style={styles.actionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionPrimary]}
                    onPress={onPickerDone}
                  >
                    <Text style={styles.actionTextPrimary}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onTempDateChange}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
