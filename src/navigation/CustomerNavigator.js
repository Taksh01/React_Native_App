import React, { useCallback, useMemo, memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { gestureHandlerAvailable } from "../components/GestureCompatWrapper";
import { useAuth } from "../store/auth";
import AppIcon from "../components/AppIcon";

import CustomerDashboard from "../screens/customer/CustomerDashboard";
import CurrentStocks from "../screens/customer/CurrentStocks";
import TransportTracking from "../screens/customer/TransportTracking";
import StockTransfers from "../screens/customer/StockTransfers";
import TripAcceptance from "../screens/customer/TripAcceptance";
import SettingsScreen from "../screens/Settings";

let createDrawerNavigator;
let DrawerContentScrollView;
let DrawerItemList;

if (gestureHandlerAvailable) {
  try {
    const DrawerNav = require("@react-navigation/drawer");
    createDrawerNavigator = DrawerNav.createDrawerNavigator;
    DrawerContentScrollView = DrawerNav.DrawerContentScrollView;
    DrawerItemList = DrawerNav.DrawerItemList;
  } catch (error) {
    console.warn("Drawer navigation not available for customer flow", error);
  }
}

const Tab = createBottomTabNavigator();

const CustomerDrawerContent = memo(function CustomerDrawerContent(props) {
  const { logout, user } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const userInitial = useMemo(() => user?.name?.charAt(0) || "C", [user?.name]);
  const userName = useMemo(() => user?.name || "Customer", [user?.name]);

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>SGL Customer</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <AppIcon icon="logout" size={16} color="#dc2626" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const CustomerDrawerNavigator = memo(function CustomerDrawerNavigator() {
  const Drawer = useMemo(() => createDrawerNavigator(), []);

  const drawerContent = useCallback(
    (props) => <CustomerDrawerContent {...props} />,
    []
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
      },
      headerTintColor: "#3b82f6",
      drawerStyle: {
        backgroundColor: "#ffffff",
        width: 280,
      },
      drawerActiveTintColor: "#3b82f6",
      drawerActiveBackgroundColor: "#eff6ff",
      drawerInactiveTintColor: "#64748b",
      drawerLabelStyle: {
        fontSize: 15,
        fontWeight: "500",
        marginLeft: -8,
      },
      drawerItemStyle: {
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 2,
      },
      drawerType: Platform.select({ ios: "slide", default: "front" }),
      swipeEnabled: true,
      gestureEnabled: true,
      lazy: true,
      detachInactiveScreens: true,
      unmountOnBlur: false,
      freezeOnBlur: false,
      overlayColor: "rgba(0,0,0,0.35)",
      swipeEdgeWidth: 28,
      sceneContainerStyle: { backgroundColor: "#f1f5f9" },
    }),
    []
  );

  return (
    <Drawer.Navigator
      initialRouteName="CustomerDashboard"
      drawerContent={drawerContent}
      screenOptions={screenOptions}
    >
      <Drawer.Screen
        name="CustomerDashboard"
        component={CustomerDashboard}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color }) => (
            <AppIcon icon="dashboard" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="CurrentStocks"
        component={CurrentStocks}
        options={{
          title: "Current Stocks",
          drawerIcon: ({ color }) => (
            <AppIcon icon="stocks" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="TransportTracking"
        component={TransportTracking}
        options={{
          title: "Transport Tracking",
          drawerIcon: ({ color }) => (
            <AppIcon icon="transport" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="StockTransfers"
        component={StockTransfers}
        options={{
          title: "Stock Transfers",
          drawerIcon: ({ color }) => (
            <AppIcon icon="transfers" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="TripAcceptance"
        component={TripAcceptance}
        options={{
          title: "Trips",
          drawerIcon: ({ color }) => (
            <AppIcon icon="trips" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="CustomerSettings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color }) => (
            <AppIcon icon="settings" size={18} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
});

export default function CustomerNavigator() {
  if (gestureHandlerAvailable && createDrawerNavigator) {
    return <CustomerDrawerNavigator />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#1e293b",
        },
        headerTintColor: "#3b82f6",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingBottom: 20,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CustomerDashboard}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="dashboard" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stocks"
        component={CurrentStocks}
        options={{
          title: "Current Stocks",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="stocks" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transport"
        component={TransportTracking}
        options={{
          title: "Transport",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="transport" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transfers"
        component={StockTransfers}
        options={{
          title: "Transfers",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="transfers" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripAcceptance}
        options={{
          title: "Trips",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="trips" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="settings" size={18} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  drawerHeader: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: "#64748b",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 12,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
  },
});
