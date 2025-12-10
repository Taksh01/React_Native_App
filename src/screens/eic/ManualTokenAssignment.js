import React, { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { GTS } from "../../api/client";
import { useThemedStyles } from "../../theme";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

const createInitialForm = () => ({
  customerId: "",
  customerName: "",
  msStation: "",
  msSlot: "",
  product: "LPG",
  quantity: "",
  unit: "KL",
  validUntil: "",
  notes: "",
});

function normalizeTokens(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tokens)) return payload.tokens;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export default function ManualTokenAssignment() {
  useScreenPermissionSync("ManualTokenAssignment");
  const [form, setForm] = useState(createInitialForm);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const themeRef = useRef(null);

  const styles = useThemedStyles((theme) => {
    themeRef.current = theme;
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      content: { padding: theme.spacing(4), paddingBottom: 40 },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(4),
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        ...theme.shadows.level1,
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing(3),
      },
      fieldGroup: { marginBottom: theme.spacing(3) },
      label: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(2),
      },
      input: {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(3),
        backgroundColor: theme.colors.surfaceMuted,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.bodyLarge,
      },
      notesInput: { minHeight: 80, textAlignVertical: "top" },
      row: { flexDirection: "row" },
      rowItem: { flex: 1 },
      rowItemSpacer: { marginRight: theme.spacing(3) },
      submitButton: {
        marginTop: theme.spacing(2),
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing(4),
        borderRadius: theme.radii.md,
        alignItems: "center",
      },
      submitButtonDisabled: { opacity: 0.7 },
      submitButtonText: {
        color: theme.colors.surfaceElevated,
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightSemiBold,
      },
      loader: { paddingVertical: theme.spacing(6), alignItems: "center" },
      emptyState: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
      },
      tokenCard: {
        paddingVertical: theme.spacing(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      },
      tokenHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(1),
      },
      tokenId: {
        fontSize: theme.typography.sizes.bodyLarge,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
      },
      tokenStatus: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightSemiBold,
        color: "#16a34a",
      },
      tokenMeta: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing(1),
      },
      tokenNotes: {
        fontSize: theme.typography.sizes.body,
        color: "#1e3a8a",
        marginTop: theme.spacing(1),
      },
      tokenFooter: {
        marginTop: theme.spacing(2),
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.textMuted,
      },
    });
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => setForm(createInitialForm());

  const loadTokens = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await GTS.getManualTokenAssignments();
      setTokens(normalizeTokens(response));
    } catch (error) {
      console.warn("Failed to load manual tokens", error);
      if (!silent) {
        Alert.alert(
          "Unable to load tokens",
          "Manual token history could not be retrieved. Please try again."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTokens(false);
    }, [loadTokens])
  );

  const submit = async () => {
    if (!form.customerId.trim() || !form.msStation.trim()) {
      Alert.alert(
        "Missing details",
        "Customer ID and MS Station are required."
      );
      return;
    }

    const quantityNumber = parseFloat(form.quantity);
    if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert(
        "Invalid quantity",
        "Enter a quantity greater than zero for the token."
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        customerId: form.customerId.trim(),
        customerName: form.customerName.trim(),
        msStation: form.msStation.trim(),
        msSlot: form.msSlot.trim(),
        product: form.product.trim() || "LPG",
        unit: form.unit.trim() || "KL",
        quantity: quantityNumber,
        validUntil: form.validUntil.trim(),
        notes: form.notes.trim(),
      };

      const response = await GTS.assignManualToken(payload);
      const created = response?.token || response;

      if (created) {
        setTokens((prev) => [created, ...prev]);
      }
      Alert.alert(
        "Manual token assigned",
        created?.tokenId
          ? `Token ${created.tokenId} is ready to share with the FDODO customer.`
          : "The manual token has been created successfully."
      );
      resetForm();
    } catch (error) {
      console.warn("Failed to assign manual token", error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Manual token could not be assigned.";
      Alert.alert("Unable to assign token", message);
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTokens(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Assign Manual Token</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Customer ID</Text>
          <TextInput
            value={form.customerId}
            onChangeText={(value) => handleChange("customerId", value)}
            style={styles.input}
            placeholder="FDODO-001"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            value={form.customerName}
            onChangeText={(value) => handleChange("customerName", value)}
            style={styles.input}
            placeholder="Reliance Industries Ltd"
          />
        </View>

        <View style={styles.row}>
          <View
            style={[styles.fieldGroup, styles.rowItem, styles.rowItemSpacer]}
          >
            <Text style={styles.label}>MS Station</Text>
            <TextInput
              value={form.msStation}
              onChangeText={(value) => handleChange("msStation", value)}
              style={styles.input}
              placeholder="MS-12"
              autoCapitalize="characters"
            />
          </View>
          {/* <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.label}>MS Slot</Text>
            <TextInput
              value={form.msSlot}
              onChangeText={(value) => handleChange("msSlot", value)}
              style={styles.input}
              placeholder="Bay-A"
              autoCapitalize="characters"
            />
          </View> */}
        </View>
        {/* 
        <View style={styles.row}>
          <View
            style={[styles.fieldGroup, styles.rowItem, styles.rowItemSpacer]}
          >
            <Text style={styles.label}>Product</Text>
            <TextInput
              value={form.product}
              onChangeText={(value) => handleChange("product", value)}
              style={styles.input}
              placeholder="LPG"
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              value={form.quantity}
              onChangeText={(value) => handleChange("quantity", value)}
              style={styles.input}
              placeholder="25"
              keyboardType="numeric"
            />
          </View>
        </View> */}

        {/* <View style={styles.row}>
          <View
            style={[styles.fieldGroup, styles.rowItem, styles.rowItemSpacer]}
          >
            <Text style={styles.label}>Unit</Text>
            <TextInput
              value={form.unit}
              onChangeText={(value) => handleChange("unit", value)}
              style={styles.input}
              placeholder="KL"
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.label}>Valid Until</Text>
            <TextInput
              value={form.validUntil}
              onChangeText={(value) => handleChange("validUntil", value)}
              style={styles.input}
              placeholder="2025-10-30T18:00Z"
              autoCapitalize="none"
            />
          </View>
        </View> */}

        {/* <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={form.notes}
            onChangeText={(value) => handleChange("notes", value)}
            style={[styles.input, styles.notesInput]}
            placeholder="Special instructions for the MS operator"
            multiline
            numberOfLines={3}
          />
        </View> */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator
              color={themeRef.current?.colors?.surfaceElevated || "#ffffff"}
            />
          ) : (
            <Text style={styles.submitButtonText}>Assign Token</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Manual Tokens</Text>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator
              color={themeRef.current?.colors?.loaderSecondary || "#2563eb"}
            />
          </View>
        ) : tokens.length === 0 ? (
          <Text style={styles.emptyState}>
            Manual tokens that you assign will appear here.
          </Text>
        ) : (
          tokens.map((token) => (
            <View key={token.tokenId} style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <Text style={styles.tokenId}>{token.tokenId}</Text>
                <Text style={styles.tokenStatus}>
                  {token.status || "ASSIGNED"}
                </Text>
              </View>
              <Text style={styles.tokenMeta}>
                Customer:{" "}
                {token.customerName || token.customerId || "FDODO Customer"}
              </Text>
              {/* <Text style={styles.tokenMeta}>
                MS Station: {token.msStation || "-"}
                {token.msSlot ? ` (${token.msSlot})` : ""}
              </Text> */}
              {/* <Text style={styles.tokenMeta}>
                Product: {token.product} {String(token.quantity || "")}{" "}
                {token.unit}
              </Text> */}
              {/* {token.validUntil ? (
                <Text style={styles.tokenMeta}>
                  Valid Until: {token.validUntil}
                </Text>
              ) : null} */}
              {/* {token.notes ? (
                <Text style={styles.tokenNotes}>{token.notes}</Text>
              ) : null} */}
              <Text style={styles.tokenFooter}>
                Assigned at {token.assignedAt}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
