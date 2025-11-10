// src/screens/RoleSelectScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROLES } from "../constants/roles";
import { apiChooseRole } from "../lib/api";
import { useThemedStyles, useTheme } from "../theme";
import AppButton from "../components/AppButton";

export default function RoleSelectScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const { theme } = useTheme();
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: theme.colors.background },
      container: {
        flex: 1,
        padding: theme.spacing(5),
        justifyContent: "center",
        gap: theme.spacing(3),
      },
      title: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weightBold,
        textAlign: "center",
      },
      sub: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.body,
        textAlign: "center",
      },
      grid: {
        flexGrow: 1,
        gap: theme.spacing(3),
        paddingVertical: theme.spacing(2),
      },
      card: {
        flex: 1,
        height: 96,
        margin: theme.spacing(2),
      },
      list: { paddingHorizontal: theme.spacing(1) },
    })
  );

  const onPick = async (role) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedRole(role);
    
    try {
      await apiChooseRole(role);
    } catch (_error) {
      // Continue anyway - role selection is not critical
    }
    
    setLoading(false);
    navigation.navigate("Login", { role });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.sub}>Pick one to continue</Text>
        <FlatList
          data={ROLES}
          numColumns={2}
          keyExtractor={(item) => item.value}
          columnWrapperStyle={{}}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = selectedRole === item.value;
            return (
              <View style={styles.card}>
                <AppButton
                  title={item.label}
                  onPress={() => onPick(item.value)}
                  disabled={loading}
                  loading={loading && isSelected}
                  variant={isSelected ? "primary" : "secondary"}
                  style={{ flex: 1, height: "100%" }}
                  textStyle={{ textAlign: "center" }}
                />
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
