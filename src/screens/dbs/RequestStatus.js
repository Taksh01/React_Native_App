import React, { useState, useCallback } from "react";
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
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";

import { apiGetManualRequests } from "../../lib/dbsApi";
import {
  getStockStatusColor,
  getStockStatusLabel,
} from "../../config/stockStatus";



const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "--";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCreatedAt = (isoStr) => {
  if (!isoStr) return "--";
  const date = new Date(isoStr);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function RequestStatus() {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      container: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing(4),
        paddingTop: theme.spacing(4), // Added top spacing
      },
      header: {
        alignItems: "center",
        paddingVertical: theme.spacing(6),
      },
      headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(3),
      },
      title: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(1),
      },
      subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      listContent: {
        paddingBottom: theme.spacing(8),
      },
      card: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        ...theme.shadows.level1,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start", // Align to top
        marginBottom: theme.spacing(3),
      },
      requestId: {
        fontSize: 16,
        // fontWeight: "bold",
        color: theme.colors.textPrimary,
      },
      statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.radii.md,
      },
      statusText: {
        fontSize: 12, // Slightly smaller than 16 for badge text to fit well
        fontWeight: "bold",
        color: "#ffffff",
        textTransform: "uppercase",
      },
      detailsContainer: {
        gap: theme.spacing(2),
      },
      detailRow: {
        flexDirection: "row",
        alignItems: "center",
      },
      detailLabel: {
        fontSize: 16,
        // fontWeight: "bold",
        color: theme.colors.textPrimary,
        width: 120, // Fixed width for alignment
      },
      detailValue: {
        fontSize: 16,
        // fontWeight: "bold",
        color: theme.colors.textSecondary,
        flex: 1,
      },
      createdAt: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme.colors.textMuted,
        marginTop: theme.spacing(3),
        paddingTop: theme.spacing(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing(12),
      },
      emptyIcon: {
        marginBottom: theme.spacing(4),
      },
      emptyTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      emptyText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeights.body,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
    })
  );

  const {
    data: requests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["manualRequests"],
    queryFn: apiGetManualRequests,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.requestId}>Request ID: {item.id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStockStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStockStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.requested_qty_kg.toLocaleString()} kg
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Required By:</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.requested_by_date)} {formatTime(item.requested_by_time)}
            </Text>
          </View>
        </View>

        <Text style={styles.createdAt}>
          Submitted: {formatCreatedAt(item.created_at)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <AppIcon
        icon="requests"
        size={48}
        color="#94a3b8"
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Requests Yet</Text>
      <Text style={styles.emptyText}>
        When you submit manual stock requests,{"\n"}they will appear here.
      </Text>
    </View>
  );


  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
