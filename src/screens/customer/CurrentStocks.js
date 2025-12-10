import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useAuth } from "../../store/auth";
import AppIcon from "../../components/AppIcon";
import AppButton from "../../components/AppButton";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

export default function CurrentStocks() {
  useScreenPermissionSync("CurrentStocks");
  const { user } = useAuth();
  const dbsId = user?.dbsId;
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      summaryGrid: {
        flexDirection: "row",
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(2),
        gap: theme.spacing(2),
      },
      summaryCard: {
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing(3),
        borderRadius: theme.radii.lg,
        flex: 1,
        minWidth: 80,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
        ...theme.shadows.level1,
      },
      summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(2),
      },
      summaryIconText: {
        color: "#1e293b",
      },
      summaryNumber: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      summaryLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightMedium,
        textAlign: "center",
      },
      listContainer: {
        padding: theme.spacing(4),
      },
      stockCard: {
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing(4),
        borderRadius: theme.radii.lg,
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      },
      stockHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: theme.spacing(4),
      },
      productName: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      productType: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(0.5),
      },
      levelBadge: {
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.sm,
      },
      levelText: {
        fontSize: theme.typography.sizes.bodySmall,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.surfaceElevated,
      },
      stockDetails: {
        marginBottom: theme.spacing(4),
      },
      stockRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      stockLabel: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      stockValue: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      progressContainer: {
        marginBottom: theme.spacing(3),
      },
      progressBar: {
        height: 8,
        backgroundColor: theme.colors.borderSubtle,
        borderRadius: theme.radii.sm,
        overflow: "hidden",
        marginBottom: theme.spacing(2),
      },
      progressFill: {
        height: "100%",
        borderRadius: theme.radii.sm,
      },
      progressText: {
        fontSize: theme.typography.sizes.bodySmall,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      lastUpdated: {
        fontSize: theme.typography.sizes.bodySmall,
        color: theme.colors.textMuted,
        textAlign: "center",
      },
      loadingContainer: {
        alignItems: "center",
        paddingVertical: theme.spacing(10),
      },
      loadingText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(3),
      },
      emptyContainer: {
        alignItems: "center",
        paddingVertical: theme.spacing(10),
      },
      emptyText: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
      },
      emptySubtext: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        marginTop: theme.spacing(1),
        textAlign: "center",
      },
      errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing(5),
      },
      errorText: {
        fontSize: theme.typography.sizes.bodyLarge,
        color: theme.colors.danger,
        marginBottom: theme.spacing(4),
        textAlign: "center",
      },
    });
  });

  const {
    data: stocksData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["currentStocks", dbsId],
    queryFn: () => GTS.getCurrentStocks(dbsId),
    refetchInterval: 60000,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getStockLevelColor = (percentage) => {
    if (percentage >= 70) return "#10b981";
    if (percentage >= 30) return "#f59e0b";
    return "#ef4444";
  };

  const getStockLevelText = (percentage) => {
    if (percentage >= 70) return "Good";
    if (percentage >= 30) return "Medium";
    return "Low";
  };

  const renderStockCard = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <View>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.productType}>{item.productType}</Text>
        </View>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: getStockLevelColor(item.percentage) },
          ]}
        >
          <Text style={styles.levelText}>
            {getStockLevelText(item.percentage)}
          </Text>
        </View>
      </View>

      <View style={styles.stockDetails}>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Current Stock</Text>
          <Text style={styles.stockValue}>
            {item.currentStock.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Capacity</Text>
          <Text style={styles.stockValue}>
            {item.capacity.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Available Space</Text>
          <Text style={styles.stockValue}>
            {(item.capacity - item.currentStock).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.percentage}%`,
                backgroundColor: getStockLevelColor(item.percentage),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{item.percentage}% Full</Text>
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(item.lastUpdated).toLocaleString("en-IN")}
      </Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load stock data</Text>
          <AppButton title="Retry" onPress={handleRefresh} />
        </View>
      </SafeAreaView>
    );
  }

  const stocks = stocksData?.stocks || [];
  const summary = stocksData?.summary || {};

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.summaryGrid}>
        {/* <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryProducts" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{summary.totalProducts || 4}</Text>
          <Text style={styles.summaryLabel}>Products</Text>
        </View> */}
        {/* <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryCapacity" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>{(summary.totalCapacity || 75000) / 1000}K</Text>
          <Text style={styles.summaryLabel}>Capacity</Text>
        </View> */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AppIcon icon="summaryStock" size={16} color="#1e293b" />
          </View>
          <Text style={styles.summaryNumber}>
            {(summary.totalStock || 52500) / 1000}K
          </Text>
          <Text style={styles.summaryLabel}>Stock</Text>
        </View>
      </View>

      {/* <FlatList
        data={stocks}
        renderItem={renderStockCard}
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
              <Text style={styles.loadingText}>Loading stock data...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stock data available</Text>
              <Text style={styles.emptySubtext}>
                Stock information will appear here once available
              </Text>
            </View>
          )
        }
      /> */}
    </SafeAreaView>
  );
}
