// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { apiLogin } from "../lib/api";
import NotificationService from "../services/NotificationService";
import AppButton from "../components/AppButton";
import AppTextField from "../components/AppTextField";
import { useThemedStyles } from "../theme";

export default function LoginScreen({ route, navigation }) {
  const selectedRole = route?.params?.role;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const onLogin = async () => {
    if (!selectedRole) {
      Alert.alert("Role required", "Please choose a role first.", [
        {
          text: "Choose Role",
          onPress: () => navigation.replace("RoleSelect"),
        },
      ]);
      return;
    }
    if (!email || !password) {
      Alert.alert("Missing fields", "Enter both email and password.");
      return;
    }
    try {
      setLoading(true);

      const { user, token } = await apiLogin({
        email,
        password,
        role: selectedRole,
      });

      
      // ⬇️ CHECK PERMISSIONS OBJECT ⬇️



      setUser(user, token);


      // Register device token depending on role
      try {
        if (user.role === "DBS_OPERATOR") {
          await NotificationService.initializeForDBS(user.id);

        } else if (user.role === "MS_OPERATOR") {
          await NotificationService.initializeForMS(user.id);

        } else if (user.role === "EIC") {
          await NotificationService.initializeForEIC(user.id);

        } else if (user.role === "DRIVER" || user.role === "SGL_DRIVER") {
          await NotificationService.registerDriverDeviceToken(user.id);

        }
      } catch (tokenError) {
        console.error("Failed to register/init notifications:", tokenError);
        // Don't block login for token registration failure
      }
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Login failed", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: theme.colors.background },
      keyboard: { flex: 1 },
      scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing(4),
        paddingVertical: theme.spacing(6),
        justifyContent: "center",
      },
      card: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radii.lg,
        padding: theme.spacing(5),
        gap: theme.spacing(4),
        ...theme.shadows.level1,
      },
      title: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        textAlign: "center",
        color: theme.colors.textPrimary,
      },
      roleBadge: {
        color: theme.colors.textSecondary,
        textAlign: "center",
      },
      roleAction: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weightMedium,
      },
      field: { gap: theme.spacing(2) },
      label: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weightMedium,
      },
      button: { marginTop: theme.spacing(2) },
    })
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            {!!selectedRole && (
              <Text style={styles.roleBadge}>
                Role: {selectedRole} (
                <Text
                  style={styles.roleAction}
                  onPress={() => navigation.replace("RoleSelect")}
                >
                  change
                </Text>
                )
              </Text>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <AppTextField
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <AppTextField
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
            </View>

            <AppButton
              title="Login"
              onPress={onLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
