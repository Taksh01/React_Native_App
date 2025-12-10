import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import { driverApi } from "../../lib/driverApi";
import { useAuth } from "../../store/auth";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

const EMERGENCY_TYPES = [
  {
    id: "gas_leakage",
    title: "Gas Leakage",
    icon: "emergencyGas",
    color: "#FF3B30",
    severity: "CRITICAL",
  },
  {
    id: "tyre_puncture",
    title: "Tyre Puncture",
    icon: "emergencyTyre",
    color: "#FF9500",
    severity: "MEDIUM",
  },
  {
    id: "engine_problem",
    title: "Engine Problem",
    icon: "emergencyEngine",
    color: "#FF9500",
    severity: "HIGH",
  },
  {
    id: "accident",
    title: "Accident",
    icon: "emergencyAccident",
    color: "#FF3B30",
    severity: "CRITICAL",
  },
  {
    id: "vehicle_breakdown",
    title: "Vehicle Breakdown",
    icon: "emergencyBreakdown",
    color: "#FF9500",
    severity: "HIGH",
  },
  {
    id: "medical_emergency",
    title: "Medical Emergency",
    icon: "emergencyMedical",
    color: "#FF3B30",
    severity: "CRITICAL",
  },
  {
    id: "security_issue",
    title: "Security Issue",
    icon: "emergencySecurity",
    color: "#FF3B30",
    severity: "CRITICAL",
  },
  { 
    id: "other", 
    title: "Other Issue", 
    icon: "info", 
    color: "#8E8E93",
    severity: "LOW" 
  },
];

export default function EmergencyAlert({ navigation, route }) {
  useScreenPermissionSync("EmergencyAlert");
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // States for "Other Issue" input
  const [otherModalVisible, setOtherModalVisible] = useState(false);
  const [otherReason, setOtherReason] = useState("");

  const themeRef = useRef(null);

  const activeToken = route?.params?.token ?? null;

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
      // Modal Styles
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing(4),
      },
      modalContent: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(6),
        width: "100%",
        maxWidth: 400,
        ...theme.shadows.level3,
      },
      modalTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(4),
        textAlign: "center",
      },
      modalInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
        minHeight: 100,
        textAlignVertical: "top",
        marginBottom: theme.spacing(6),
        backgroundColor: theme.colors.surface,
      },
      modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: theme.spacing(4),
      },
      modalButton: {
        flex: 1,
        paddingVertical: theme.spacing(3),
        borderRadius: theme.radii.md,
        alignItems: "center",
      },
      modalCancel: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.neutralGray,
      },
      modalSubmit: {
        backgroundColor: theme.colors.emergency,
      },
      modalCancelText: {
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weightSemiBold,
      },
      modalSubmitText: {
        color: "white",
        fontWeight: theme.typography.weightBold,
      },
    });
  });

  const handleEmergencySelect = (emergency) => {
    setSelectedEmergency(emergency);

    if (emergency.id === "other") {
      setOtherReason("");
      setOtherModalVisible(true);
      return;
    }

    Alert.alert(
      emergency.title,
      "Are you sure you want to report this emergency?",
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

  const reportEmergency = async (emergency, customType = null) => {
    setLoading(true);
    // If customType is present (from Other input), use it as 'type'. 
    // Otherwise use emergency.title.
    const typeToSend = customType || emergency.title;

    try {
      const response = await driverApi.reportEmergency({
        token: activeToken,
        type: typeToSend,
        severity: emergency.severity,
      });

      if (response && response.success) {
        setOtherModalVisible(false);
        Alert.alert(
          "Emergency Reported",
          response.message || "Control center has been notified.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response?.message || "Please try again.");
      }
    } catch (apiError) {
      console.warn("Emergency reporting failed:", apiError?.message);
      
      setOtherModalVisible(false);
      
      Alert.alert(
        "Report Failed",
        apiError?.message || "Could not report emergency. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setSelectedEmergency(null);
    }
  };

  const handleOtherSubmit = () => {
    if (!otherReason.trim()) {
      Alert.alert("Required", "Please specify the issue.");
      return;
    }
    // Call reportEmergency with the currently selected 'Other' emergency object,
    // but pass our custom reason as the specific type override.
    reportEmergency(selectedEmergency, otherReason.trim());
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

      {/* Modal for Other Issue Input */}
      <Modal
        visible={otherModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
            setOtherModalVisible(false);
            setSelectedEmergency(null);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Specify Other Issue</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Please describe the emergency..."
              placeholderTextColor="#999"
              value={otherReason}
              onChangeText={setOtherReason}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setOtherModalVisible(false);
                  setSelectedEmergency(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSubmit]}
                onPress={handleOtherSubmit}
              >
                <Text style={styles.modalSubmitText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
