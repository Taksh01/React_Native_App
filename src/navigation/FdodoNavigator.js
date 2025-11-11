import React, { useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { gestureHandlerAvailable } from "../components/GestureCompatWrapper";
import AppIcon from "../components/AppIcon";

// FDODO Screens
import FdodoDashboard from "../screens/fdodo/FdodoDashboard";
import FDODORequest from "../screens/fdodo/FDODORequest";
import FdodoStockTransfers from "../screens/fdodo/StockTransfers";
import CurrentStocks from "../screens/customer/CurrentStocks";
import TransportTracking from "../screens/customer/TransportTracking";
import SettingsScreen from "../screens/Settings";

let createDrawerNavigator, DrawerContentScrollView, DrawerItemList;

// Conditionally import drawer navigation
if (gestureHandlerAvailable) {
  try {
    const DrawerNav = require("@react-navigation/drawer");
    createDrawerNavigator = DrawerNav.createDrawerNavigator;
    DrawerContentScrollView = DrawerNav.DrawerContentScrollView;
    DrawerItemList = DrawerNav.DrawerItemList;
  } catch (_error) {
    console.warn("Drawer navigation not available");
  }
}

// Fallback stack navigator for Expo Go
const {
  createNativeStackNavigator,
} = require("@react-navigation/native-stack");
const Stack = createNativeStackNavigator();

// Custom Drawer Content (only used when drawer is available)
const CustomDrawerContent = memo(function CustomDrawerContent(props) {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const userInitial = useMemo(() => user?.name?.charAt(0) || "F", [user?.name]);
  const userName = useMemo(() => user?.name || "FDODO Customer", [user?.name]);

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>FDODO Customer</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MENU</Text>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <AppIcon
            icon="logout"
            size={16}
            color="#dc2626"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

// Drawer Navigator (for EAS builds)
const DrawerNavigator = memo(function DrawerNavigator() {
  const Drawer = useMemo(() => createDrawerNavigator(), []);

  const drawerContent = useCallback(
    (props) => <CustomDrawerContent {...props} />,
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
        fontSize: 16,
        fontWeight: "500",
        marginLeft: -10,
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
      initialRouteName="FdodoDashboard"
      drawerContent={drawerContent}
      screenOptions={screenOptions}
    >
      <Drawer.Screen
        name="FdodoDashboard"
        component={FdodoDashboard}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color }) => (
            <AppIcon icon="dashboard" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FdodoRequests"
        component={FDODORequest}
        options={{
          title: "Requests",
          drawerIcon: ({ color }) => (
            <AppIcon icon="requests" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FdodoStocks"
        component={CurrentStocks}
        options={{
          title: "Current Stocks",
          drawerIcon: ({ color }) => (
            <AppIcon icon="stocks" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FdodoTransfers"
        component={FdodoStockTransfers}
        options={{
          title: "Stock Transfers",
          drawerIcon: ({ color }) => (
            <AppIcon icon="transfers" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FdodoTransport"
        component={TransportTracking}
        options={{
          title: "Transport Tracking",
          drawerIcon: ({ color }) => (
            <AppIcon icon="transport" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FdodoSettings"
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

// Stack Navigator (fallback for Expo Go)
function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#1e293b",
        },
        headerTintColor: "#3b82f6",
      }}
    >
      <Stack.Screen
        name="FdodoDashboard"
        component={FdodoDashboard}
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="FdodoRequests"
        component={FDODORequest}
        options={{ title: "Requests" }}
      />
      <Stack.Screen
        name="FdodoStocks"
        component={CurrentStocks}
        options={{ title: "Current Stocks" }}
      />
      <Stack.Screen
        name="FdodoTransfers"
        component={FdodoStockTransfers}
        options={{ title: "Stock Transfers" }}
      />
      <Stack.Screen
        name="FdodoTransport"
        component={TransportTracking}
        options={{ title: "Transport Tracking" }}
      />
      <Stack.Screen
        name="FdodoSettings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
}

// Main export - chooses navigator based on availability
export default function FdodoNavigator() {
  if (gestureHandlerAvailable && createDrawerNavigator) {
    return <DrawerNavigator />;
  }

  // Fallback to stack navigator for Expo Go
  console.log("Using stack navigator (Expo Go mode)");
  return <StackNavigator />;
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
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
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
