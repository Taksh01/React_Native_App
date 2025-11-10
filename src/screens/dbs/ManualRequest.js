import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTextField from "../../components/AppTextField";
import AppButton from "../../components/AppButton";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";

export default function ManualRequest() {
  const [qty, setQty] = useState("");
  const qtyRef = useRef(null);
  const [requiredBy, setRequiredBy] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (d) =>
    d?.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) ?? "";
  const formatTime = (d) =>
    d?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) ??
    "";

  const onSelectDate = (_event, date) => {
    setShowDatePicker(false);
    if (!date) return;
    const base = requiredBy ?? new Date();
    const next = new Date(base);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setRequiredBy(next);
  };

  const onSelectTime = (_event, time) => {
    setShowTimePicker(false);
    if (!time) return;
    const base = requiredBy ?? new Date();
    const next = new Date(base);
    next.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setRequiredBy(next);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(6),
      },
      header: {
        alignItems: "center",
        marginBottom: theme.spacing(8),
      },
      headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(4),
      },
      title: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        lineHeight: theme.typography.lineHeights.heading,
        textAlign: "center",
        marginBottom: theme.spacing(2),
      },
      subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.lineHeights.body,
        textAlign: "center",
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(6),
        ...theme.shadows.level1,
      },
      inputGroup: {
        marginBottom: theme.spacing(6),
      },
      inputLabel: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(2),
      },
      inputHint: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
        marginTop: theme.spacing(1),
        lineHeight: theme.typography.lineHeights.caption,
      },

      row: {
        flexDirection: "row",
        gap: theme.spacing(2),
      },
      half: {
        flex: 1,
      },
      touchField: {
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderMuted,
      },
      touchFieldInner: {
        height: 48,
        paddingHorizontal: theme.spacing(3),
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing(2),
      },
      touchFieldText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textPrimary,
      },
    })
  );

  const submit = () => {
    const trimmed = qty.trim();
    const num = parseFloat(trimmed);

    if (!trimmed || isNaN(num) || num <= 0) {
      Alert.alert(
        "Enter quantity",
        "Please enter a valid number for Requested Qty."
      );
      // Keep keyboard and focus so user can fix it
      qtyRef.current?.focus();
      return;
    }
    if (!requiredBy) {
      Alert.alert(
        "Select required by",
        "Please select a date and time by which delivery is required."
      );
      return;
    }
    // Hide keyboard only on successful validation
    Keyboard.dismiss();

    // FUTURE: POST /dbs/requests with { qty: num, requiredBy: requiredBy.toISOString() }
    Alert.alert(
      "Manual Request (mock)",
      `Requested Qty: ${num}\nRequired by: ${formatDate(
        requiredBy
      )} ${formatTime(requiredBy)}`
    );
    setQty("");
    setRequiredBy(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AppIcon icon="requests" size={32} color="#1e293b" />
            </View>
            <Text style={styles.title}>Manual Request</Text>
            <Text style={styles.subtitle}>
              Submit a manual stock request for your DBS station
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Requested Quantity</Text>
              {/* <AppTextField
                ref={qtyRef}
                placeholder="Enter quantity (e.g. 1000.5)"
                value={qty}
                onChangeText={setQty}
                keyboardType="decimal-pad"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={submit}
              /> */}

              <AppTextField
                ref={qtyRef}
                placeholder="Enter quantity (e.g. 1000.5)"
                value={qty}
                onChangeText={setQty}
                keyboardType="decimal-pad"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => qtyRef.current?.blur()}
              />

              <Text style={styles.inputHint}>
                Enter the quantity in litres that you need to request
              </Text>
            </View>

            {/* Required by (Date & Time) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Required by</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.touchField, styles.half]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.touchFieldInner}>
                    <AppIcon icon="calendar" size={18} color="#1e293b" />
                    <Text style={styles.touchFieldText}>
                      {requiredBy ? formatDate(requiredBy) : "Pick date"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.touchField, styles.half]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.touchFieldInner}>
                    <AppIcon icon="clock" size={18} color="#1e293b" />
                    <Text style={styles.touchFieldText}>
                      {requiredBy ? formatTime(requiredBy) : "Pick time"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputHint}>
                Select the latest date & time by which delivery is needed
              </Text>

              {showDatePicker && (
                <DateTimePicker
                  value={requiredBy ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onSelectDate}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={requiredBy ?? new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onSelectTime}
                  minuteInterval={5}
                />
              )}
            </View>

            <AppButton
              title="Submit Request"
              onPress={submit}
              disabled={!qty.trim() || !requiredBy}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
