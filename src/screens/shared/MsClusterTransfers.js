import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { GTS } from "../../api/client";
import { useThemedStyles } from "../../theme";
import AppIcon from "../../components/AppIcon";
import StockTransfersView from "./StockTransfersView";

export default function MsClusterTransfers({
  msId,
  msName: fallbackMsName,
  requireSelectionTitle = "Select a DBS to view stock transfers",
  requireSelectionSubtitle = "Choose a linked depot to load transfer activity",
  emptyClusterTitle = "No DBS linked to this MS",
  emptyClusterSubtitle = "Once a DBS is mapped you will see transfers here.",
  missingMsTitle = "No MS assigned",
  missingMsSubtitle = "Contact support to link an MS to your account.",
}) {
  const [selectedDbsId, setSelectedDbsId] = useState(null);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      selectorContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      },
      selectorHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      },
      selectorTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
      },
      selectorSubtitle: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
      },
      refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#cbd5f5",
        backgroundColor: "#eff6ff",
      },
      refreshText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1d4ed8",
        marginLeft: 6,
      },
      chipsRow: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingRight: 4,
      },
      chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        minWidth: 160,
        marginRight: 10,
      },
      chipActive: {
        borderColor: "#2563eb",
        backgroundColor: "#eff6ff",
      },
      chipTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0f172a",
      },
      chipSubtitle: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
      },
      selectorLoading: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 10,
      },
      selectorLoadingText: {
        fontSize: 13,
        color: "#475569",
      },
      selectorEmptyText: {
        fontSize: 13,
        color: "#94a3b8",
        paddingVertical: 6,
      },
      errorBanner: {
        marginTop: 6,
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
      },
      errorText: {
        fontSize: 12,
        color: "#b91c1c",
        textAlign: "center",
      },
    })
  );

  const {
    data: clusterData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["msCluster", msId],
    queryFn: () => GTS.getMsCluster(msId),
    enabled: Boolean(msId),
    staleTime: 5 * 60 * 1000,
  });

  const dbOptions = clusterData?.dbs ?? [];

  const selectedDb = useMemo(() => {
    if (!selectedDbsId) return null;
    return dbOptions.find((db) => db.dbsId === selectedDbsId) || null;
  }, [dbOptions, selectedDbsId]);

  useEffect(() => {
    setSelectedDbsId(null);
  }, [msId]);

  useEffect(() => {
    if (!dbOptions.length) {
      setSelectedDbsId(null);
      return;
    }
    if (!selectedDbsId || !dbOptions.some((db) => db.dbsId === selectedDbsId)) {
      setSelectedDbsId(dbOptions[0]?.dbsId || null);
    }
  }, [dbOptions, selectedDbsId]);

  const msDisplayName = useMemo(() => {
    return clusterData?.ms?.msName || fallbackMsName || msId || "MS Station";
  }, [clusterData?.ms?.msName, fallbackMsName, msId]);

  const handleRefresh = () => {
    if (!msId || isFetching) {
      return;
    }
    refetch();
  };

  const headerComponent = (
    <View style={styles.selectorContainer}>
      <View style={styles.selectorHeader}>
        <View>
          <Text style={styles.selectorTitle}>{msDisplayName}</Text>
          <Text style={styles.selectorSubtitle}>
            {msId
              ? dbOptions.length
                ? `${dbOptions.length} linked DBS`
                : "No DBS linked yet"
              : "MS not assigned"}
          </Text>
        </View>
        {/* <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={!msId || isFetching}
          activeOpacity={0.8}
        >
          <AppIcon icon="reconciliation" size={16} color="#1d4ed8" />
          <Text style={styles.refreshText}>
            {isFetching ? "Refreshing" : "Refresh"}
          </Text>
        </TouchableOpacity> */}
      </View>

      {!msId ? (
        <Text style={styles.selectorEmptyText}>{missingMsSubtitle}</Text>
      ) : error ? (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.errorText}>
            Failed to load DBS list. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : isLoading && !dbOptions.length ? (
        <View style={styles.selectorLoading}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.selectorLoadingText}>Loading linked DBS...</Text>
        </View>
      ) : dbOptions.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {dbOptions.map((db) => {
            const isActive = db.dbsId === selectedDbsId;
            return (
              <TouchableOpacity
                key={db.dbsId}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedDbsId(db.dbsId)}
                activeOpacity={0.9}
              >
                <Text style={styles.chipTitle}>{db.dbsName || db.dbsId}</Text>
                <Text style={styles.chipSubtitle}>
                  {db.location || db.region || "Location unavailable"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.selectorEmptyText}>{emptyClusterSubtitle}</Text>
      )}
    </View>
  );

  const hasCluster = Boolean(msId && dbOptions.length);

  return (
    <StockTransfersView
      dbsId={selectedDbsId}
      headerComponent={headerComponent}
      requireSelectionTitle={
        !msId
          ? missingMsTitle
          : hasCluster
          ? requireSelectionTitle
          : emptyClusterTitle
      }
      requireSelectionSubtitle={
        !msId
          ? missingMsSubtitle
          : hasCluster
          ? requireSelectionSubtitle
          : emptyClusterSubtitle
      }
      originLabelOverride={
        selectedDb?.primaryMsName || msDisplayName || clusterData?.ms?.msName
      }
      destinationLabelOverride={selectedDb?.dbsName || selectedDb?.dbsId}
    />
  );
}
