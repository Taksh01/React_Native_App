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
  Modal,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTextField from "../../components/AppTextField";
import AppButton from "../../components/AppButton";
import AppIcon from "../../components/AppIcon";
import { useThemedStyles } from "../../theme";
import { apiSubmitManualRequest } from "../../lib/dbsApi";

export default function ManualRequest() {
  const [qty, setQty] = useState("");
  const qtyRef = useRef(null);
  const [requiredBy, setRequiredBy] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [showDatePicker, setShowDatePicker] = useState(false);
  // const [showTimePicker, setShowTimePicker] = useState(false);

  const [pickerMode, setPickerMode] = useState(null); // "date" | "time" | null
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const formatDate = (d) =>
    d?.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) ?? "";
  const formatTime = (d) =>
    d
      ? new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(d)
      : "";

  const isIOS = Platform.OS === "ios";

  const applySelection = (base, selected, mode) => {
    const next = new Date(base ?? new Date());

    if (mode === "date") {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }

    setRequiredBy(next);
  };

  const openPicker = (mode) => {
    const base = requiredBy ?? new Date();

    if (!isIOS) {
      DateTimePickerAndroid.open({
        value: base,
        mode,
        is24Hour: false,
        minimumDate: mode === "date" ? new Date() : undefined,
        onChange: (event, date) => {
          if (event.type === "dismissed" || !date) return;
          applySelection(requiredBy, date, mode);
        },
      });
      return;
    }

    setPickerMode(mode);
    setTempDate(requiredBy ?? new Date());
    setPickerVisible(true);
  };

  const onTempChange = (_event, date) => {
    if (date) setTempDate(date);
  };

  const onPickerDone = () => {
    if (pickerMode) {
      applySelection(requiredBy, tempDate, pickerMode);
    }
    setPickerVisible(false);
    setPickerMode(null);
  };

  const onPickerCancel = () => {
    setPickerVisible(false);
    setPickerMode(null);
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
        justifyContent: "space-between",
        touchFieldInner: {
          height: 48,
          paddingHorizontal: theme.spacing(3),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        touchFieldLabel: {
          fontSize: theme.typography.sizes.caption,
          color: theme.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        color: theme.colors.textPrimary,
      },

      // ⬇ add below your existing styles inside StyleSheet.create({...})
      modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
      },
      modalSheet: {
        backgroundColor: theme.colors.surfaceElevated,
        borderTopLeftRadius: theme.radii.xl,
        borderTopRightRadius: theme.radii.xl,
        padding: theme.spacing(4),
      },
      modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(2),
      },
      modalTitle: {
        fontSize: theme.typography.sizes.subheading,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      modalActions: {
        flexDirection: "row",
        gap: theme.spacing(2),
      },
      actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: theme.radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderMuted,
      },
      actionPrimary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      actionText: {
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.weightMedium,
      },
      actionTextPrimary: {
        color: theme.colors.onPrimary ?? "#fff",
        fontWeight: theme.typography.weightBold,
      },
      pickerWrap: {
        paddingVertical: theme.spacing(2),
      },
    })
  );

  const submit = async () => {
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
    setIsSubmitting(true);

    try {
      // Format the payload as requested
      const payload = {
        requested_qty_kg: num,
        requested_by_date: requiredBy.toISOString().split("T")[0], // "2024-12-04"
        requested_by_time: requiredBy.toTimeString().split(" ")[0], // "14:30:00"
      };

      const response = await apiSubmitManualRequest(payload);

      Alert.alert(
        "Request Submitted",
        `Successfully submitted request for ${num} kg\nRequired by: ${formatDate(
          requiredBy
        )} ${formatTime(requiredBy)}`,
        [
          {
            text: "OK",
            onPress: () => {
              setQty("");
              setRequiredBy(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Request Failed",
        error.message || "Failed to submit request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
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
                {/* <TouchableOpacity
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
                </TouchableOpacity> */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.touchField, styles.half]}
                  onPress={() => openPicker("date")}
                >
                  <View style={styles.touchFieldInner}>
                    <Text style={styles.touchFieldLabel}>Date</Text>
                    <Text style={styles.touchFieldText}>
                      {requiredBy ? formatDate(requiredBy) : "Select"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.touchField, styles.half]}
                  onPress={() => openPicker("time")}
                >
                  <View style={styles.touchFieldInner}>
                    <Text style={styles.touchFieldLabel}>Time</Text>
                    <Text style={styles.touchFieldText}>
                      {requiredBy ? formatTime(requiredBy) : "Select"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputHint}>
                Select the latest date & time by which delivery is needed
              </Text>

              {/* {showDatePicker && (
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
              )} */}
            </View>

            <AppButton
              title={isSubmitting ? "Submitting..." : "Submit Request"}
              onPress={submit}
              disabled={!qty.trim() || !requiredBy || isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

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
                  {pickerMode === "date" ? "Select Date" : "Select Time"}
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
                  mode={pickerMode ?? "date"}
                  display="spinner"
                  onChange={onTempChange}
                  {...(pickerMode === "date"
                    ? { minimumDate: new Date() }
                    : {})}
                  minuteInterval={5}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
