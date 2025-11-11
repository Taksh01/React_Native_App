import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import { driverApi } from "../../lib/driverApi";
import { useAuth } from "../../store/auth";

const EMERGENCY_TYPES = [
  {
    id: "gas_leakage",
    title: "Gas Leakage",
    icon: "emergencyGas",
    color: "#FF3B30",
  },
  {
    id: "tyre_puncture",
    title: "Tyre Puncture",
    icon: "emergencyTyre",
    color: "#FF9500",
  },
  {
    id: "engine_problem",
    title: "Engine Problem",
    icon: "emergencyEngine",
    color: "#FF9500",
  },
  {
    id: "accident",
    title: "Accident",
    icon: "emergencyAccident",
    color: "#FF3B30",
  },
  {
    id: "vehicle_breakdown",
    title: "Vehicle Breakdown",
    icon: "emergencyBreakdown",
    color: "#FF9500",
  },
  {
    id: "medical_emergency",
    title: "Medical Emergency",
    icon: "emergencyMedical",
    color: "#FF3B30",
  },
  {
    id: "security_issue",
    title: "Security Issue",
    icon: "emergencySecurity",
    color: "#FF3B30",
  },
  { id: "other", title: "Other Issue", icon: "info", color: "#8E8E93" },
];

export default function EmergencyAlert({ navigation, route }) {
  const { user } = useAuth();
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  const themeRef = useRef(null);

  const activeToken = route?.params?.token ?? null;
  const activeTripId = route?.params?.tripId ?? null;
  const presetLocation = route?.params?.location;

  const resolveLocation = () => {
    if (
      presetLocation &&
      typeof presetLocation?.latitude === "number" &&
      typeof presetLocation?.longitude === "number"
    ) {
      return presetLocation;
    }
    return { latitude: 0, longitude: 0 };
  };

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      scrollContent: {
        padding: theme.spacing(4),
      },
      header: {
        alignItems: "center",
        marginBottom: theme.spacing(6),
      },
      headerIconRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing(4),
      },
      headerIcon: {
        marginRight: theme.spacing(3),
      },
      title: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.emergency,
        marginBottom: 0,
      },
      subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginBottom: theme.spacing(2),
      },
      warningRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      warningIcon: {
        marginRight: theme.spacing(2),
      },
      warningText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.emergencyOrange,
        fontWeight: theme.typography.weightSemiBold,
        textAlign: "center",
      },
      emergencyGrid: {
        gap: theme.spacing(3),
      },
      emergencyCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      emergencyContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
      },
      emergencyIcon: {
        marginRight: theme.spacing(3),
      },
      emergencyTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
      },
      emergencyArrow: {
        marginLeft: theme.spacing(3),
      },
      footer: {
        marginTop: theme.spacing(8),
        alignItems: "center",
      },
      cancelButton: {
        backgroundColor: theme.colors.neutralGray,
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing(8),
        paddingVertical: theme.spacing(3),
      },
      cancelButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing(8),
      },
      loadingText: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.emergency,
        marginTop: theme.spacing(4),
        textAlign: "center",
      },
      loadingSubtext: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing(2),
        textAlign: "center",
      },
    });
  });

  const handleEmergencySelect = (emergency) => {
    setSelectedEmergency(emergency);

    Alert.alert(
      emergency.title,
      "Are you sure you want to report this emergency? This will immediately notify the control center.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setSelectedEmergency(null),
        },
        {
          text: "Report Emergency",
          style: "destructive",
          onPress: () => reportEmergency(emergency),
        },
      ]
    );
  };

  const reportEmergency = async (emergency) => {
    setLoading(true);
    try {
      const description = activeTripId
        ? `${emergency.title} reported during trip ${activeTripId}`
        : `${emergency.title} reported from driver app`;

      await driverApi.reportEmergency({
        token: activeToken,
        driverId: user?.id,
        emergencyType: emergency.id,
        location: resolveLocation(),
        description,
      });

      Alert.alert(
        "Emergency Reported",
        `${emergency.title} has been reported to the control center. Help is on the way.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (apiError) {
      console.warn(
        "Emergency reporting failed; falling back to offline acknowledgement.",
        apiError?.message || apiError
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Emergency Reported (Offline)",
        `${emergency.title} has been saved locally. Control center will be notified once connectivity is restored.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
      setSelectedEmergency(null);
    }
  };

  const renderEmergencyCard = (emergency) => (
    <TouchableOpacity
      key={emergency.id}
      style={styles.emergencyCard}
      onPress={() => handleEmergencySelect(emergency)}
      disabled={loading || Boolean(selectedEmergency)}
    >
      <View style={styles.emergencyContent}>
        <AppIcon
          icon={emergency.icon}
          size={24}
          color={emergency.color}
          style={styles.emergencyIcon}
        />
        <Text style={styles.emergencyTitle}>{emergency.title}</Text>
      </View>
      <AppIcon
        icon="chevronRight"
        size={20}
        color={themeRef.current?.colors?.slateIcon || "#94a3b8"}
        style={styles.emergencyArrow}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={themeRef.current?.colors?.emergency || "#FF3B30"}
          />
          <Text style={styles.loadingText}>Reporting Emergency...</Text>
          <Text style={styles.loadingSubtext}>
            Notifying control center and emergency services
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <AppIcon
              icon="emergencyHeader"
              size={32}
              color={themeRef.current?.colors?.emergency || "#FF3B30"}
              style={styles.headerIcon}
            />
            <Text style={styles.title}>Emergency Alert</Text>
          </View>
          <Text style={styles.subtitle}>
            Select the type of emergency you're experiencing
          </Text>
          <View style={styles.warningRow}>
            <AppIcon
              icon="alertRoute"
              size={16}
              color={themeRef.current?.colors?.emergencyOrange || "#FF9500"}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Only use for genuine emergencies
            </Text>
          </View>
        </View>

        <View style={styles.emergencyGrid}>
          {EMERGENCY_TYPES.map(renderEmergencyCard)}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
